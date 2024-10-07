import jwt
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import User, get_session_local
from models.auth_settings import auth_settings
from models.user import UserModel
from models.user_token import UserToken
from services.chat_service import ChatService
from models.requests import MessageRequest
import logging

# Configure logging
logging.basicConfig(level=logging.ERROR)

app = FastAPI()

# Constants
ORIGINS = [
    "http://localhost:3000",  # Replace with your React app URL
    "http://127.0.0.1:3000",  # React local development
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,  # Allows requests from these origins
    allow_credentials=True,  # Allows cookies or authentication headers
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    :param password: The plaintext password to hash
    :return: The hashed password
    """
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logging.error(f"Error hashing password: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    :param plain_password: The plaintext password to verify
    :param hashed_password: The hashed password to compare against
    :return: True if passwords match, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logging.error(f"Error verifying password: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def create_access_token(
    data: dict, expires_delta: timedelta = timedelta(hours=24)
) -> str:
    """
    Create a JWT token.

    :param data: The payload data to encode in the JWT
    :param expires_delta: The expiration time for the token
    :return: The encoded JWT token
    """
    try:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, auth_settings.secret_key, algorithm=auth_settings.algorithm
        )
        return encoded_jwt
    except Exception as e:
        logging.error(f"Error creating access token: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def get_current_user(
    request: Request, db: Session = Depends(get_session_local)
) -> User:
    """
    Get the current user by decoding the JWT token.

    :param request: The incoming HTTP request containing the Authorization header
    :param db: The database session
    :return: The authenticated User object
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(
            token, auth_settings.secret_key, algorithms=[auth_settings.algorithm]
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logging.error(f"Error decoding token: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Instantiate the service layer
chat_service = ChatService()


@app.post("/register", response_model=UserToken)
def register(user: UserModel, db: Session = Depends(get_session_local)) -> dict:
    """
    Register a new user.

    :param user: The user details for registration
    :param db: The database session
    :return: The access token for the registered user
    """
    try:
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username is already taken")

        new_user = User(
            username=user.username, hashed_password=hash_password(user.password)
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        access_token = create_access_token({"sub": new_user.username})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/login", response_model=UserToken)
def login(user: UserModel, db: Session = Depends(get_session_local)) -> dict:
    """
    Authenticate a user and return a JWT token.

    :param user: The user login details
    :param db: The database session
    :return: The access token for the authenticated user
    """
    try:
        db_user = db.query(User).filter(User.username == user.username).first()
        if not db_user or not verify_password(user.password, db_user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        access_token = create_access_token({"sub": db_user.username})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error logging in user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/chat/init")
async def create_chat(
    chat_name: str,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Create a new chat for the current user.

    :param chat_name: The name of the new chat
    :param db: The database session
    :param current_user: The current authenticated user
    :return: The details of the created chat
    """
    try:
        return chat_service.create_chat(chat_name, db, current_user.id)
    except Exception as e:
        logging.error(f"Error creating chat: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/chat/{chat_id}")
async def get_chat_interactions(
    chat_id: str,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get all interactions for a specific chat.

    :param chat_id: The ID of the chat
    :param db: The database session
    :param current_user: The current authenticated user
    :return: The interactions for the specified chat
    """
    try:
        if not chat_service.verify_user_ownership(chat_id, current_user.id, db):
            raise HTTPException(
                status_code=403, detail="You do not have permission to access this chat."
            )
        chat_data = chat_service.get_chat(chat_id, db)
        if chat_data is None:
            raise HTTPException(status_code=404, detail="Chat ID not found")
        return chat_data
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error retrieving chat interactions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/chat/{chat_id}/message")
async def add_message(
    chat_id: str,
    message: MessageRequest,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Add a message to a chat.

    :param chat_id: The ID of the chat
    :param message: The message to add
    :param db: The database session
    :param current_user: The current authenticated user
    :return: The details of the added interaction
    """
    try:
        if not chat_service.verify_user_ownership(chat_id, current_user.id, db):
            raise HTTPException(
                status_code=403, detail="You do not have permission to access this chat."
            )
        interaction = chat_service.add_message(chat_id, message.message, db)
        if interaction is None:
            raise HTTPException(status_code=404, detail="Chat ID not found")
        return interaction
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error adding message to chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.patch("/chat/{chat_id}/message/{interaction_id}")
async def edit_message(
    chat_id: str,
    interaction_id: str,
    message: MessageRequest,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> list:
    """
    Edit a message in a chat.

    :param chat_id: The ID of the chat
    :param interaction_id: The ID of the interaction to edit
    :param message: The new message content
    :param db: The database session
    :param current_user: The current authenticated user
    :return: A list of updated interactions in the chat
    """
    try:
        if not chat_service.verify_user_ownership(chat_id, current_user.id, db):
            raise HTTPException(
                status_code=403, detail="You do not have permission to edit messages in this chat."
            )
        response = chat_service.edit_message(interaction_id, message.message, db)
        if response is None:
            raise HTTPException(status_code=404, detail="Interaction ID not found")
        return response
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error editing message {interaction_id} in chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/chat/{chat_id}/message/{interaction_id}")
async def delete_message(
    chat_id: str,
    interaction_id: str,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> list:
    """
    Delete a message and all subsequent messages in a chat.

    :param chat_id: The ID of the chat
    :param interaction_id: The ID of the interaction to delete
    :param db: The database session
    :param current_user: The current authenticated user
    :return: A list of remaining interactions in the chat
    """
    try:
        if not chat_service.verify_user_ownership(chat_id, current_user.id, db):
            raise HTTPException(
                status_code=403, detail="You do not have permission to delete messages in this chat."
            )
        response = chat_service.delete_message(interaction_id, db)
        if response is None:
            raise HTTPException(status_code=404, detail="Interaction ID not found")
        return response
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting message {interaction_id} in chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/chats")
async def list_user_chats(
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> list:
    """
    List all chats for the current user.

    :param db: The database session
    :param current_user: The current authenticated user
    :return: A list of chats belonging to the user
    """
    try:
        user_chats = chat_service.list_user_chats(current_user.id, db)
        return user_chats
    except Exception as e:
        logging.error(f"Error listing chats for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


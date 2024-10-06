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
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: dict, expires_delta: timedelta = timedelta(hours=24)
) -> str:
    """Create a JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, auth_settings.secret_key, algorithm=auth_settings.algorithm
    )
    return encoded_jwt


def get_current_user(
    request: Request, db: Session = Depends(get_session_local)
) -> User:
    """Get the current user by decoding the JWT token."""
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


# Instantiate the service layer
chat_service = ChatService()


@app.post("/register", response_model=UserToken)
def register(user: UserModel, db: Session = Depends(get_session_local)) -> dict:
    """Register a new user."""
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


@app.post("/login", response_model=UserToken)
def login(user: UserModel, db: Session = Depends(get_session_local)) -> dict:
    """Authenticate a user and return a JWT token."""
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Bad username or password")

    access_token = create_access_token({"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/chat/init")
async def create_chat(
    chat_name: str,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create a new chat for the current user."""
    return chat_service.create_chat(chat_name, db, current_user.id)


@app.get("/chat/{chat_id}")
async def get_chat_interactions(
    chat_id: str,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get all interactions for a specific chat."""
    if not chat_service.verify_user_ownership(chat_id, current_user.id):
        raise HTTPException(
            status_code=403, detail="You do not have permission to access this chat."
        )
    chat_data = chat_service.get_chat(chat_id, db)
    if chat_data is None:
        raise HTTPException(status_code=404, detail="Chat ID not found")
    return chat_data


@app.post("/chat/{chat_id}/message")
async def add_message(
    chat_id: str,
    message: MessageRequest,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Add a message to a chat."""
    if not chat_service.verify_user_ownership(chat_id, current_user.id):
        raise HTTPException(
            status_code=403, detail="You do not have permission to access this chat."
        )
    interaction = chat_service.add_message(chat_id, message.message, db)
    if interaction is None:
        raise HTTPException(status_code=404, detail="Chat ID not found")
    return interaction


@app.patch("/chat/{chat_id}/message/{interaction_id}")
async def edit_message(
    chat_id: str,
    interaction_id: str,
    message: MessageRequest,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> list:
    """Edit a message in a chat."""
    if not chat_service.verify_user_ownership(chat_id, current_user.id):
        raise HTTPException(
            status_code=403, detail="You do not have permission to access this chat."
        )
    remaining_interactions = chat_service.edit_message(
        interaction_id, message.message, db
    )
    if remaining_interactions is None:
        raise HTTPException(status_code=404, detail="Interaction ID not found")
    return remaining_interactions


@app.delete("/chat/{chat_id}/message/{interaction_id}")
async def delete_message(
    chat_id: str,
    interaction_id: str,
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> list:
    """Delete a message from a chat."""
    if not chat_service.verify_user_ownership(chat_id, current_user.id):
        raise HTTPException(
            status_code=403, detail="You do not have permission to access this chat."
        )
    remaining_interactions = chat_service.delete_message(interaction_id, db)
    if remaining_interactions is None:
        raise HTTPException(status_code=404, detail="Interaction ID not found")
    return remaining_interactions


@app.get("/chats")
async def list_user_chats(
    db: Session = Depends(get_session_local),
    current_user: User = Depends(get_current_user),
) -> list:
    """List all chats for the current user."""
    return chat_service.list_user_chats(current_user.id, db)

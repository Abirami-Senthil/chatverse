from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from services.chat_service import ChatService
from repository.chat_repository import ChatRepository
from models.requests import MessageRequest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Define allowed origins (domains that can access the API)
origins = [
    "http://localhost:3000",  # Replace with your React app URL
    "http://127.0.0.1:3000",  # React local development
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows requests from these origins
    allow_credentials=True,  # Allows cookies or authentication headers
    allow_methods=["*"],     # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],     # Allows all headers
)


# Predefined responses for common queries
predefined_responses = {
    "hello": "Hello! How can I assist you today?",
    "what is your name?": "I am a simple chatbot created to assist you.",
    "how are you?": "I'm doing well! Thanks for asking. How can I assist you today?",
    "bye": "Goodbye! Have a great day!",
}

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Instantiate the service layer
chat_repository = ChatRepository()
chat_service = ChatService(chat_repository)

@app.get("/chat/init")
async def create_chat(db: Session = Depends(get_db)):
    chat_id, interaction = chat_service.create_chat(db, predefined_responses)
    return {"chat_id": chat_id, "interaction": interaction}

@app.get("/chat/{chat_id}")
async def get_chat_interactions(chat_id: str, db: Session = Depends(get_db)):
    chat_data = chat_repository.load_chat_from_db(chat_id, db)
    if chat_data is None:
        raise HTTPException(status_code=404, detail="Chat ID not found")
    return {"chat_id": chat_id, "interactions": chat_data}

@app.post("/chat/{chat_id}/message")
async def add_message(chat_id: str, message: MessageRequest, db: Session = Depends(get_db)):
    interaction = chat_service.add_message(chat_id, message.message, db, predefined_responses)
    if interaction is None:
        raise HTTPException(status_code=404, detail="Chat ID not found")
    return {"chat_id": chat_id, "interaction": interaction}

@app.patch("/chat/{chat_id}/message/{interaction_id}")
async def edit_message(chat_id: str, interaction_id: str, message_request: MessageRequest, db: Session = Depends(get_db)):
    interaction = chat_service.edit_message_by_id(chat_id, interaction_id, message_request.message, db, predefined_responses)
    if interaction is None:
        raise HTTPException(status_code=404, detail="Interaction with the given interaction_id not found")
    return {"chat_id": chat_id, "interaction": interaction}

@app.delete("/chat/{chat_id}/message/{interaction_id}")
async def delete_message(chat_id: str, interaction_id: str, db: Session = Depends(get_db)):
    remaining_interactions = chat_service.delete_message_by_id(chat_id, interaction_id, db)
    if remaining_interactions is None:
        raise HTTPException(status_code=404, detail="Interaction with the given interaction_id not found")
    return {"chat_id": chat_id, "remaining_interactions": remaining_interactions}

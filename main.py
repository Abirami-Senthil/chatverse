from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from services.chat_service import ChatService
from repository.chat_repository import ChatRepository
from models.requests import MessageRequest

app = FastAPI()

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

@app.patch("/chat/{chat_id}/message/{index}")
async def edit_message(chat_id: str, index: int, message: MessageRequest, db: Session = Depends(get_db)):
    interaction = chat_service.edit_message(chat_id, index, message.message, db, predefined_responses)
    if interaction is None:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return {"chat_id": chat_id, "interaction": interaction}

@app.delete("/chat/{chat_id}/message/{index}")
async def delete_message(chat_id: str, index: int, db: Session = Depends(get_db)):
    remaining_interactions = chat_service.delete_message(chat_id, index, db)
    if remaining_interactions is None:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return {"chat_id": chat_id, "remaining_interactions": remaining_interactions}

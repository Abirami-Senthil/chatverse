from fastapi import FastAPI, HTTPException
from datetime import datetime, timezone
from typing import List, Dict, Union
from models.requests import MessageRequest


app = FastAPI()

chats_db: Dict[int, List[Dict[str, Union[str, int, datetime]]]] = {}
chat_counter = 1

predefined_responses = {
    "hello": "Hello! How can I assist you today?",
    "what is your name?": "I am a simple chatbot created to assist you.",
    "how are you?": "I'm doing well! Thanks for asking. How can I assist you today?",
    "bye": "Goodbye! Have a great day!",
}

def create_interaction(message: Union[str, None], response: str, index: int):
    return {
        "index": index,
        "message": message,
        "response": response,
        "timestamp": datetime.now(timezone.utc),
    }

@app.get("/chat/init")
async def create_chat():
    global chat_counter
    chat_id = chat_counter
    chat_counter += 1

    greeting = predefined_responses["hello"]
    interaction = create_interaction(message=None, response=greeting, index=0)
    chats_db[chat_id] = [interaction]

    return {"chat_id": chat_id, "interaction": interaction}

@app.get("/chat/{chat_id}")
async def get_chat_interactions(chat_id: int):
    if chat_id not in chats_db:
        raise HTTPException(status_code=404, detail="Chat ID not found")

    return {"chat_id": chat_id, "interactions": chats_db[chat_id]}

@app.post("/chat/{chat_id}/message")
async def add_message(chat_id: int, message: MessageRequest):
    if chat_id not in chats_db:
        raise HTTPException(status_code=404, detail="Chat ID not found")

    user_message = message.message.strip().lower()

    response = predefined_responses.get(user_message, "Sorry, I don't understand that. Can you ask something else?")
    
    new_index = len(chats_db[chat_id])
    interaction = create_interaction(message=message.message, response=response, index=new_index)

    chats_db[chat_id].append(interaction)

    return {"chat_id": chat_id, "interaction": interaction}

@app.patch("/chat/{chat_id}/message/{index}")
async def edit_message(chat_id: int, index: int, message: MessageRequest):
    if chat_id not in chats_db:
        raise HTTPException(status_code=404, detail="Chat ID not found")

    if index >= len(chats_db[chat_id]):
        raise HTTPException(status_code=404, detail="Interaction index not found")

    user_message = message.message.strip().lower()
    response = predefined_responses.get(user_message, "Sorry, I don't understand that. Can you ask something else?")
    
    chats_db[chat_id][index] = create_interaction(message=message.message, response=response, index=index)

    chats_db[chat_id] = chats_db[chat_id][:index + 1]

    return {"chat_id": chat_id, "interaction": chats_db[chat_id][index]}

@app.delete("/chat/{chat_id}/message/{index}")
async def delete_message(chat_id: int, index: int):
    if chat_id not in chats_db:
        raise HTTPException(status_code=404, detail="Chat ID not found")

    if index >= len(chats_db[chat_id]):
        raise HTTPException(status_code=404, detail="Interaction index not found")

    chats_db[chat_id] = chats_db[chat_id][:index]

    return {"chat_id": chat_id, "remaining_interactions": chats_db[chat_id]}


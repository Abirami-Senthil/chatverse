from repository.chat_repository import ChatRepository
from sqlalchemy.orm import Session

class ChatService:
    def __init__(self, chat_repo: ChatRepository):
        self.chat_repo = chat_repo

    def create_chat(self, db: Session, predefined_responses: dict):
        # Use the repository to create a new chat
        greeting = predefined_responses["hello"]
        return self.chat_repo.create_chat(db, greeting)

    def add_message(self, chat_id: str, message: str, db: Session, predefined_responses: dict):
        user_message = message.strip().lower()
        response = predefined_responses.get(user_message, "Sorry, I don't understand that. Can you ask something else?")
        return self.chat_repo.add_message(chat_id, message, response, db)

    def edit_message_by_id(self, chat_id: str, interaction_id: str, new_message: str, db: Session, predefined_responses: dict):
        user_message = new_message.strip().lower()
        response = predefined_responses.get(user_message, "Sorry, I don't understand that. Can you ask something else?")
        return self.chat_repo.edit_message_by_id(chat_id, interaction_id, new_message, response, db)

    def delete_message_by_id(self, chat_id: str, interaction_id: str, db: Session):
        return self.chat_repo.delete_message_by_id(chat_id, interaction_id, db)
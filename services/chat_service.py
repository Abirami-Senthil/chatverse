from repository.chat_repository import ChatRepository
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import logging

class ChatService:
    def __init__(self, chat_repo: ChatRepository):
        """Initialize the ChatService with a ChatRepository instance."""
        self.chat_repo = chat_repo

    def create_chat(self, db: Session, user_id: str, predefined_responses: Dict[str, str]) -> Optional[Dict[str, str]]:
        """
        Create a new chat for a user.

        :param db: Database session
        :param user_id: ID of the user creating the chat
        :param predefined_responses: Dictionary of predefined responses
        :return: A dictionary containing the chat ID and initial interaction
        """
        try:
            greeting = predefined_responses["hello"]
            return self.chat_repo.create_chat(db, user_id, greeting)
        except Exception as e:
            logging.error(f"Error creating chat for user {user_id}: {e}")
            return None

    def add_message(self, chat_id: str, message: str, db: Session, predefined_responses: Dict[str, str]) -> Optional[Dict[str, str]]:
        """
        Add a message to an existing chat.

        :param chat_id: ID of the chat
        :param message: Message to add
        :param db: Database session
        :param predefined_responses: Dictionary of predefined responses
        :return: A dictionary containing the updated interaction
        """
        try:
            return self.chat_repo.add_message(chat_id, message, db, predefined_responses)
        except Exception as e:
            logging.error(f"Error adding message to chat {chat_id}: {e}")
            return None

    def edit_message(self, interaction_id: str, new_message: str, db: Session, predefined_responses: Dict[str, str]) -> Optional[Dict[str, str]]:
        """
        Edit a message within a chat.

        :param interaction_id: ID of the interaction to edit
        :param new_message: New message content
        :param db: Database session
        :param predefined_responses: Dictionary of predefined responses
        :return: A dictionary containing the updated interaction
        """
        try:
            return self.chat_repo.edit_message(interaction_id, new_message, db, predefined_responses)
        except Exception as e:
            logging.error(f"Error editing message {interaction_id}: {e}")
            return None

    def delete_message(self, interaction_id: str, db: Session) -> Optional[List[Dict[str, str]]]:
        """
        Delete a message and all subsequent messages in a chat.

        :param interaction_id: ID of the interaction to delete
        :param db: Database session
        :return: A list of remaining interactions
        """
        try:
            return self.chat_repo.delete_message(interaction_id, db)
        except Exception as e:
            logging.error(f"Error deleting message {interaction_id}: {e}")
            return None

    def get_chat(self, chat_id: str, db: Session) -> Optional[List[Dict[str, str]]]:
        """
        Get all interactions for a specific chat.

        :param chat_id: ID of the chat
        :param db: Database session
        :return: A list of interactions
        """
        try:
            chat_data = self.chat_repo.load_chat_from_db(chat_id, db)
            if not chat_data:
                return None
            return chat_data["interactions"]
        except Exception as e:
            logging.error(f"Error retrieving chat {chat_id}: {e}")
            return None

    def verify_user_ownership(self, chat_id: str, user_id: str) -> bool:
        """
        Verify if the given user is the owner of the chat.

        :param chat_id: ID of the chat
        :param user_id: ID of the user
        :return: True if the user owns the chat, False otherwise
        """
        try:
            return self.chat_repo.verify_user_ownership(chat_id, user_id)
        except Exception as e:
            logging.error(f"Error verifying ownership for chat {chat_id} and user {user_id}: {e}")
            return False

    def list_user_chats(self, user_id: str, db: Session) -> List[Dict[str, str]]:
        """
        List all chats for a given user.

        :param user_id: ID of the user
        :param db: Database session
        :return: A list of chats
        """
        try:
            chats = db.query(ChatRepository.Chat).filter(ChatRepository.Chat.user_id == user_id).all()
            return [{"chat_id": chat.id, "user_id": chat.user_id} for chat in chats]
        except Exception as e:
            logging.error(f"Error listing chats for user {user_id}: {e}")
            return []
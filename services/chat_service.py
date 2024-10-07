import random
from repository.chat_repository import ChatRepository
from services.contants import predefined_responses
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import logging


class ChatService:
    def __init__(self):
        """Initialize the ChatService with a ChatRepository instance."""
        self.chat_repo = ChatRepository()

    def create_chat(
        self, chat_name: str, db: Session, user_id: str
    ) -> Optional[Dict[str, str]]:
        """
        Create a new chat for a user.

        :param db: Database session
        :param user_id: ID of the user creating the chat
        :return: A dictionary containing the chat ID and initial interaction
        """
        try:
            greeting = predefined_responses["Hello"]
            response = self.chat_repo.create_chat(chat_name, greeting, db, user_id)
            response["interaction"]["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            logging.error(f"Error creating chat for user {user_id}: {e}")
            return None

    def add_message(
        self, chat_id: str, message: str, db: Session
    ) -> Optional[Dict[str, str]]:
        """
        Add a message to an existing chat.

        :param chat_id: ID of the chat
        :param message: Message to add
        :param db: Database session
        :return: A dictionary containing the updated interaction
        """
        try:
            response = self.chat_repo.add_message(
                chat_id, message, self.get_response(message), db
            )
            response["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            logging.error(f"Error adding message to chat {chat_id}: {e}")
            return None

    def edit_message(
        self, interaction_id: str, new_message: str, db: Session
    ) -> Optional[List[Dict]]:
        """
        Edit a message within a chat.

        :param interaction_id: ID of the interaction to edit
        :param new_message: New message content
        :param db: Database session
        :return: A dictionary containing the updated interaction
        """
        try:
            response = self.chat_repo.edit_message(
                interaction_id, new_message, self.get_response(new_message), db
            )
            if response is not None and len(response) > 0:
                response[-1]["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            logging.error(f"Error editing message {interaction_id}: {e}")
            return None

    def delete_message(
        self, interaction_id: str, db: Session
    ) -> Optional[List[Dict[str, str]]]:
        """
        Delete a message and all subsequent messages in a chat.

        :param interaction_id: ID of the interaction to delete
        :param db: Database session
        :return: A list of remaining interactions
        """
        try:
            response = self.chat_repo.delete_message(interaction_id, db)
            if response is not None and len(response) > 0:
                response[-1]["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            logging.error(f"Error deleting message {interaction_id}: {e}")
            return None

    def get_chat(self, chat_id: str, db: Session) -> Optional[Dict[str, str]]:
        """
        Get all interactions for a specific chat.

        :param chat_id: ID of the chat
        :param db: Database session
        :return: A list of interactions
        """
        try:
            response = self.chat_repo.get_chat(chat_id, db)
            if (
                response is not None
                and response["interactions"] is not None
                and len(response["interactions"]) > 0
            ):
                response["interactions"][-1]["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            logging.error(f"Error retrieving chat {chat_id}: {e}")
            return None

    def verify_user_ownership(self, chat_id: str, user_id: str, db: Session) -> bool:
        """
        Verify if the given user is the owner of the chat.

        :param chat_id: ID of the chat
        :param user_id: ID of the user
        :return: True if the user owns the chat, False otherwise
        """
        try:
            return self.chat_repo.verify_user_ownership(chat_id, user_id, db)
        except Exception as e:
            logging.error(
                f"Error verifying ownership for chat {chat_id} and user {user_id}: {e}"
            )
            return False

    def list_user_chats(self, user_id: str, db: Session) -> List[Dict[str, str]]:
        """
        List all chats for a given user.

        :param user_id: ID of the user
        :param db: Database session
        :return: A list of chats
        """
        try:
            return self.chat_repo.list_user_chats(user_id, db)
        except Exception as e:
            logging.error(f"Error listing chats for user {user_id}: {e}")
            return []

    def verify_user_ownership(self, chat_id: str, user_id: str, db: Session) -> bool:
        """
        Verify if the given user is the owner of the chat.

        :param chat_id: ID of the chat
        :param user_id: ID of the user
        :return: True if the user owns the chat, False otherwise
        """
        try:
            return self.chat_repo.verify_user_ownership(chat_id, user_id, db)
        except Exception as e:
            logging.error(
                f"Error verifying chat ownership for chat {chat_id} and user {user_id}: {e}"
            )
            return False

    @staticmethod
    def get_response(message: str) -> str:
        """
        Get a response based on the message.

        :param message: Message to get a response for
        :return: Response
        """
        for key in predefined_responses.keys():
            if key.lower() in message.strip().lower():
                return predefined_responses[key]
        return "Sorry, I don't understand that. Can you ask something else?"

    @staticmethod
    def get_suggestions() -> List[str]:
        """
        Get a list of suggestions based on the message.

        :param message: Message to get suggestions for
        :return: List of suggestions
        """
        return random.sample(list(predefined_responses.keys()), 3)

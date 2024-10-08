import random
import logging
from typing import Dict, List, Optional
from fastapi import Depends
from repository.chat_repository import ChatRepository
from constants import predefined_responses


class ChatService:
    def __init__(self, chat_repo: ChatRepository = Depends(ChatRepository)):
        """
        Initialize the ChatService with a ChatRepository instance.

        :param chat_repo: An instance of ChatRepository for database operations
        """
        self.chat_repo = chat_repo
        self.logger = logging.getLogger(__name__)

    def create_chat(self, chat_name: str, user_id: str) -> Optional[Dict[str, str]]:
        """
        Create a new chat for a user.

        :param chat_name: Name of the chat
        :param user_id: ID of the user creating the chat
        :return: A dictionary containing the chat ID and initial interaction if successful, None otherwise
        """
        try:
            greeting = self.get_response("Hello")
            response = self.chat_repo.create_chat(chat_name, greeting, user_id)
            if response is not None:
                response["interaction"]["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            self.logger.error(f"Error creating chat for user {user_id}: {str(e)}")
            return None

    def add_message(self, chat_id: str, message: str) -> Optional[Dict[str, str]]:
        """
        Add a message to an existing chat.

        :param chat_id: ID of the chat
        :param message: Message to add
        :return: A dictionary containing the updated interaction if successful, None otherwise
        """
        try:
            response = self.chat_repo.add_message(
                chat_id, message, self.get_response(message)
            )
            if response is not None:
                response["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            self.logger.error(f"Error adding message to chat {chat_id}: {str(e)}")
            return None

    def edit_message(
        self, interaction_id: str, new_message: str
    ) -> Optional[List[Dict]]:
        """
        Edit a message within a chat.

        :param interaction_id: ID of the interaction to edit
        :param new_message: New message content
        :return: A list of updated interactions if successful, None otherwise
        """
        try:
            response = self.chat_repo.edit_message(
                interaction_id, new_message, self.get_response(new_message)
            )
            if response and len(response) > 0:
                response[-1]["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            self.logger.error(f"Error editing message {interaction_id}: {str(e)}")
            return None

    def delete_message(self, interaction_id: str) -> Optional[List[Dict[str, str]]]:
        """
        Delete a message and all subsequent messages in a chat.

        :param interaction_id: ID of the interaction to delete
        :return: A list of remaining interactions if successful, None otherwise
        """
        try:
            response = self.chat_repo.delete_message(interaction_id)
            if response and len(response) > 0:
                response[-1]["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            self.logger.error(f"Error deleting message {interaction_id}: {str(e)}")
            return None

    def get_chat(self, chat_id: str) -> Optional[Dict[str, str]]:
        """
        Get all interactions for a specific chat.

        :param chat_id: ID of the chat
        :return: A dictionary containing chat interactions if successful, None otherwise
        """
        try:
            response = self.chat_repo.get_chat(chat_id)
            if (
                response
                and response.get("interactions")
                and len(response["interactions"]) > 0
            ):
                response["interactions"][-1]["suggestions"] = self.get_suggestions()
            return response
        except Exception as e:
            self.logger.error(f"Error retrieving chat {chat_id}: {str(e)}")
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
            self.logger.error(
                f"Error verifying ownership for chat {chat_id} and user {user_id}: {str(e)}"
            )
            return False

    def list_user_chats(self, user_id: str) -> List[Dict[str, str]]:
        """
        List all chats for a given user.

        :param user_id: ID of the user
        :return: A list of chats belonging to the user
        """
        try:
            return self.chat_repo.list_user_chats(user_id)
        except Exception as e:
            self.logger.error(f"Error listing chats for user {user_id}: {str(e)}")
            return []

    @staticmethod
    def get_response(message: str) -> str:
        """
        Get a response based on the message.

        :param message: Message to get a response for
        :return: Response message
        """
        try:
            message = message.strip().lower()
            for key, response in predefined_responses.items():
                if key.lower() in message:
                    return response
            return "Sorry, I don't understand that. Can you ask something else?"
        except Exception as e:
            logging.error(
                f"Error generating response for message '{message}': {str(e)}"
            )
            return "An error occurred while generating a response. Please try again."

    @staticmethod
    def get_suggestions() -> List[str]:
        """
        Get a list of suggestions for the user.

        :return: List of suggestions
        """
        try:
            return random.sample(
                list(predefined_responses.keys()), min(3, len(predefined_responses))
            )
        except Exception as e:
            logging.error(f"Error generating suggestions: {str(e)}")
            return [
                "Can you try rephrasing that?",
                "What else can I help with?",
                "Do you need more information?",
            ]

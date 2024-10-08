from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from config import LOG_LEVEL
from repository.database import Interaction, Chat, get_session_local
from datetime import datetime, timezone
from typing import Dict, List, Union, Optional
import uuid
import logging

# Configure logging
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# In-memory cache for recently used chats
chat_cache: Dict[str, Dict] = {}
user_chats_cache: Dict[str, List[Dict[str, str]]] = {}


class ChatRepository:
    def __init__(self, db: Session = Depends(get_session_local)):
        self.db = db

    def create_interaction(
        self, message: Optional[str], response: str, interaction_id: str, index: int
    ) -> Dict[str, Union[str, int, datetime]]:
        """
        Create an interaction dictionary.

        :param message: The message content from the user (optional)
        :param response: The response from the chatbot
        :param interaction_id: Unique identifier for the interaction
        :param index: Index of the interaction in the chat sequence
        :return: A dictionary representing the interaction
        """
        return {
            "interaction_id": interaction_id,
            "index": index,
            "message": message,
            "response": response,
            "timestamp": datetime.now(timezone.utc),
        }

    def create_chat(
        self, chat_name: str, greeting: str, user_id: str
    ) -> Optional[dict]:
        """
        Create a new chat and store it in the database.

        :param user_id: ID of the user creating the chat
        :param chat_name: Name of the chat
        :param greeting: Initial greeting message
        :return: A dictionary with chat ID, initial interaction, and chat name if successful, None otherwise
        """
        try:
            chat_id = str(uuid.uuid4())
            interaction_id = str(uuid.uuid4())
            index = 0
            interaction = self.create_interaction(
                message=None,
                response=greeting,
                interaction_id=interaction_id,
                index=index,
            )

            # Store chat in SQLite database
            db_chat = Chat(id=chat_id, user_id=user_id, name=chat_name)
            self.db.add(db_chat)

            # Store interaction in SQLite database
            db_interaction = Interaction(
                id=interaction_id,
                chat_id=chat_id,
                index=index,
                message=None,
                response=greeting,
            )
            self.db.add(db_interaction)
            self.db.commit()

            chat_data = {
                "user_id": user_id,
                "interactions": [interaction],
                "chat_name": chat_name,
                "chat_id": chat_id,
            }
            # Cache the interaction and chat details
            chat_cache[chat_id] = chat_data

            # Update user chats cache
            if user_id in user_chats_cache:
                user_chats_cache[user_id].append(
                    {"chat_id": chat_id, "chat_name": chat_name}
                )
            else:
                user_chats_cache[user_id] = [
                    {"chat_id": chat_id, "chat_name": chat_name}
                ]

            return {
                "chat_id": chat_id,
                "interaction": interaction,
                "chat_name": chat_name,
            }
        except SQLAlchemyError as e:
            logger.error(f"Error creating chat for user {user_id}: {e}")
            self.db.rollback()
            return None

    def load_chat_from_db(
        self, chat_id: str
    ) -> Optional[Dict[str, Union[str, List[Dict]]]]:
        """
        Load chat interactions from the database.

        :param chat_id: ID of the chat
        :return: Dictionary of chat data if found, None otherwise
        """
        try:
            interactions = (
                self.db.query(Interaction)
                .filter(Interaction.chat_id == chat_id)
                .order_by(Interaction.index)
                .all()
            )

            if not interactions:
                return None

            chat = self.db.query(Chat).filter(Chat.id == chat_id).first()
            if not chat:
                return None

            chat_data = {
                "user_id": chat.user_id,
                "chat_name": chat.name,
                "chat_id": chat_id,
                "interactions": [
                    {
                        "interaction_id": i.id,
                        "index": i.index,
                        "message": i.message,
                        "response": i.response,
                        "timestamp": i.timestamp,
                    }
                    for i in interactions
                ],
            }

            chat_cache[chat_id] = chat_data
            return chat_data
        except SQLAlchemyError as e:
            logger.error(f"Error loading chat {chat_id} from database: {e}")
            return None

    def verify_user_ownership(self, chat_id: str, user_id: str) -> bool:
        """
        Verify if the given user is the owner of the chat.

        :param chat_id: ID of the chat
        :param user_id: ID of the user
        :return: True if the user owns the chat, False otherwise
        """
        if chat_id not in chat_cache:
            chat_data = self.load_chat_from_db(chat_id)
            if chat_data is None:
                return False
            chat_cache[chat_id] = chat_data
        return chat_cache[chat_id]["user_id"] == user_id

    def add_message(self, chat_id: str, message: str, response: str) -> Optional[Dict]:
        """
        Add a message to a chat.

        :param chat_id: ID of the chat
        :param message: Message to add
        :param response: Response to add
        :return: Dictionary of the new interaction if successful, None otherwise
        """
        try:
            if chat_id not in chat_cache:
                chat_data = self.load_chat_from_db(chat_id)
                if chat_data is None:
                    return None

            new_index = len(chat_cache[chat_id]["interactions"])
            interaction_id = str(uuid.uuid4())
            interaction = self.create_interaction(
                message=message,
                response=response,
                interaction_id=interaction_id,
                index=new_index,
            )

            db_interaction = Interaction(
                id=interaction_id,
                chat_id=chat_id,
                index=new_index,
                message=message,
                response=response,
            )
            self.db.add(db_interaction)
            self.db.commit()

            chat_cache[chat_id]["interactions"].append(interaction)

            return interaction
        except SQLAlchemyError as e:
            logger.error(f"Error adding message to chat {chat_id}: {e}")
            self.db.rollback()
            return None

    def edit_message(
        self, interaction_id: str, new_message: str, new_response: str
    ) -> Optional[List[Dict]]:
        """
        Edit a message within a chat.

        :param interaction_id: ID of the interaction to edit
        :param new_message: New message content
        :param new_response: New response content
        :return: List of remaining interactions in the chat if successful, None otherwise
        """
        try:
            interaction = (
                self.db.query(Interaction)
                .filter(Interaction.id == interaction_id)
                .first()
            )
            if not interaction:
                return None

            interaction.message = new_message
            interaction.response = new_response
            interaction.timestamp = datetime.now(timezone.utc)
            updated_interaction_index = interaction.index
            chat_id = interaction.chat_id

            # Delete subsequent interactions
            self.db.query(Interaction).filter(
                Interaction.chat_id == chat_id,
                Interaction.index > updated_interaction_index,
            ).delete()
            self.db.commit()

            if chat_id in chat_cache:
                interactions = chat_cache[chat_id]["interactions"]
                for i, cached_interaction in enumerate(interactions):
                    if cached_interaction["interaction_id"] == interaction_id:
                        interactions[i]["message"] = new_message
                        interactions[i]["response"] = new_response
                        chat_cache[chat_id]["interactions"] = interactions[: i + 1]
                        break
                return chat_cache[chat_id]["interactions"]

            chat_data = self.load_chat_from_db(chat_id)
            return chat_data["interactions"] if chat_data else None
        except SQLAlchemyError as e:
            logger.error(f"Error editing message {interaction_id}: {e}")
            self.db.rollback()
            return None

    def delete_message(self, interaction_id: str) -> Optional[List[Dict]]:
        """
        Delete a message and all subsequent messages in a chat.

        :param interaction_id: ID of the interaction to delete
        :return: List of remaining interactions if successful, None otherwise
        """
        try:
            interaction = (
                self.db.query(Interaction)
                .filter(Interaction.id == interaction_id)
                .first()
            )
            if not interaction:
                return None

            chat_id = interaction.chat_id
            index_to_delete = interaction.index

            # Delete interactions from the database
            self.db.query(Interaction).filter(
                Interaction.chat_id == chat_id, Interaction.index >= index_to_delete
            ).delete()
            self.db.commit()

            if chat_id in chat_cache:
                interactions = chat_cache[chat_id]["interactions"]
                chat_cache[chat_id]["interactions"] = [
                    i for i in interactions if i["index"] < index_to_delete
                ]
                return chat_cache[chat_id]["interactions"]

            remaining_interactions = (
                self.db.query(Interaction)
                .filter(Interaction.chat_id == chat_id)
                .order_by(Interaction.index)
                .all()
            )
            return [
                {
                    "interaction_id": i.id,
                    "index": i.index,
                    "message": i.message,
                    "response": i.response,
                    "timestamp": i.timestamp,
                }
                for i in remaining_interactions
            ]
        except SQLAlchemyError as e:
            logger.error(f"Error deleting message {interaction_id}: {e}")
            self.db.rollback()
            return None

    def list_user_chats(self, user_id: str) -> Optional[List[Dict[str, str]]]:
        """
        List all chats linked to a specific user.

        :param user_id: ID of the user
        :return: List of dictionaries containing chat ID and chat name if successful, None otherwise
        """
        try:
            if user_id in user_chats_cache:
                return user_chats_cache[user_id]

            chats = self.db.query(Chat).filter(Chat.user_id == user_id).all()
            user_chats = [
                {"chat_id": chat.id, "chat_name": chat.name} for chat in chats
            ]
            user_chats_cache[user_id] = user_chats
            return user_chats
        except SQLAlchemyError as e:
            logger.error(f"Error listing chats for user {user_id}: {e}")
            return None

    def get_chat(self, chat_id: str) -> Optional[Dict[str, Union[str, List[Dict]]]]:
        """
        Get chat interactions by chat ID. If the chat exists in the cache, return it.
        Otherwise, fetch it from the database, cache it, and return it.

        :param chat_id: ID of the chat
        :return: Dictionary of chat data if found, None otherwise
        """
        if chat_id in chat_cache:
            return chat_cache[chat_id]

        chat_data = self.load_chat_from_db(chat_id)
        if chat_data:
            chat_cache[chat_id] = chat_data
        return chat_data

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from database import Interaction, Chat
from datetime import datetime, timezone
from typing import Dict, List, Union, Optional
import uuid
import logging

# In-memory cache for recently used chats
chat_cache: Dict[str, Dict] = {}

class ChatRepository:
    @staticmethod
    def create_interaction(message: Optional[str], response: str, interaction_id: str, index: int) -> Dict[str, Union[str, int, datetime]]:
        """Create an interaction dictionary."""
        return {
            "interaction_id": interaction_id,
            "index": index,
            "message": message,
            "response": response,
            "timestamp": datetime.now(timezone.utc),
        }

    @staticmethod
    def create_chat(db: Session, user_id: str, greeting: str) -> Optional[tuple]:
        """
        Create a new chat and store it in the database.

        :param db: Database session
        :param user_id: ID of the user creating the chat
        :param greeting: Initial greeting message
        :return: Tuple of chat ID and initial interaction
        """
        try:
            chat_id = str(uuid.uuid4())
            interaction_id = str(uuid.uuid4())
            index = 0
            interaction = ChatRepository.create_interaction(message=None, response=greeting, interaction_id=interaction_id, index=index)

            # Store chat in SQLite database
            db_chat = Chat(id=chat_id, user_id=user_id)
            db.add(db_chat)
            db.commit()
            db.refresh(db_chat)

            # Store interaction in SQLite database
            db_interaction = Interaction(id=interaction_id, chat_id=chat_id, index=index, message=None, response=greeting)
            db.add(db_interaction)
            db.commit()
            db.refresh(db_interaction)

            # Cache the interaction and chat details
            chat_cache[chat_id] = {
                "user_id": user_id,
                "interactions": [interaction]
            }

            return chat_id, interaction
        except SQLAlchemyError as e:
            logging.error(f"Error creating chat for user {user_id}: {e}")
            db.rollback()
            return None

    @staticmethod
    def load_chat_from_db(chat_id: str, db: Session) -> Optional[Dict[str, Union[str, List[Dict]]]]:
        """
        Load chat interactions from the database.

        :param chat_id: ID of the chat
        :param db: Database session
        :return: Dictionary of chat data
        """
        try:
            interactions = db.query(Interaction).filter(Interaction.chat_id == chat_id).order_by(Interaction.index).all()

            if not interactions:
                return None

            chat = db.query(Chat).filter(Chat.id == chat_id).first()
            if not chat:
                return None

            chat_data = {
                "user_id": chat.user_id,
                "interactions": [
                    {
                        "interaction_id": i.id,
                        "index": i.index,
                        "message": i.message,
                        "response": i.response,
                        "timestamp": i.timestamp
                    }
                    for i in interactions
                ]
            }

            chat_cache[chat_id] = chat_data

            return chat_data
        except SQLAlchemyError as e:
            logging.error(f"Error loading chat {chat_id} from database: {e}")
            return None

    @staticmethod
    def verify_user_ownership(chat_id: str, user_id: str) -> bool:
        """
        Verify if the given user is the owner of the chat.

        :param chat_id: ID of the chat
        :param user_id: ID of the user
        :return: True if the user owns the chat, False otherwise
        """
        if chat_id not in chat_cache:
            return False
        return chat_cache[chat_id]["user_id"] == user_id

    @staticmethod
    def add_message(chat_id: str, message: str, db: Session, predefined_responses: Dict[str, str]) -> Optional[Dict]:
        """
        Add a message to a chat.

        :param chat_id: ID of the chat
        :param message: Message to add
        :param db: Database session
        :param predefined_responses: Dictionary of predefined responses
        :return: Dictionary of the new interaction
        """
        try:
            if chat_id not in chat_cache:
                chat_data = ChatRepository.load_chat_from_db(chat_id, db)
                if chat_data is None:
                    return None

            user_message = message.strip().lower()
            response = predefined_responses.get(user_message, "Sorry, I don't understand that. Can you ask something else?")

            new_index = len(chat_cache[chat_id]["interactions"])
            interaction_id = str(uuid.uuid4())
            interaction = ChatRepository.create_interaction(message=message, response=response, interaction_id=interaction_id, index=new_index)

            db_interaction = Interaction(id=interaction_id, chat_id=chat_id, index=new_index, message=message, response=response)
            db.add(db_interaction)
            db.commit()
            db.refresh(db_interaction)

            chat_cache[chat_id]["interactions"].append(interaction)

            return interaction
        except SQLAlchemyError as e:
            logging.error(f"Error adding message to chat {chat_id}: {e}")
            db.rollback()
            return None

    @staticmethod
    def edit_message(interaction_id: str, new_message: str, db: Session, predefined_responses: Dict[str, str]) -> Optional[Dict]:
        """
        Edit a message within a chat.

        :param interaction_id: ID of the interaction to edit
        :param new_message: New message content
        :param db: Database session
        :param predefined_responses: Dictionary of predefined responses
        :return: Dictionary of the updated interaction
        """
        try:
            interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
            if not interaction:
                return None

            user_message = new_message.strip().lower()
            new_response = predefined_responses.get(user_message, "Sorry, I don't understand that. Can you ask something else?")

            interaction.message = new_message
            interaction.response = new_response
            updated_interaction_index = interaction.index
            chat_id = interaction.chat_id

            db.query(Interaction).filter(Interaction.chat_id == chat_id, Interaction.index > updated_interaction_index).delete()
            db.commit()
            db.refresh(interaction)

            if chat_id in chat_cache:
                interactions = chat_cache[chat_id]["interactions"]
                for i, cached_interaction in enumerate(interactions):
                    if cached_interaction["interaction_id"] == interaction_id:
                        interactions[i]["message"] = new_message
                        interactions[i]["response"] = new_response
                        chat_cache[chat_id]["interactions"] = interactions[:i + 1]
                        break

            return {
                "interaction_id": interaction.id,
                "message": interaction.message,
                "response": interaction.response,
                "timestamp": interaction.timestamp
            }
        except SQLAlchemyError as e:
            logging.error(f"Error editing message {interaction_id}: {e}")
            db.rollback()
            return None

    @staticmethod
    def delete_message(interaction_id: str, db: Session) -> Optional[List[Dict]]:
        """
        Delete a message and all subsequent messages in a chat.

        :param interaction_id: ID of the interaction to delete
        :param db: Database session
        :return: List of remaining interactions
        """
        try:
            interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
            if not interaction:
                return None

            chat_id = interaction.chat_id
            index_to_delete = interaction.index

            db.query(Interaction).filter(Interaction.chat_id == chat_id, Interaction.index >= index_to_delete).delete()
            db.commit()

            if chat_id in chat_cache:
                interactions = chat_cache[chat_id]["interactions"]
                chat_cache[chat_id]["interactions"] = [i for i in interactions if i["index"] < index_to_delete]

            remaining_interactions = db.query(Interaction).filter(Interaction.chat_id == chat_id).order_by(Interaction.index).all()
            return [
                {
                    "interaction_id": i.id,
                    "index": i.index,
                    "message": i.message,
                    "response": i.response,
                    "timestamp": i.timestamp
                }
                for i in remaining_interactions
            ]
        except SQLAlchemyError as e:
            logging.error(f"Error deleting message {interaction_id}: {e}")
            db.rollback()
            return None
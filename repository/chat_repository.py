from sqlalchemy.orm import Session
from database import Interaction
from datetime import datetime, timezone
from typing import Dict, List, Union
import uuid

# In-memory cache for recently used chats
chat_cache: Dict[str, List[Dict[str, Union[str, int, datetime]]]] = {}

class ChatRepository:
    @staticmethod
    def create_interaction(message: Union[str, None], response: str, interaction_id: str, index: int):
        return {
            "interaction_id": interaction_id,
            "index": index,
            "message": message,
            "response": response,
            "timestamp": datetime.now(timezone.utc),
        }

    @staticmethod
    def create_chat(db: Session, greeting: str):
        chat_id = str(uuid.uuid4())
        interaction_id = str(uuid.uuid4())
        index = 0
        interaction = ChatRepository.create_interaction(message=None, response=greeting, interaction_id=interaction_id, index=index)

        # Store in SQLite database
        db_interaction = Interaction(id=interaction_id, chat_id=chat_id, index=index, message=None, response=greeting)
        db.add(db_interaction)
        db.commit()
        db.refresh(db_interaction)

        # Cache the interaction
        chat_cache[chat_id] = [interaction]

        return chat_id, interaction

    @staticmethod
    def load_chat_from_db(chat_id: str, db: Session):
        # Query the database to retrieve interactions for the chat_id
        interactions = db.query(Interaction).filter(Interaction.chat_id == chat_id).order_by(Interaction.index).all()

        if not interactions:
            return None

        # Convert database interactions to cache format
        chat_data = [
            {
                "interaction_id": i.id,
                "index": i.index,
                "message": i.message,
                "response": i.response,
                "timestamp": i.timestamp
            }
            for i in interactions
        ]

        # Cache the retrieved chat interactions
        chat_cache[chat_id] = chat_data

        return chat_data

    @staticmethod
    def add_message(chat_id: str, message: str, response: str, db: Session):
        if chat_id not in chat_cache:
            chat_data = ChatRepository.load_chat_from_db(chat_id, db)
            if chat_data is None:
                return None

        index = len(chat_cache[chat_id])
        interaction_id = str(uuid.uuid4())
        interaction = ChatRepository.create_interaction(message=message, response=response, interaction_id=interaction_id, index=index)

        # Store in SQLite database
        db_interaction = Interaction(id=interaction_id, chat_id=chat_id, index=index, message=message, response=response)
        db.add(db_interaction)
        db.commit()
        db.refresh(db_interaction)

        # Add to the chat's list of interactions in cache
        chat_cache[chat_id].append(interaction)

        return interaction

    @staticmethod
    def edit_message(chat_id: str, index: int, message: str, response: str, db: Session):
        if chat_id not in chat_cache:
            chat_data = ChatRepository.load_chat_from_db(chat_id, db)
            if chat_data is None:
                return None

        if index >= len(chat_cache[chat_id]):
            return None

        interaction_id = chat_cache[chat_id][index]['interaction_id']

        # Update the interaction in cache
        chat_cache[chat_id][index] = ChatRepository.create_interaction(message=message, response=response, interaction_id=interaction_id, index=index)

        # Update the interaction in SQLite database
        db.query(Interaction).filter(Interaction.chat_id == chat_id, Interaction.index == index).update({
            "message": message,
            "response": response
        })
        db.commit()

        # Remove all interactions after the edited one in cache and database
        chat_cache[chat_id] = chat_cache[chat_id][:index + 1]
        db.query(Interaction).filter(Interaction.chat_id == chat_id, Interaction.index > index).delete()
        db.commit()

        return chat_cache[chat_id][index]

    @staticmethod
    def delete_message(chat_id: str, index: int, db: Session):
        if chat_id not in chat_cache:
            chat_data = ChatRepository.load_chat_from_db(chat_id, db)
            if chat_data is None:
                return None

        if index >= len(chat_cache[chat_id]):
            return None

        # Delete the interaction and all subsequent messages from cache
        chat_cache[chat_id] = chat_cache[chat_id][:index]

        # Delete the interactions from the SQLite database
        db.query(Interaction).filter(Interaction.chat_id == chat_id, Interaction.index >= index).delete()
        db.commit()

        return chat_cache[chat_id]

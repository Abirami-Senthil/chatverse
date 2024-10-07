from datetime import datetime, timezone
from sqlalchemy import (
    UniqueConstraint,
    create_engine,
    Column,
    String,
    Text,
    DateTime,
    Integer,
    ForeignKey,
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.exc import SQLAlchemyError
from utils.uuid_utis import create_uuid
import logging

# Configure logging
logging.basicConfig(level=logging.ERROR)

# Constants
DATABASE_URL = "sqlite:///./chats.db"
CHAT_TABLE_NAME = "chats"
USER_TABLE_NAME = "users"
INTERACTION_TABLE_NAME = "interactions"

# Set up the database engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_session_local():
    """
    Provide a transactional scope around a series of operations.

    Yields:
        db (SessionLocal): A database session object.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base = declarative_base()

class Interaction(Base):
    """
    Model for chat interactions.

    Attributes:
        id (str): Unique identifier for the interaction.
        chat_id (str): Foreign key linking to the associated chat.
        index (int): Index of the interaction in the chat.
        message (str): User message.
        response (str): Chatbot response.
        timestamp (datetime): Timestamp of when the interaction occurred.
    """
    __tablename__ = INTERACTION_TABLE_NAME

    id = Column(String, primary_key=True, default=create_uuid)  # interaction_id as UUID
    chat_id = Column(
        String, ForeignKey(f"{CHAT_TABLE_NAME}.id"), index=True
    )  # chat_id as UUID
    index = Column(Integer)  # Index of the interaction in the chat
    message = Column(Text)  # User's message
    response = Column(Text)  # Bot's response
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # Timestamp

class User(Base):
    """
    Model for users.

    Attributes:
        id (str): Unique identifier for the user.
        username (str): Unique username for the user.
        hashed_password (str): User's hashed password for authentication.
        created_at (datetime): Timestamp when the user was created.
    """
    __tablename__ = USER_TABLE_NAME

    id = Column(String, primary_key=True, default=create_uuid)  # User ID as UUID
    username = Column(
        String, unique=True, nullable=False, index=True
    )  # Unique username
    hashed_password = Column(String, nullable=False)  # Hashed password
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # Timestamp

    __table_args__ = (UniqueConstraint("username", name="unique_username_constraint"),)

class Chat(Base):
    """
    Model for chats.

    Attributes:
        id (str): Unique identifier for the chat.
        user_id (str): Foreign key linking to the user who owns the chat.
        name (str): Name of the chat.
        user (User): Relationship to the user model.
    """
    __tablename__ = CHAT_TABLE_NAME

    id = Column(String, primary_key=True, default=create_uuid)  # Chat ID as UUID
    user_id = Column(
        String, ForeignKey(f"{USER_TABLE_NAME}.id"), nullable=False
    )  # User ID as UUID
    name = Column(String, nullable=False)  # Chat name

    user = relationship("User")  # Relationship to user

# Create the database tables with error handling
try:
    Base.metadata.create_all(bind=engine)
except SQLAlchemyError as e:
    logging.error(f"Error creating database tables: {e}")

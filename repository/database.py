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
from config import LOG_LEVEL
from utils import create_uuid
import logging
from typing import Generator

# Configure logging
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# Constants
DATABASE_URL = "sqlite:///./chats.db"
CHAT_TABLE_NAME = "chats"
USER_TABLE_NAME = "users"
INTERACTION_TABLE_NAME = "interactions"

# Set up the database engine
try:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except SQLAlchemyError as e:
    logger.error(f"Error setting up database engine: {e}")
    raise


def get_session_local() -> Generator:
    """
    Provide a transactional scope around a series of operations.

    Yields:
        SessionLocal: A database session object.

    Raises:
        SQLAlchemyError: If there's an issue with the database session.
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
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

    id = Column(String, primary_key=True, default=create_uuid)
    chat_id = Column(String, ForeignKey(f"{CHAT_TABLE_NAME}.id"), index=True)
    index = Column(Integer)
    message = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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

    id = Column(String, primary_key=True, default=create_uuid)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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

    id = Column(String, primary_key=True, default=create_uuid)
    user_id = Column(String, ForeignKey(f"{USER_TABLE_NAME}.id"), nullable=False)
    name = Column(String, nullable=False)

    user = relationship("User", back_populates="chats")


# Add back-reference to User model
User.chats = relationship("Chat", order_by=Chat.id, back_populates="user")

# Create the database tables with error handling
try:
    Base.metadata.create_all(bind=engine)
except SQLAlchemyError as e:
    logger.error(f"Error creating database tables: {e}")
    raise

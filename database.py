from datetime import datetime, timezone
from sqlalchemy import (
    UniqueConstraint, create_engine, Column, String, Text, DateTime, Integer, ForeignKey
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.exc import SQLAlchemyError
from utils.uuid_utis import create_uuid

# Constants
DATABASE_URL = "sqlite:///./chats.db"
CHAT_TABLE_NAME = "chats"
USER_TABLE_NAME = "users"
INTERACTION_TABLE_NAME = "interactions"

# Set up the database engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_session_local():
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base = declarative_base()

class Interaction(Base):
    """Model for chat interactions."""
    __tablename__ = INTERACTION_TABLE_NAME

    id = Column(String, primary_key=True, default=create_uuid)  # interaction_id as UUID
    chat_id = Column(String, ForeignKey(f"{CHAT_TABLE_NAME}.id"), index=True)  # chat_id as UUID
    index = Column(Integer)  # Index of the interaction in the chat
    message = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class User(Base):
    """Model for users."""
    __tablename__ = USER_TABLE_NAME

    id = Column(String, primary_key=True, default=create_uuid)  # User ID as UUID
    username = Column(String, unique=True, nullable=False, index=True)  # Unique username
    hashed_password = Column(String, nullable=False)  # Hashed password
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('username', name='unique_username_constraint'),
    )

class Chat(Base):
    """Model for chats."""
    __tablename__ = CHAT_TABLE_NAME

    id = Column(String, primary_key=True, default=create_uuid)  # Chat ID as UUID
    user_id = Column(String, ForeignKey(f"{USER_TABLE_NAME}.id"), nullable=False)  # User ID as UUID

    user = relationship("User")

# Create the database tables
try:
    Base.metadata.create_all(bind=engine)
except SQLAlchemyError as e:
    print(f"Error creating database tables: {e}")

from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime, timezone

from utils.uuid_utis import create_uuid

# Set up the database
DATABASE_URL = "sqlite:///./chats.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(String, primary_key=True, default=lambda: create_uuid())  # interaction_id as UUID
    chat_id = Column(String, index=True)  # chat_id as UUID
    index = Column(Integer)  # Index of the interaction in the chat
    message = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))

# Create the database tables
Base.metadata.create_all(bind=engine)

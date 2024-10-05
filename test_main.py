from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from main import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models.user_token import UserToken
from utils.uuid_utis import create_uuid

client = TestClient(app)

# Constants
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
GREETING_RESPONSE = "Hello! How can I assist you today?"
USER_NOT_ALLOWED = "You do not have permission to access this chat."

# Set up a test database
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the test database
Base.metadata.create_all(bind=engine)

@pytest.fixture
def create_user_and_get_token():
    """Register and log in a user, then yield the access token."""
    user_data = {"username": create_uuid(), "password": "password123"}
    response = client.post("/register", json=user_data)
    assert response.status_code == 200
    yield response.json()["access_token"]

@pytest.fixture
def create_chat(create_user_and_get_token):
    """Create a chat and yield the chat ID."""
    with TestingSessionLocal() as db:
        headers = {"Authorization": f"Bearer {create_user_and_get_token}"}
        response = client.get("/chat/init", headers=headers)
        assert response.status_code == 200
        yield response.json()["chat_id"]
        db.rollback()

@pytest.fixture(scope="function", autouse=True)
def clear_test_data():
    """Clear the test database before each test to ensure no data persistence."""
    with TestingSessionLocal() as db:
        db.query(Base.metadata.tables['interactions']).delete()
        db.query(Base.metadata.tables['users']).delete()
        db.commit()

def test_register_and_login():
    """Test user registration and login."""
    user_data = {"username": create_uuid(), "password": create_uuid()}
    response = client.post("/register", json=user_data)
    assert response.status_code == 200
    assert "access_token" in response.json()
    response = client.post("/login", json=user_data)
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_create_chat(create_user_and_get_token):
    """Test creating a new chat and verifying the default interaction."""
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}
    response = client.get("/chat/init", headers=headers)
    assert response.status_code == 200
    assert "chat_id" in response.json()
    assert "interaction" in response.json()
    assert response.json()["interaction"]["response"] == GREETING_RESPONSE
    assert response.json()["interaction"]["index"] == 0

def test_add_message(create_chat, create_user_and_get_token):
    """Test adding a message to a chat."""
    chat_id = create_chat
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}
    message_data = {"message": "hello"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data, headers=headers)
    assert response.status_code == 200
    assert "interaction" in response.json()
    assert response.json()["interaction"]["message"] == "hello"
    assert response.json()["interaction"]["response"] == GREETING_RESPONSE

def test_edit_message(create_chat, create_user_and_get_token):
    """Test editing a message and verifying that only subsequent interactions are deleted."""
    chat_id = create_chat
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}
    message_data_1 = {"message": "hello"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data_1, headers=headers)
    assert response.status_code == 200
    interaction_id_1 = response.json()["interaction"]["interaction_id"]

    message_data_2 = {"message": "how are you?"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data_2, headers=headers)
    assert response.status_code == 200
    interaction_id_2 = response.json()["interaction"]["interaction_id"]

    edit_data = {"message": "how are you?"}
    response = client.patch(f"/chat/{chat_id}/message/{interaction_id_1}", json=edit_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["interaction"]["message"] == "how are you?"
    assert response.json()["interaction"]["response"] == "I'm doing well! Thanks for asking. How can I assist you today?"

    response = client.get(f"/chat/{chat_id}", headers=headers)
    interactions = response.json()["interactions"]
    assert len(interactions) == 2

def test_delete_message(create_chat, create_user_and_get_token):
    """Test deleting a message and verifying that only subsequent interactions are deleted."""
    chat_id = create_chat
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}
    message_data_1 = {"message": "hello"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data_1, headers=headers)
    assert response.status_code == 200
    interaction_id_1 = response.json()["interaction"]["interaction_id"]

    message_data_2 = {"message": "how are you?"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data_2, headers=headers)
    assert response.status_code == 200
    interaction_id_2 = response.json()["interaction"]["interaction_id"]

    response = client.delete(f"/chat/{chat_id}/message/{interaction_id_1}", headers=headers)
    assert response.status_code == 200

    remaining_interactions = response.json()["remaining_interactions"]
    assert len(remaining_interactions) == 1
    assert remaining_interactions[0]["message"] is None
    assert remaining_interactions[0]["response"] == GREETING_RESPONSE

def test_user_ownership(create_user_and_get_token):
    """Test user ownership validation."""
    headers_user_1 = {"Authorization": f"Bearer {create_user_and_get_token}"}
    response = client.get("/chat/init", headers=headers_user_1)
    assert response.status_code == 200
    chat_id = response.json()["chat_id"]

    user_data_2 = {"username": create_uuid(), "password": "password456"}
    response = client.post("/register", json=user_data_2)
    assert response.status_code == 200
    token_user_2 = response.json()["access_token"]

    headers_user_2 = {"Authorization": f"Bearer {token_user_2}"}
    response = client.get(f"/chat/{chat_id}", headers=headers_user_2)
    assert response.status_code == 403
    assert response.json()["detail"] == USER_NOT_ALLOWED

    message_data = {"message": "Is this allowed?"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data, headers=headers_user_2)
    assert response.status_code == 403
    assert response.json()["detail"] == USER_NOT_ALLOWED
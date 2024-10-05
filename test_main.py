import pytest
from fastapi.testclient import TestClient
from main import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base


client = TestClient(app)

# Set up a test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the test database
Base.metadata.create_all(bind=engine)


@pytest.fixture
def create_chat():
    # Use the test database session
    db = TestingSessionLocal()
    try:
        response = client.get("/chat/init")
        assert response.status_code == 200
        yield response.json()["chat_id"]
    finally:
        # Rollback any changes to ensure data is not persistent
        db.rollback()
        db.close()
    response = client.get("/chat/init")
    assert response.status_code == 200
    return response.json()["chat_id"]

@pytest.fixture(scope="function", autouse=True)
def clear_test_data():
    # Clear the test database before each test to ensure no data persistence
    db = TestingSessionLocal()
    try:
        db.query(Base.metadata.tables['interactions']).delete()
        db.commit()
    finally:
        db.close()

# Test creating a new chat and verifying the default interaction
def test_create_chat():
    response = client.get("/chat/init")
    assert response.status_code == 200
    assert "chat_id" in response.json()
    assert "interaction" in response.json()
    assert response.json()["interaction"]["response"] == "Hello! How can I assist you today?"
    assert response.json()["interaction"]["index"] == 0

# Test adding a message to a chat
def test_add_message(create_chat):
    chat_id = create_chat
    message_data = {"message": "hello"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data)
    assert response.status_code == 200
    assert "interaction" in response.json()
    assert response.json()["interaction"]["message"] == "hello"
    assert response.json()["interaction"]["response"] == "Hello! How can I assist you today?"

# Test editing a message and verifying that only subsequent interactions are deleted
def test_edit_message(create_chat):
    chat_id = create_chat
    # Add two messages to the created chat
    message_data_1 = {"message": "hello"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data_1)
    assert response.status_code == 200
    interaction_id_1 = response.json()["interaction"]["interaction_id"]

    message_data_2 = {"message": "how are you?"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data_2)
    assert response.status_code == 200
    interaction_id_2 = response.json()["interaction"]["interaction_id"]

    # Edit the message
    edit_data = {"message": "how are you?"}
    response = client.patch(f"/chat/{chat_id}/message/{interaction_id_1}", json=edit_data)
    assert response.status_code == 200
    assert response.json()["interaction"]["message"] == "how are you?"
    assert response.json()["interaction"]["response"] == "I'm doing well! Thanks for asking. How can I assist you today?"

    # Verify that only subsequent interactions are deleted
    response = client.get(f"/chat/{chat_id}")
    interactions = response.json()["interactions"]
    assert len(interactions) == 2  # The initial bot response and the edited message

# Test deleting a message and verifying that only subsequent interactions are deleted
def test_delete_message(create_chat):
    chat_id = create_chat
    # Add two messages to the created chat
    message_data_1 = {"message": "hello"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data_1)
    assert response.status_code == 200
    interaction_id_1 = response.json()["interaction"]["interaction_id"]

    message_data_2 = {"message": "how are you?"}
    response = client.post(f"/chat/{chat_id}/message", json=message_data_2)
    assert response.status_code == 200
    interaction_id_2 = response.json()["interaction"]["interaction_id"]

    # Delete the first user message
    response = client.delete(f"/chat/{chat_id}/message/{interaction_id_1}")
    assert response.status_code == 200

    # Verify that only the initial bot message remains
    remaining_interactions = response.json()["remaining_interactions"]
    assert len(remaining_interactions) == 1
    assert remaining_interactions[0]["message"] is None
    assert remaining_interactions[0]["response"] == "Hello! How can I assist you today?"
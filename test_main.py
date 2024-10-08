import pytest
from fastapi.testclient import TestClient
from main import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from repository.database import Base
from utils import create_uuid
import logging

# Initialize FastAPI test client
client = TestClient(app)

# Configure logging
logging.basicConfig(level=logging.ERROR)

# Constants
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
GREETING_RESPONSE = "Hello! How can I assist you today?"
EDIT_NOT_ALLOWED_MESSAGE = "You do not have permission to edit messages in this chat."
READ_NOT_ALLOWED_MESSAGE = "You do not have permission to access this chat."
DELETE_NOT_ALLOWED_MESSAGE = (
    "You do not have permission to delete messages in this chat."
)

# Set up a test database
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the test database
try:
    Base.metadata.create_all(bind=engine)
except SQLAlchemyError as e:
    logging.error(f"Error creating test database tables: {e}")


@pytest.fixture
def create_user_and_get_token():
    """
    Register and log in a user, then yield the access token.
    """
    user_data = {"username": create_uuid(), "password": "password123"}
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 200, "Failed to register user"
    yield response.json()["access_token"]


@pytest.fixture
def create_chat(create_user_and_get_token):
    """
    Create a chat and yield the chat ID.
    """
    with TestingSessionLocal() as db:
        try:
            headers = {"Authorization": f"Bearer {create_user_and_get_token}"}
            response = client.post(
                f"/chats/init?chat_name={create_uuid()[:10]}", headers=headers
            )
            assert response.status_code == 200, "Failed to create chat"
            yield response.json()["chat_id"]
        except SQLAlchemyError as e:
            logging.error(f"Error creating chat: {e}")
            db.rollback()
        finally:
            db.close()


@pytest.fixture(scope="function", autouse=True)
def clear_test_data():
    """
    Clear the test database before each test to ensure no data persistence.
    """
    with TestingSessionLocal() as db:
        try:
            db.query(Base.metadata.tables["interactions"]).delete()
            db.query(Base.metadata.tables["users"]).delete()
            db.commit()
        except SQLAlchemyError as e:
            logging.error(f"Error clearing test data: {e}")
            db.rollback()
        finally:
            db.close()


def test_register_and_login():
    """
    Test user registration and login.
    """
    user_data = {"username": create_uuid(), "password": create_uuid()}

    # Test registration
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 200, "User registration failed"
    assert (
        "access_token" in response.json()
    ), "Access token not returned after registration"

    # Test login
    response = client.post("/auth/login", json=user_data)
    assert response.status_code == 200, "User login failed"
    assert "access_token" in response.json(), "Access token not returned after login"


def test_create_chat(create_user_and_get_token):
    """
    Test creating a new chat and verifying the default interaction.
    """
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}
    response = client.post(
        f"/chats/init?chat_name={create_uuid()[:10]}", headers=headers
    )
    assert response.status_code == 200, "Failed to create chat"

    response_json = response.json()
    assert "chat_id" in response_json, "Chat ID not returned"
    assert "interaction" in response_json, "Default interaction not returned"
    assert "chat_name" in response_json, "Chat name not returned"

    interaction = response_json["interaction"]
    assert interaction["response"] == GREETING_RESPONSE, "Incorrect greeting response"
    assert interaction["index"] == 0, "Incorrect interaction index"
    assert "suggestions" in interaction, "Suggestions not included in interaction"


def test_add_message(create_chat, create_user_and_get_token):
    """
    Test adding a message to a chat.
    """
    chat_id = create_chat
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}
    message_data = {"message": "hello"}

    response = client.post(
        f"/chats/{chat_id}/messages", json=message_data, headers=headers
    )
    assert response.status_code == 200, "Failed to add message"

    response_json = response.json()
    assert "message" in response_json, "Message not returned in response"
    assert "response" in response_json, "Bot response not returned"
    assert response_json["message"] == "hello", "Incorrect message returned"
    assert response_json["response"] == GREETING_RESPONSE, "Incorrect bot response"
    assert "suggestions" in response_json, "Suggestions not included in response"


def test_edit_message(create_chat, create_user_and_get_token):
    """
    Test editing a message and verifying that only subsequent interactions are deleted.
    """
    chat_id = create_chat
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}

    # Add first message
    message_data_1 = {"message": "hello"}
    response = client.post(
        f"/chats/{chat_id}/messages", json=message_data_1, headers=headers
    )
    assert response.status_code == 200, "Failed to add first message"
    interaction_id_1 = response.json()["interaction_id"]

    # Add second message
    message_data_2 = {"message": "how are you?"}
    response = client.post(
        f"/chats/{chat_id}/messages", json=message_data_2, headers=headers
    )
    assert response.status_code == 200, "Failed to add second message"

    # Edit first message
    edit_data = {"message": "how are you?"}
    response = client.patch(
        f"/chats/{chat_id}/messages/{interaction_id_1}", json=edit_data, headers=headers
    )
    assert response.status_code == 200, "Failed to edit message"

    remaining_interactions = response.json()
    assert (
        remaining_interactions[1]["message"] == "how are you?"
    ), "Message not edited correctly"
    assert (
        remaining_interactions[1]["response"]
        == "I'm doing well! Thanks for asking. How can I assist you today?"
    ), "Incorrect bot response after edit"
    assert (
        "suggestions" in remaining_interactions[-1]
    ), "Suggestions not included in last interaction"

    # Verify chat state after edit
    response = client.get(f"/chats/{chat_id}", headers=headers)
    interactions = response.json()["interactions"]
    assert len(interactions) == 2, "Incorrect number of interactions after edit"
    assert (
        "suggestions" in interactions[-1]
    ), "Suggestions not included in last interaction"


def test_delete_message(create_chat, create_user_and_get_token):
    """
    Test deleting a message and verifying that only subsequent interactions are deleted.
    """
    chat_id = create_chat
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}

    # Add first message
    message_data_1 = {"message": "hello"}
    response = client.post(
        f"/chats/{chat_id}/messages", json=message_data_1, headers=headers
    )
    assert response.status_code == 200, "Failed to add first message"
    interaction_id_1 = response.json()["interaction_id"]

    # Add second message
    message_data_2 = {"message": "how are you?"}
    response = client.post(
        f"/chats/{chat_id}/messages", json=message_data_2, headers=headers
    )
    assert response.status_code == 200, "Failed to add second message"

    # Delete first message
    response = client.delete(
        f"/chats/{chat_id}/messages/{interaction_id_1}", headers=headers
    )
    assert response.status_code == 200, "Failed to delete message"

    remaining_interactions = response.json()
    assert (
        len(remaining_interactions) == 1
    ), "Incorrect number of interactions after delete"
    assert remaining_interactions[0]["message"] is None, "Message not deleted correctly"
    assert (
        remaining_interactions[0]["response"] == GREETING_RESPONSE
    ), "Incorrect bot response after delete"
    assert (
        "suggestions" in remaining_interactions[-1]
    ), "Suggestions not included in last interaction"


def test_user_ownership(create_user_and_get_token):
    """
    Test user ownership validation.
    """
    headers_user_1 = {"Authorization": f"Bearer {create_user_and_get_token}"}

    # Create chat for user 1
    response = client.post(
        f"/chats/init?chat_name={create_uuid()[:10]}", headers=headers_user_1
    )
    assert response.status_code == 200, "Failed to create chat for user 1"
    chat_id = response.json()["chat_id"]

    # Create user 2
    user_data_2 = {"username": create_uuid(), "password": "password456"}
    response = client.post("/auth/register", json=user_data_2)
    assert response.status_code == 200, "Failed to create user 2"
    token_user_2 = response.json()["access_token"]

    headers_user_2 = {"Authorization": f"Bearer {token_user_2}"}

    # Test read access
    response = client.get(f"/chats/{chat_id}", headers=headers_user_2)
    assert response.status_code == 403, "User 2 should not have read access"
    assert (
        response.json()["detail"] == READ_NOT_ALLOWED_MESSAGE
    ), "Incorrect error message for read access"

    # Test write access
    response = client.post(
        f"/chats/{chat_id}/messages", json={"message": "hello"}, headers=headers_user_2
    )
    assert response.status_code == 403, "User 2 should not have write access"
    assert (
        response.json()["detail"] == READ_NOT_ALLOWED_MESSAGE
    ), "Incorrect error message for write access"

    # Test edit access
    response = client.patch(
        f"/chats/{chat_id}/messages/{create_uuid()}",
        json={"message": "edit"},
        headers=headers_user_2,
    )
    assert response.status_code == 403, "User 2 should not have edit access"
    assert (
        response.json()["detail"] == EDIT_NOT_ALLOWED_MESSAGE
    ), "Incorrect error message for edit access"

    # Test delete access
    response = client.delete(
        f"/chats/{chat_id}/messages/{create_uuid()}", headers=headers_user_2
    )
    assert response.status_code == 403, "User 2 should not have delete access"
    assert (
        response.json()["detail"] == DELETE_NOT_ALLOWED_MESSAGE
    ), "Incorrect error message for delete access"


def test_list_user_chats(create_user_and_get_token):
    """
    Test listing all chats for a user.
    """
    headers = {"Authorization": f"Bearer {create_user_and_get_token}"}

    # Create multiple chats
    chat_names = [create_uuid()[:10] for _ in range(3)]
    for chat_name in chat_names:
        response = client.post(f"/chats/init?chat_name={chat_name}", headers=headers)
        assert response.status_code == 200, f"Failed to create chat: {chat_name}"

    # List all chats for the user
    response = client.get("/chats", headers=headers)
    assert response.status_code == 200, "Failed to list user chats"
    user_chats = response.json()

    # Verify that all created chats are listed
    assert len(user_chats) == 3, "Incorrect number of chats returned"
    listed_chat_names = [chat["chat_name"] for chat in user_chats]
    for chat_name in chat_names:
        assert (
            chat_name in listed_chat_names
        ), f"Chat {chat_name} not found in user's chat list"

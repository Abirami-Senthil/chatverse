from fastapi import APIRouter, HTTPException, Depends
from config import LOG_LEVEL
from repository.database import User
from services.chat_service import ChatService
from models.requests import MessageRequest
import logging
from services.auth_service import AuthService
from typing import List, Dict

# Configure logging
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

chat_messages_router = APIRouter()


@chat_messages_router.post("/{chat_id}/messages")
async def add_message(
    chat_id: str,
    message: MessageRequest,
    chat_service: ChatService = Depends(ChatService),
    current_user: User = Depends(AuthService.get_current_user),
) -> Dict:
    """
    Add a message to a chat.

    Args:
        chat_id (str): The ID of the chat.
        message (MessageRequest): The message to add.
        chat_service (ChatService): The chat service dependency.
        current_user (User): The current authenticated user.

    Returns:
        Dict: The details of the added interaction.

    Raises:
        HTTPException: If the user doesn't have permission, the chat is not found,
                       or there's an internal server error.
    """
    try:
        if not chat_service.verify_user_ownership(chat_id, current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this chat.",
            )

        interaction = chat_service.add_message(chat_id, message.message)
        if interaction is None:
            raise HTTPException(status_code=404, detail="Chat ID not found")

        return interaction
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding message to chat {chat_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_messages_router.patch("/{chat_id}/messages/{interaction_id}")
async def edit_message(
    chat_id: str,
    interaction_id: str,
    message: MessageRequest,
    chat_service: ChatService = Depends(ChatService),
    current_user: User = Depends(AuthService.get_current_user),
) -> List[Dict]:
    """
    Edit a message in a chat.

    Args:
        chat_id (str): The ID of the chat.
        interaction_id (str): The ID of the interaction to edit.
        message (MessageRequest): The new message content.
        chat_service (ChatService): The chat service dependency.
        current_user (User): The current authenticated user.

    Returns:
        List[Dict]: A list of updated interactions in the chat.

    Raises:
        HTTPException: If the user doesn't have permission, the interaction is not found,
                       or there's an internal server error.
    """
    try:
        if not chat_service.verify_user_ownership(chat_id, current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to edit messages in this chat.",
            )

        response = chat_service.edit_message(interaction_id, message.message)
        if response is None:
            raise HTTPException(status_code=404, detail="Interaction ID not found")

        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error editing message {interaction_id} in chat {chat_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_messages_router.delete("/{chat_id}/messages/{interaction_id}")
async def delete_message(
    chat_id: str,
    interaction_id: str,
    chat_service: ChatService = Depends(ChatService),
    current_user: User = Depends(AuthService.get_current_user),
) -> List[Dict]:
    """
    Delete a message and all subsequent messages in a chat.

    Args:
        chat_id (str): The ID of the chat.
        interaction_id (str): The ID of the interaction to delete.
        chat_service (ChatService): The chat service dependency.
        current_user (User): The current authenticated user.

    Returns:
        List[Dict]: A list of remaining interactions in the chat.

    Raises:
        HTTPException: If the user doesn't have permission, the interaction is not found,
                       or there's an internal server error.
    """
    try:
        if not chat_service.verify_user_ownership(chat_id, current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to delete messages in this chat.",
            )

        response = chat_service.delete_message(interaction_id)
        if response is None:
            raise HTTPException(status_code=404, detail="Interaction ID not found")

        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error deleting message {interaction_id} in chat {chat_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Internal server error")

from fastapi import APIRouter, HTTPException, Depends
from config import LOG_LEVEL
from repository.database import User
from services.chat_service import ChatService
from services.auth_service import AuthService
import logging
from typing import Dict, List

# Configure logging
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# Create a new router
chats_router = APIRouter()


@chats_router.get("/init")
async def create_chat(
    chat_name: str,
    chat_service: ChatService = Depends(ChatService),
    current_user: User = Depends(AuthService.get_current_user),
) -> Dict:
    """
    Create a new chat for the current user.

    Args:
        chat_name (str): The name of the new chat.
        chat_service (ChatService): The chat service dependency.
        current_user (User): The current authenticated user.

    Returns:
        Dict: The details of the created chat.

    Raises:
        HTTPException: If there's an error creating the chat.
    """
    try:
        if not chat_name or len(chat_name.strip()) == 0:
            raise ValueError("Chat name cannot be empty")

        new_chat = chat_service.create_chat(chat_name, current_user.id)
        return new_chat
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error creating chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@chats_router.get("/{chat_id}")
async def get_chat_interactions(
    chat_id: str,
    chat_service: ChatService = Depends(ChatService),
    current_user: User = Depends(AuthService.get_current_user),
) -> Dict:
    """
    Get all interactions for a specific chat.

    Args:
        chat_id (str): The ID of the chat.
        chat_service (ChatService): The chat service dependency.
        current_user (User): The current authenticated user.

    Returns:
        Dict: The interactions for the specified chat.

    Raises:
        HTTPException: If the user doesn't have permission or the chat is not found.
    """
    try:
        if not chat_service.verify_user_ownership(chat_id, current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this chat.",
            )
        chat_data = chat_service.get_chat(chat_id)
        if chat_data is None:
            raise HTTPException(status_code=404, detail="Chat not found")
        return chat_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving chat interactions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@chats_router.get("/")
async def list_user_chats(
    chat_service: ChatService = Depends(ChatService),
    current_user: User = Depends(AuthService.get_current_user),
) -> List[Dict]:
    """
    List all chats for the current user.

    Args:
        chat_service (ChatService): The chat service dependency.
        current_user (User): The current authenticated user.

    Returns:
        List[Dict]: A list of chats belonging to the user.

    Raises:
        HTTPException: If there's an error listing the chats.
    """
    try:
        user_chats = chat_service.list_user_chats(current_user.id)
        return user_chats
    except Exception as e:
        logger.error(
            f"Error listing chats for user {current_user.id}: {e}", exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

from fastapi import APIRouter, HTTPException, Depends
from exceptions import InvalidCredentialsException, UserAlreadyExistsException
from models.user import UserModel
from models.user_token import UserToken
import logging
from services.auth_service import AuthService
from typing import Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a router for authentication endpoints
auth_router = APIRouter()


@auth_router.post("/register", response_model=UserToken)
async def register(
    user: UserModel, auth_service: AuthService = Depends(AuthService)
) -> Dict[str, str]:
    """
    Register a new user.

    Args:
        user (UserModel): The user data for registration.
        auth_service (AuthService): The authentication service.

    Returns:
        Dict[str, str]: A dictionary containing the access token and token type.

    Raises:
        HTTPException: If the username is already taken or if there's an internal server error.
    """
    try:
        return auth_service.register_user(user)
    except UserAlreadyExistsException:
        logger.warning(
            f"Attempted registration with existing username: {user.username}"
        )
        raise HTTPException(status_code=409, detail="Username is already taken")
    except Exception as e:
        logger.error(f"Error registering user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@auth_router.post("/login", response_model=UserToken)
async def login(
    user: UserModel, auth_service: AuthService = Depends(AuthService)
) -> Dict[str, str]:
    """
    Authenticate a user and return an access token.

    Args:
        user (UserModel): The user credentials for login.
        auth_service (AuthService): The authentication service.

    Returns:
        Dict[str, str]: A dictionary containing the access token and token type.

    Raises:
        HTTPException: If the credentials are invalid or if there's an internal server error.
    """
    try:
        return auth_service.login_user(user)
    except InvalidCredentialsException:
        logger.warning(f"Failed login attempt for user: {user.username}")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    except Exception as e:
        logger.error(f"Error logging in user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

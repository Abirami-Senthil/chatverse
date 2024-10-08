import logging
from datetime import datetime, timedelta, timezone
from typing import Dict
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from repository.database import User, get_session_local
from exceptions import (
    InternalServerException,
    InvalidCredentialsException,
    UserAlreadyExistsException,
)
from models.auth_settings import auth_settings
import jwt

from models.user import UserModel
from repository.user_repository import UserRepository

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class AuthService:
    """
    Service class for handling authentication-related operations.
    """

    def __init__(self, user_repo: UserRepository = Depends(UserRepository)):
        """
        Initialize the AuthService with a UserRepository.

        :param user_repo: An instance of UserRepository for database operations
        """
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.user_repo = user_repo

    def hash_password(self, password: str) -> str:
        """
        Hash a plain text password.

        :param password: The plain text password to hash
        :return: The hashed password
        :raises InternalServerException: If there's an error during hashing
        """
        try:
            return self.pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Error hashing password: {e}", exc_info=True)
            raise InternalServerException("Error hashing password")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain text password against a hashed password.

        :param plain_password: The plain text password to verify
        :param hashed_password: The hashed password to compare against
        :return: True if the password is correct, False otherwise
        :raises InternalServerException: If there's an error during verification
        """
        try:
            return self.pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Error verifying password: {e}", exc_info=True)
            raise InternalServerException("Error verifying password")

    def create_access_token(
        self, data: dict, expires_delta: timedelta = timedelta(hours=24)
    ) -> str:
        """
        Create a JWT access token.

        :param data: The data to encode in the token
        :param expires_delta: The expiration time for the token (default: 24 hours)
        :return: The encoded JWT token
        :raises InternalServerException: If there's an error creating the token
        """
        try:
            to_encode = data.copy()
            expire = datetime.now(timezone.utc) + expires_delta
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(
                to_encode, auth_settings.secret_key, algorithm=auth_settings.algorithm
            )
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error creating access token: {e}", exc_info=True)
            raise InternalServerException("Error creating access token")

    def register_user(self, user: UserModel) -> Dict[str, str]:
        """
        Register a new user.

        :param user: The user model containing registration information
        :return: A dictionary with the access token and token type
        :raises UserAlreadyExistsException: If the username is already taken
        :raises InternalServerException: If there's an error during registration
        """
        try:
            existing_user = self.user_repo.get_user_by_username(user.username)
            if existing_user:
                logger.warning(
                    f"Attempted registration with existing username: {user.username}"
                )
                raise UserAlreadyExistsException()

            hashed_password = self.hash_password(user.password)
            new_user = self.user_repo.create_user(user.username, hashed_password)

            access_token = self.create_access_token({"sub": new_user.username})
            logger.info(f"User registered successfully: {user.username}")
            return {"access_token": access_token, "token_type": "bearer"}
        except UserAlreadyExistsException:
            raise
        except Exception as e:
            logger.error(f"Error registering user: {e}", exc_info=True)
            raise InternalServerException("Error registering user")

    def login_user(self, user: UserModel) -> Dict[str, str]:
        """
        Authenticate a user and generate an access token.

        :param user: The user model containing login credentials
        :return: A dictionary with the access token and token type
        :raises InvalidCredentialsException: If the credentials are invalid
        :raises InternalServerException: If there's an error during login
        """
        try:
            db_user = self.user_repo.get_user_by_username(user.username)
            if not db_user or not self.verify_password(
                user.password, db_user.hashed_password
            ):
                logger.warning(f"Failed login attempt for user: {user.username}")
                raise InvalidCredentialsException()

            access_token = self.create_access_token({"sub": db_user.username})
            logger.info(f"User logged in successfully: {user.username}")
            return {"access_token": access_token, "token_type": "bearer"}
        except InvalidCredentialsException:
            raise
        except Exception as e:
            logger.error(f"Error logging in user: {e}", exc_info=True)
            raise InternalServerException("Error logging in user")

    @staticmethod
    def get_current_user(
        token: str = Depends(oauth2_scheme),
        user_repo: UserRepository = Depends(UserRepository),
    ) -> User:
        """
        Get the current user by decoding the JWT token.

        :param token: The JWT token obtained from the OAuth2PasswordBearer
        :param user_repo: The UserRepository instance
        :return: The authenticated User object
        :raises HTTPException: If the token is invalid or expired, or if the user is not found
        """
        try:
            payload = jwt.decode(
                token, auth_settings.secret_key, algorithms=[auth_settings.algorithm]
            )
            username: str = payload.get("sub")
            if username is None:
                logger.warning("Invalid token: missing 'sub' claim")
                raise HTTPException(status_code=401, detail="Invalid token")
            user = user_repo.get_user_by_username(username)
            if user is None:
                logger.warning(f"User not found: {username}")
                raise HTTPException(status_code=401, detail="User not found")
            return user
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logger.error(f"Error decoding token: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error")

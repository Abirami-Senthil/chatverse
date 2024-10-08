import logging
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from config import LOG_LEVEL
from repository.database import User, get_session_local
from typing import Optional

# Configure logging
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)


class UserRepository:
    """
    Repository class for handling user-related database operations.
    """

    def __init__(self, db: Session = Depends(get_session_local)):
        """
        Initialize the UserRepository with a database session.

        :param db: SQLAlchemy database session
        """
        self.db = db

    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Retrieve a user from the database by their username.

        :param username: The username of the user to retrieve
        :return: User object if found, None otherwise
        """
        try:
            user = self.db.query(User).filter(User.username == username).first()
            return user
        except SQLAlchemyError as e:
            logger.error(f"Database error while retrieving user {username}: {str(e)}")
            raise

    def create_user(self, username: str, hashed_password: str) -> User:
        """
        Create a new user in the database.

        :param username: The username for the new user
        :param hashed_password: The hashed password for the new user
        :return: Newly created User object
        """
        try:
            new_user = User(username=username, hashed_password=hashed_password)
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)
            return new_user
        except IntegrityError:
            self.db.rollback()
            logger.warning(f"Attempt to create duplicate user: {username}")
            raise HTTPException(status_code=409, detail="Username is already taken")
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error while creating user {username}: {str(e)}")
            raise

from pydantic import BaseModel, Field

class UserModel(BaseModel):
    """
    UserModel represents the data structure for user registration and login.

    Attributes:
        username (str): The username of the user.
        password (str): The password of the user.
    """
    username: str = Field(..., min_length=3, max_length=50, description="The username of the user.")
    password: str = Field(..., min_length=8, description="The password of the user, must be at least 8 characters long.")
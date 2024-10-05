from pydantic import BaseModel, Field


class UserToken(BaseModel):
    """
    UserToken represents the structure of the token returned after user authentication.

    Attributes:
        access_token (str): The JWT access token for the user.
        token_type (str): The type of the token, typically 'bearer'.
    """
    access_token: str = Field(..., description="The JWT access token for the user.")
    token_type: str = Field(..., description="The type of the token, typically 'bearer'.")
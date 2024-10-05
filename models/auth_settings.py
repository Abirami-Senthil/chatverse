from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AuthSettings(BaseModel):
    """
    AuthSettings represents the authentication configuration.

    Attributes:
        secret_key (str): The secret key used for JWT encoding/decoding.
        algorithm (str): The algorithm used for JWT encoding/decoding.
    """
    secret_key: str = Field(..., description="Secret key for JWT")
    algorithm: str = Field(default="HS256", description="Algorithm for JWT")

def get_auth_settings() -> AuthSettings:
    """
    Retrieves the authentication settings from environment variables.

    Returns:
        AuthSettings: An instance of AuthSettings with the loaded configuration.

    Raises:
        ValueError: If the JWT_SECRET_KEY is not set in the environment.
    """
    secret_key = os.getenv("JWT_SECRET_KEY")
    if not secret_key:
        raise ValueError("JWT_SECRET_KEY must be set in the environment")
    
    return AuthSettings(secret_key=secret_key)

# Initialize auth settings
auth_settings = get_auth_settings()
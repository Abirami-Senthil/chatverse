from pydantic import BaseModel, Field


class MessageRequest(BaseModel):
    """
    MessageRequest represents the request structure for sending a message.

    Attributes:
        message (str): The message to be sent. Must not be empty and should be between 1 and 1000 characters.
    """
    message: str = Field(..., min_length=1, max_length=1000, description="The message to be sent.")

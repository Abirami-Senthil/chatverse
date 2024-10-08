from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from fastapi.staticfiles import StaticFiles
from routes.auth import auth_router
from routes.chats import chats_router
from routes.messages import chat_messages_router
from config import LOG_LEVEL

# Configure logging
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware so the local frontend
# developement server can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(chats_router, prefix="/chats", tags=["Chats"])
app.include_router(chat_messages_router, prefix="/chats", tags=["Messages"])


frontend_build_output_dir = os.environ.get("FRONTEND_BUILD_OUTPUT_DIR")
if frontend_build_output_dir:
    app.mount(
        "/",
        StaticFiles(directory=frontend_build_output_dir, html=True),
        name="frontend",
    )

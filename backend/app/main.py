import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routers import chat, user, roadmap
from app.routers import health
from app.routers import course_picks
from app.routers import careers
from app.routers import handbook

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI()
load_dotenv()


def get_cors_origins():
    # Production origins come from BACKEND_CORS_ORIGINS; the default covers local dev only.
    origins = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000",
    )
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(roadmap.router, prefix="/roadmap", tags=["Roadmap"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(course_picks.router)
app.include_router(careers.router)
app.include_router(handbook.router)

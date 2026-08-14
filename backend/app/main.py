import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routers import auth, chat, recommendation, user, roadmap, smart_related
from app.routers.final_plan import router as final_plan_router
from app.routers.ai_advisor import router as smart_summary_router
from app.routers import traits
from app.routers import health
from app.routers import compare_programs
from app.routers import switch_advisor

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

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(
    recommendation.router, prefix="/recommendation", tags=["Recommendation"]
)
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(final_plan_router, prefix="/final-unsw-degrees")
app.include_router(final_plan_router, prefix="/final-degree-plan")
app.include_router(
    smart_summary_router, prefix="/smart-summary", tags=["AI Smart Summaries"]
)
app.include_router(roadmap.router, prefix="/roadmap", tags=["Roadmap"])
app.include_router(smart_related.router)
app.include_router(traits.router, prefix="/traits", tags=["Traits"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(compare_programs.router)
app.include_router(switch_advisor.router)

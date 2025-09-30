from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .routers import auth, chat, recommendation, user, reports, roadmap, smart_related
from app.routers.final_plan import router as final_plan_router
from app.routers.ai_advisor import router as smart_summary_router
from app.routers import mindmesh_ai
from app.routers import traits
from app.routers import health

app = FastAPI()

raw = os.getenv("FRONTEND_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # e.g. ["http://localhost:5173","https://uni-vise-delta.vercel.app"]
    allow_credentials=True,  # set False if you don’t need cookies/auth’ed xhr
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(
    recommendation.router, prefix="/recommendation", tags=["Recommendation"]
)
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(final_plan_router, prefix="/final-unsw-degrees")
app.include_router(final_plan_router, prefix="/final-degree-plan")
app.include_router(
    smart_summary_router, prefix="/smart-summary", tags=["AI Smart Summaries"]
)
app.include_router(roadmap.router, prefix="/roadmap", tags=["Roadmap"])
app.include_router(mindmesh_ai.router, prefix="/mindmesh", tags=["MindMesh"])
app.include_router(smart_related.router)
app.include_router(traits.router, prefix="/traits", tags=["Traits"])
app.include_router(health.router, prefix="/health", tags=["Health"])

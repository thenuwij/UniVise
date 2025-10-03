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

ALLOWED_ORIGIN_REGEX = (
    r"^https://uni-vise(?:-[a-z0-9-]+)?-univise\.vercel\.app$|"
    r"^https://.*\.ngrok-free\.(dev|app)$"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://uni-vise-delta.vercel.app",
        "https://uni-vise-git-main-univise.vercel.app",
        "https://uni-vise-h2nhqfr5y-univise.vercel.app",
        "http://localhost:3000",  # local dev
        "http://localhost:5173",  # if using Vite
        "https://*.ngrok-free.dev",  # any ngrok-free subdomain
        "https://*.vercel.app",  # any vercel subdomain
    ],
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,  # only if you use cookies/auth sessions
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "*"
    ],  # or list specific ones you send (Authorization, Content-Type, etc.)
    expose_headers=["*"],  # optional: expose any custom response headers
    max_age=3600,  # optional: cache preflight for 1h
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

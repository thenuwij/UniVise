from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routers import auth, chat, recommendation, user, reports, chatbot_routes, ai_advisor
from app.routers.final_plan import router as final_plan_router
from app.routers.ai_advisor import router as smart_summary_router

app = FastAPI()
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(
    recommendation.router, prefix="/recommendation", tags=["Recommendation"]
)
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(final_plan_router, prefix="/final-degree-plan")
app.include_router(smart_summary_router, prefix="/smart-summary", tags=["AI Smart Summaries"])

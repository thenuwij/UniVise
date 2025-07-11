from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .routers import auth, recommendation, user

app = FastAPI()
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(
    recommendation.router, prefix="/recommendation", tags=["Recommendation"]
)

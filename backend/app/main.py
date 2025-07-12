from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import auth, recommendation, user
from app.routers import chatbot_routes

app = FastAPI()
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-frontend-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Recommendation API"}

app.include_router(chatbot_routes.router, prefix="/chat", tags=["Chatbot"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
=======
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
>>>>>>> main

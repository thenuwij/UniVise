from fastapi import FastAPI
from backend.app.routes import ai_service

app = FastAPI()
app.include_router(ai_service.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Recommendation API"}

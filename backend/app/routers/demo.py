from fastapi import APIRouter

from app.services.demo import start_demo

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post("/session")
async def start_demo_session():
    """Create a private demo student and return a one-time sign-in token. No login needed."""
    return await start_demo()

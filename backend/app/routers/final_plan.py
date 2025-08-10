from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from app.routers.final_plan_service import generate_final_plan

router = APIRouter()

@router.post("/")
async def get_final_recommendations(user=Depends(get_current_user)):
    """
    Generate a final degree plan for the user based on their recommendations.
    """
    try:
        plan = await generate_final_plan(user.id)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

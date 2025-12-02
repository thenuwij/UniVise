from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from app.routers.final_plan_service import generate_final_plan
import traceback

router = APIRouter()

# Generate final unsw degree recommendations for university students based on the career recs on dashboard\
@router.post("/")
async def get_final_recommendations(user=Depends(get_current_user)):
    try:
        print(">>> /final-unsw-degrees/ called for user:", user.id)
        plan = await generate_final_plan(user.id)
        print("Plan generated successfully for user:", user.id)
        return plan

    except Exception as e:
        print("ERROR in /final-unsw-degrees/:", e)
        traceback.print_exc()   # print full traceback
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends
from dependencies import get_current_user

router = APIRouter()


@router.get("/me")
def get_user(user=Depends(get_current_user)):
    return {"id": user.id, "email": user.email}

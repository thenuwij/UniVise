import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.core.database import supabase

logger = logging.getLogger(__name__)

router = APIRouter()


@router.delete("/me")
async def delete_my_account(user=Depends(get_current_user)):
    try:
        await asyncio.to_thread(supabase.auth.admin.delete_user, user.id)
    except Exception as e:
        logger.exception(f"Account delete failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Could not delete your account. Please try again.")
    return {"deleted": True}

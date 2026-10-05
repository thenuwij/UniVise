import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.core.auth import get_current_user
from app.core.database import supabase
from app.services.user_data_export import gather_user_data

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


@router.get("/me/export")
async def export_my_data(user=Depends(get_current_user)):
    try:
        data = await gather_user_data(user.id)
    except Exception as e:
        logger.exception(f"Data export failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Could not prepare your data. Please try again.")
    filename = f"univise-my-data-{data['exported_at'][:10]}.json"
    return JSONResponse(
        jsonable_encoder(data),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

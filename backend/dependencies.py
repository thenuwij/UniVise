import logging
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.database import supabase

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
):
    token = credentials.credentials

    try:
        user_response = supabase.auth.get_user(token)

        user = getattr(user_response, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user  # This is a supabase.User object

    except Exception as e:
        logger.error("Error verifying token: %s", e)
        raise HTTPException(status_code=401, detail="Invalid or expired Supabase token")

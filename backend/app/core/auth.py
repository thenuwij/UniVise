import asyncio
import logging
from types import SimpleNamespace

import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import SUPABASE_URL
from app.core.database import supabase

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()

AUTH_ISSUER = f"{(SUPABASE_URL or '').rstrip('/')}/auth/v1"
signing_keys = jwt.PyJWKClient(f"{AUTH_ISSUER}/.well-known/jwks.json", cache_keys=True, lifespan=3600, timeout=5)


def verify_locally(token: str):
    key = signing_keys.get_signing_key_from_jwt(token).key
    claims = jwt.decode(token, key, algorithms=["ES256", "RS256"], audience="authenticated", issuer=AUTH_ISSUER)
    return SimpleNamespace(id=claims["sub"], email=claims.get("email"), user_metadata=claims.get("user_metadata") or {})


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
):
    token = credentials.credentials

    try:
        return await asyncio.to_thread(verify_locally, token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Invalid or expired Supabase token")
    except Exception as e:
        logger.info("Token not verified locally, asking Supabase: %s", type(e).__name__)

    try:
        user_response = supabase.auth.get_user(token)

        user = getattr(user_response, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user  # This is a supabase.User object

    except Exception as e:
        logger.error("Error verifying token: %s", e)
        raise HTTPException(status_code=401, detail="Invalid or expired Supabase token")

# app/deps/auth.py

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Use HTTPBearer just so FastAPI knows we're "authenticating"
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Dummy stub for current_user.
    In production, validate the JWT (e.g. via Supabase), fetch user record, etc.
    For now, we ignore whatever token is passed and return a fake user.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    # You could inspect credentials.credentials (the raw token) here if you like.
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "roles": ["user"],
    }

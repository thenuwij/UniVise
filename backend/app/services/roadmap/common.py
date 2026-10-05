import logging

from fastapi import HTTPException
from typing import Optional, Any, Dict, List

logger = logging.getLogger(__name__)

# Helper functions
def ensure(cond: bool, msg: str):
    if not cond:
        raise HTTPException(status_code=400, detail=msg)

def assert_keys(payload: Dict[str, Any], required: List[str], where: str):
    missing = [k for k in required if k not in payload]
    if missing:
        logger.error(f"AI payload missing keys in {where}: {missing}")
        raise HTTPException(500, detail="The AI response was incomplete. Please try again.")

def _first_or_none(res) -> Optional[Dict[str, Any]]:
    return res.data[0] if (res and getattr(res, "data", None)) else None


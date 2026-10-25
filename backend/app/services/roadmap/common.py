from fastapi import HTTPException

# Helper functions
def ensure(cond: bool, msg: str):
    if not cond:
        raise HTTPException(status_code=400, detail=msg)

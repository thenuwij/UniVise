from fastapi import HTTPException
from typing import Optional, Any, Dict, List
from app.llm.json_parsing import extract_json

# Helper functions
def ensure(cond: bool, msg: str):
    if not cond:
        raise HTTPException(status_code=400, detail=msg)

def table_for_mode(mode: str) -> str:
    mapping = {"school": "school_roadmap", "unsw": "unsw_roadmap"}
    tbl = mapping.get(mode)
    if not tbl:
        raise HTTPException(status_code=404, detail="Invalid mode")
    return tbl

def parse_json_or_500(raw: str) -> Dict[str, Any]:
    try:
        return extract_json(raw)
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to parse AI JSON: {e}")

def assert_keys(payload: Dict[str, Any], required: List[str], where: str):
    missing = [k for k in required if k not in payload]
    if missing:
        raise HTTPException(500, detail=f"AI payload missing keys in {where}: {missing}")

def _first_or_none(res) -> Optional[Dict[str, Any]]:
    return res.data[0] if (res and getattr(res, "data", None)) else None


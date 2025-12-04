from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
import json, re

# Request and Response models
class SchoolReq(BaseModel):
    recommendation_id: Optional[str] = None
    degree_name: Optional[str] = None
    country: Optional[str] = "AU"

class UNSWReq(BaseModel):
    degree_id: Optional[str] = None
    uac_code: Optional[str] = None
    program_name: Optional[str] = None
    specialisation: Optional[str] = None

class RoadmapResp(BaseModel):
    id: str
    mode: str
    payload: Dict[str, Any]

# Helper functions
TERMS = ("T1", "T2", "T3")
COURSES_TABLE = "unsw_courses"

def ensure(cond: bool, msg: str):
    if not cond:
        raise HTTPException(status_code=400, detail=msg)

def table_for_mode(mode: str) -> str:
    mapping = {"school": "school_roadmap", "unsw": "unsw_roadmap", "transcript": "transcript_roadmap"}
    tbl = mapping.get(mode)
    if not tbl:
        raise HTTPException(status_code=404, detail="Invalid mode")
    return tbl

def clean_openai_response(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE).strip()
    return cleaned

def parse_json_or_500(raw: str) -> Dict[str, Any]:
    cleaned = clean_openai_response(raw)
    try:
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to parse OpenAI JSON: {e}\nRaw:\n{cleaned}")

def assert_keys(payload: Dict[str, Any], required: List[str], where: str):
    missing = [k for k in required if k not in payload]
    if missing:
        raise HTTPException(500, detail=f"AI payload missing keys in {where}: {missing}")

def _first_or_none(res) -> Optional[Dict[str, Any]]:
    return res.data[0] if (res and getattr(res, "data", None)) else None


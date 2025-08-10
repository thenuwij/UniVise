from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
import json, re

# ---------- Request/Response models (unchanged) ----------
class SchoolReq(BaseModel):
    recommendation_id: Optional[str] = None
    degree_name: Optional[str] = None
    country: Optional[str] = "AU"

class UNSWReq(BaseModel):
    degree_id: Optional[str] = None
    uac_code: Optional[str] = None
    program_name: Optional[str] = None
    specialisation: Optional[str] = None

class TranscriptReq(BaseModel):
    current_degree: Optional[str] = None
    current_specialisation: Optional[str] = None
    current_wam: Optional[float] = None
    uoc_completed: Optional[int] = None

class RoadmapResp(BaseModel):
    id: str
    mode: str
    payload: Dict[str, Any]

# ---------- Constants / helpers ----------
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

def _uoc_to_int(uoc_val: Any) -> Optional[int]:
    if uoc_val is None:
        return None
    if isinstance(uoc_val, (int, float)):
        return int(uoc_val)
    m = re.search(r"(\d+)", str(uoc_val))
    return int(m.group(1)) if m else None

def _parse_offerings(offering_terms: Any) -> List[str]:
    """
    Accepts 'T1,T3', ['T2','T3'], 'Term 2', 'T1/T2', None -> all terms.
    Returns ordered, de-duped subset of TERMS.
    """
    if offering_terms is None:
        return list(TERMS)
    if isinstance(offering_terms, list):
        raw = ",".join(str(x) for x in offering_terms)
    else:
        raw = str(offering_terms)
    s = raw.upper()
    s = re.sub(r"[|/;]+", ",", s)
    nums = []
    nums += re.findall(r"\bT([123])\b", s)
    nums += re.findall(r"\bTERM\s*([123])\b", s)
    seen, out = set(), []
    for n in nums:
        t = f"T{n}"
        if t in TERMS and t not in seen:
            seen.add(t); out.append(t)
    return out or list(TERMS)

def _year_term_grid(duration_years: Optional[int]) -> List[Dict[str, Any]]:
    years = int(duration_years or 3)
    return [{"year": y + 1, "terms": [{"term": t, "courses": []} for t in TERMS]} for y in range(years)]

def _place_verified_course(grid: List[Dict[str, Any]], year_idx: int, term: str, course: Dict[str, Any]) -> bool:
    target = next((t for t in grid[year_idx]["terms"] if t["term"] == term), None)
    if target and len(target["courses"]) < 3:
        target["courses"].append(course)
        return True
    for t in grid[year_idx]["terms"]:
        if t["term"] in course["offerings"] and len(t["courses"]) < 3:
            t["courses"].append(course)
            return True
    return False

def _count_year_courses(grid: List[Dict[str, Any]], year_idx: int) -> int:
    return sum(len(t["courses"]) for t in grid[year_idx]["terms"])

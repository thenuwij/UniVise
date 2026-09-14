from pydantic import BaseModel
from typing import Optional, Any, Dict

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

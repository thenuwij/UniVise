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

class ProgramCapstone(BaseModel):
    courses: list[str]
    highlights: str

class ProgramOverview(BaseModel):
    summary: str
    capstone: ProgramCapstone

class FacultySociety(BaseModel):
    name: str
    category: str
    relevance: str
    key_activities: list[str]
    membership_benefits: str
    professional_affiliation: Optional[str]

class CrossFacultySociety(BaseModel):
    name: str
    why_join: str

class SocietyEvent(BaseModel):
    event_name: str
    description: str
    frequency: str
    typical_timing: str

class SocietyProfessionalDevelopment(BaseModel):
    student_chapters: list[str]
    leadership_note: str
    skills_gained: list[str]

class SocietyGettingStarted(BaseModel):
    join_timing: str
    how_to_find: str
    cost_range: str

class Societies(BaseModel):
    faculty_specific: list[FacultySociety]
    cross_faculty: list[CrossFacultySociety]
    major_events: list[SocietyEvent]
    professional_development: SocietyProfessionalDevelopment
    getting_started: SocietyGettingStarted

class SocietiesSection(BaseModel):
    societies: Societies

class RoadmapResp(BaseModel):
    id: str
    mode: str
    payload: Dict[str, Any]

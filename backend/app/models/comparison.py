from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class ProgramComparisonRequest(BaseModel):
    base_program_code: str
    base_specialisation_codes: List[str] = []
    target_program_code: str
    target_specialisation_codes: List[str] = []


class SimpleCourse(BaseModel):
    code: str
    name: str
    uoc: int
    level: int
    mark: Optional[float] = None


class LevelGroup(BaseModel):
    level: int
    level_name: str
    courses: List[Dict[str, Any]]
    total_courses: int
    total_uoc: int
    has_prerequisite_issues: bool


class CriticalIssue(BaseModel):
    type: str
    severity: str
    message: str
    affected_courses: List[str]
    impact: str


class ProgramComparisonResponse(BaseModel):
    can_transfer: bool
    recommendation: str
    summary: Dict[str, Any]
    transfer_analysis: Dict[str, Any]
    requirements_by_level: Dict[str, LevelGroup]
    critical_issues: List[CriticalIssue]
    detailed_breakdown: Optional[Dict[str, Any]] = None

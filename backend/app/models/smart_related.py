from pydantic import BaseModel
from typing import Optional

# Request model for finding degrees related to a course
class CourseToDegreesReq(BaseModel):
    course_id: Optional[str] = None
    course_code: Optional[str] = None
    top_k: int = 4
    restrict_faculty: bool = True

# Response model for degree recommendations
class DegreeOut(BaseModel):
    id: str
    program_name: str
    uac_code: Optional[str] = None
    faculty: Optional[str] = None
    reason: Optional[str] = None
    score: Optional[float] = None

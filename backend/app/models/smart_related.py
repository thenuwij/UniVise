from pydantic import BaseModel
from typing import Optional

# Request model for finding the programs that include a course
class CourseToDegreesReq(BaseModel):
    course_id: Optional[str] = None
    course_code: Optional[str] = None

# A program whose structure includes the course
class DegreeOut(BaseModel):
    id: str
    program_code: str
    program_name: str
    faculty: Optional[str] = None

from pydantic import BaseModel, Field
from typing import List, Optional


class BaseProfile(BaseModel):
    user_id: str = Field(..., description="Unique ID for the user")
    interests: List[str] = Field(
        default_factory=list, description="Tags or keywords pulled from survey"
    )


class HighschoolProfile(BaseModel):
    user_id: str
    subjects: List[str]
    strongest_subjects: List[str]
    atar: Optional[float]
    interests: Optional[List[str]]
    traits: dict


class UniProfile(BaseModel):
    user_id: str
    wam: float
    top_courses: List[str]
    interests: Optional[List[str]]
    traits: dict


class ExplainRequest(BaseModel):
    rec_id: str

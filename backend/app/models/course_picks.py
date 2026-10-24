from typing import Literal

from pydantic import BaseModel, Field


class CoursePick(BaseModel):
    code: str
    reason: str
    skills: list[str] = Field(default_factory=list, max_length=3)
    careers: list[str] = Field(default_factory=list, max_length=3)
    usefulness: Literal["high", "medium", "general"] = "general"


class CoursePicks(BaseModel):
    picks: list[CoursePick] = Field(max_length=5)


class CourseRef(BaseModel):
    code: str
    name: str


class CoursePickOut(BaseModel):
    code: str
    name: str
    reason: str
    skills: list[str] = []
    careers: list[str] = []
    usefulness: str = "general"
    unlocks: list[CourseRef] = []


class CoursePicksResponse(BaseModel):
    program_code: str | None = None
    picks: list[CoursePickOut] = []
    available: list[CourseRef] = []
    careers: list[str] = []
    completed_count: int = 0
    failed: bool = False

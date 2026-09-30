from pydantic import BaseModel, Field


class CoursePick(BaseModel):
    code: str
    reason: str


class CoursePicks(BaseModel):
    picks: list[CoursePick] = Field(max_length=5)


class CoursePickOut(BaseModel):
    code: str
    name: str
    reason: str


class CoursePicksResponse(BaseModel):
    program_code: str | None = None
    picks: list[CoursePickOut] = []
    failed: bool = False

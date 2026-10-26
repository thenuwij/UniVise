from typing import Literal

from pydantic import BaseModel, Field


class CareerCertification(BaseModel):
    name: str
    provider: str
    why: str
    level: Literal["Beginner", "Intermediate", "Advanced"]
    cost: Literal["Free", "Paid"]
    time: str
    when: Literal["While studying", "After graduating"]
    url: str
    start_here: bool = False


class CareerCertificationGroup(BaseModel):
    career: str
    certifications: list[CareerCertification] = Field(max_length=4)


class CareerCertificationGroups(BaseModel):
    groups: list[CareerCertificationGroup]


class CareerCertificationsResponse(BaseModel):
    careers: list[str] = []
    saved_careers: list[str] = []
    groups: list[CareerCertificationGroup] = []
    failed: bool = False

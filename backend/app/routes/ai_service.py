from pydantic import BaseModel, Field
from typing import Optional, List


class HSCProfile(BaseModel):
    subjects: List[str] = Field(..., description="All current subjects")
    strongest_subjects: List[str] = Field(
        ..., description="2-3 Strongest Subjects", min_length=1, max_length=3
    )
    estimated_ATAR: float = Field(
        ...,
        ge=0,
        le=100,
        description="Estimated ATAR (0-100)",
    )
    interests: List[str] = Field(..., description="Academic/extracurricular interests")
    personality_traits: List[str] = Field(
        ..., description="Traits (e.g. analytical, creative)"
    )


class UniProfile(BaseModel):
    currentWAM: float = Field(
        ...,
        description="Current WAM",
        ge=0,
        le=100,
    )
    interests: List[str] = Field(..., description="Field or Job Interests")
    job_goals: List[str] = Field(..., description="Desired career paths")


class RecommendationRequest(BaseModel):
    high_school_profile: Optional[HSCProfile] = None
    uni_profile: Optional[UniProfile] = None


class RecommendationResponse(BaseModel):
    recommendations: List[str]  # List of recommendations
    rationale: str  # String of explanations

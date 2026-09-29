from pydantic import BaseModel, Field

CAREER_RECOMMENDATION_COUNT = 4
SALARY_RANGE_PATTERN = r"^\$\d{1,3}(,\d{3})* - \$\d{1,3}(,\d{3})*$"


class CareerRecommendation(BaseModel):
    career_title: str
    industry: str
    suitability_score: int = Field(ge=0, le=100)
    reason: str
    avg_salary_range: str = Field(pattern=SALARY_RANGE_PATTERN)
    education_required: str
    skills_needed: list[str]
    link: str
    source: str


class CareerRecommendations(BaseModel):
    recommendations: list[CareerRecommendation] = Field(
        min_length=CAREER_RECOMMENDATION_COUNT, max_length=CAREER_RECOMMENDATION_COUNT
    )

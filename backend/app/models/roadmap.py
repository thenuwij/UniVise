from pydantic import BaseModel, Field
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

class MandatoryPlacements(BaseModel):
    required: bool
    details: str
    course_codes: list[str]

class InternshipProgram(BaseModel):
    program_name: str
    company: str
    duration: str
    timing: str
    paid: bool
    application_period: str
    competitiveness: str
    apply_url: str

class IndustryExperience(BaseModel):
    mandatory_placements: MandatoryPlacements
    internship_programs: list[InternshipProgram]
    top_recruiting_companies: list[str]
    career_fairs: str
    wil_opportunities: str
    wil_course_codes: list[str]

class IndustryExperienceSection(BaseModel):
    industry_experience: IndustryExperience

class CareerRole(BaseModel):
    title: str
    salary_range: str
    description: str
    requirements: str
    hiring_companies: list[str]
    source: str
    source_url: str
    degree_path: str
    degree_courses: list[str] = Field(max_length=3)
    next_steps: list[str] = Field(min_length=1, max_length=3)

class EntryLevelStage(BaseModel):
    roles: list[CareerRole] = Field(min_length=3, max_length=3)

class ExperiencedStage(BaseModel):
    roles: list[CareerRole] = Field(min_length=2, max_length=2)

class Certification(BaseModel):
    name: str
    provider: str
    importance: str
    timeline: str
    notes: Optional[str]
    url: str

class MarketInsights(BaseModel):
    demand_level: str
    trends: str
    geographic_notes: str

class SectorEmployers(BaseModel):
    sector: str
    companies: list[str]

class EmploymentStats(BaseModel):
    employment_rate: str
    median_starting_salary: str
    source: str

class CareerPathways(BaseModel):
    entry_level: EntryLevelStage
    mid_career: ExperiencedStage
    senior: ExperiencedStage
    certifications: list[Certification] = Field(min_length=2, max_length=3)
    market_insights: MarketInsights
    top_employers: list[SectorEmployers] = Field(min_length=2, max_length=3)
    employment_stats: EmploymentStats

class CareerPathwaysSection(BaseModel):
    career_pathways: CareerPathways

class RoadmapResp(BaseModel):
    id: str
    mode: str
    payload: Dict[str, Any]

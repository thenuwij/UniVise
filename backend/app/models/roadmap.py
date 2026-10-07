from pydantic import BaseModel, Field, create_model
from typing import Optional, Any, Dict, Literal

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

class SocietyProfessionalDevelopment(BaseModel):
    student_chapters: list[str]
    leadership_note: str
    skills_gained: list[str]

class SocietyGettingStarted(BaseModel):
    join_timing: str
    how_to_find: str

class Societies(BaseModel):
    faculty_specific: list[FacultySociety]
    cross_faculty: list[CrossFacultySociety]
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
    career_fairs: str
    wil_opportunities: str
    wil_course_codes: list[str]

class IndustryExperienceSection(BaseModel):
    industry_experience: IndustryExperience

class CareerRole(BaseModel):
    anzsco_code: str
    title: str
    salary_range: str
    description: str
    requirements: str
    degree_path: str
    degree_courses: list[str] = Field(max_length=3)
    specialisations: list[str] = Field(max_length=2)
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

class CareerPathways(BaseModel):
    entry_level: EntryLevelStage
    mid_career: ExperiencedStage
    senior: ExperiencedStage
    certifications: list[Certification] = Field(min_length=2, max_length=3)

class CareerPathwaysSection(BaseModel):
    career_pathways: CareerPathways

def career_pathways_schema(occupation_codes: list[str], specialisation_codes: list[str] | None = None) -> type[BaseModel]:
    if not occupation_codes and not specialisation_codes:
        return CareerPathwaysSection

    fields: Dict[str, Any] = {}
    if occupation_codes:
        fields["anzsco_code"] = (Literal[tuple(occupation_codes)], ...)
    if specialisation_codes:
        fields["specialisations"] = (list[Literal[tuple(specialisation_codes)]], Field(max_length=2))
    role = create_model("AllowedRole", __base__=CareerRole, **fields)
    entry = create_model("AllowedEntryLevel", roles=(list[role], Field(min_length=3, max_length=3)))
    experienced = create_model("AllowedExperienced", roles=(list[role], Field(min_length=2, max_length=2)))
    pathways = create_model(
        "AllowedPathways", __base__=CareerPathways, entry_level=(entry, ...), mid_career=(experienced, ...), senior=(experienced, ...)
    )
    return create_model("AllowedSection", career_pathways=(pathways, ...))

class RoadmapResp(BaseModel):
    id: str
    mode: str
    payload: Dict[str, Any]

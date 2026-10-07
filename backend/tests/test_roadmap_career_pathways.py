"""Tests for the roadmap career pathways step.

The AI calls and link checks are faked; these check that roles can only use
occupations allowed for the degree, that salaries stay the AI estimate without
a source, that roles carry their occupation's official pay and demand,
that each role only names courses from the program's real
course list, that programs with few courses of their own suggest real
specialisations instead, and the fallback when generation fails.
"""
import asyncio
import copy

import pytest
from pydantic import ValidationError

from app.models.roadmap import CareerPathwaysSection, career_pathways_schema
from app.services.roadmap import industry

JSA = {"data_period": "Earnings May 2025", "source": "Jobs and Skills Australia", "source_url": "https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles"}
OCCUPATIONS = [
    {"code": "2211", "title": "Accountants", "weekly_earnings": 2010, "in_demand_nsw": True, **JSA},
    {"code": "2212", "title": "Auditors, Company Secretaries and Corporate Treasurers", "weekly_earnings": None, "in_demand_nsw": False, **JSA},
]
OUTLOOK = [{"study_area": "Business and management", "full_time_employment_rate": 81.5, "median_salary": 70000, "survey_year": 2025, "source": "QILT", "source_url": "https://www.qilt.edu.au"}]

CONTEXT = {
    "program_name": "Bachelor of Commerce",
    "faculty": "UNSW Business School",
    "career_occupations": OCCUPATIONS,
    "career_outlook": OUTLOOK,
    "program_courses": [
        {"code": "ACCT1501", "name": "Accounting and Financial Management 1A", "section": "Core", "section_rule": ""},
        {"code": "COMM1140", "name": "Financial Management", "section": "Core", "section_rule": ""},
    ],
}

ROLE = {
    "anzsco_code": "2211",
    "title": "Graduate Accountant",
    "salary_range": "$70,000 - $80,000",
    "description": "Prepares financial statements.",
    "requirements": "Accounting major; Excel",
    "degree_path": "The accounting major leads straight into graduate audit roles.",
    "degree_courses": ["ACCT1501", "COMM1140"],
    "specialisations": [],
    "next_steps": ["Join the Accounting Society", "Apply for a summer vacation program"],
}

GENERATED = {
    "career_pathways": {
        "entry_level": {"roles": [ROLE] * 3},
        "mid_career": {"roles": [ROLE] * 2},
        "senior": {"roles": [ROLE] * 2},
        "certifications": [
            {
                "name": "CPA Program",
                "provider": "CPA Australia",
                "importance": "Highly Recommended",
                "timeline": "Within 3 years of graduating",
                "notes": None,
                "url": "https://www.cpaaustralia.com.au/become-a-cpa",
            }
        ] * 2,
    }
}


@pytest.fixture
def fakes(monkeypatch):
    calls = {"prompts": [], "schemas": []}

    async def reply(prompt, schema, **kwargs):
        calls["prompts"].append(prompt)
        calls["schemas"].append(schema)
        return schema.model_validate(calls.get("generated", GENERATED))

    async def link_ok(url):
        return calls.get("links_ok", True)

    monkeypatch.setattr(industry, "ask_gpt_structured", reply)
    monkeypatch.setattr(industry, "validate_url", link_ok)
    return calls


def test_roles_carry_their_occupation_and_the_prompt_lists_only_allowed_groups(fakes):
    result = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))

    role = result["career_pathways"]["entry_level"]["roles"][0]
    assert role["anzsco_code"] == "2211"
    assert role["occupation_title"] == "Accountants"
    assert "- 2211: Accountants" in fakes["prompts"][0]
    assert "Atlassian" not in fakes["prompts"][0]
    assert "top_employers" not in result["career_pathways"]
    assert "employment_stats" not in result["career_pathways"]


def test_schema_rejects_an_occupation_outside_the_allowed_list():
    schema = career_pathways_schema(["2211", "2212"])
    engineer = copy.deepcopy(GENERATED)
    engineer["career_pathways"]["senior"]["roles"][0] = {**ROLE, "anzsco_code": "2332"}

    with pytest.raises(ValidationError):
        schema.model_validate(engineer)


def test_without_occupations_the_plain_schema_is_used():
    assert career_pathways_schema([]) is CareerPathwaysSection


def test_salaries_stay_the_ai_estimate_without_a_source(fakes):
    pathways = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))["career_pathways"]

    role = pathways["entry_level"]["roles"][0]
    assert role["salary_range"] == "$70,000 - $80,000"
    assert role["salary_source"] is None
    assert "checked against current sources" not in fakes["prompts"][0]


def test_dead_certification_link_becomes_a_search(fakes):
    fakes["links_ok"] = False

    cert = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))["career_pathways"]["certifications"][0]

    assert cert["url"].startswith("https://www.google.com/search?q=CPA%20Program%20CPA%20Australia")


def test_drops_course_codes_outside_the_program(fakes):
    invented = copy.deepcopy(GENERATED)
    role = invented["career_pathways"]["entry_level"]["roles"][0]
    role["degree_courses"] = ["acct1501", "FAKE9999", "ACCT1501"]
    role["degree_path"] = "Start with FAKE9999 and ACCT1501."
    fakes["generated"] = invented

    result = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))

    assert "Core\n- ACCT1501: Accounting and Financial Management 1A" in fakes["prompts"][0]
    first = result["career_pathways"]["entry_level"]["roles"][0]
    assert first["degree_courses"] == ["ACCT1501"]
    assert first["degree_path"] == "Start with (course not listed) and ACCT1501."


def test_rejects_a_reply_with_missing_roles():
    short = copy.deepcopy(GENERATED)
    short["career_pathways"]["entry_level"]["roles"] = [ROLE]

    with pytest.raises(ValidationError):
        CareerPathwaysSection.model_validate(short)


def test_rejects_more_than_three_next_steps():
    extra = copy.deepcopy(GENERATED)
    extra["career_pathways"]["entry_level"]["roles"][0]["next_steps"] = ["a", "b", "c", "d"]

    with pytest.raises(ValidationError):
        CareerPathwaysSection.model_validate(extra)


def test_returns_fallback_when_generation_fails(monkeypatch):
    async def ai_down(*args, **kwargs):
        raise ValueError("OpenAI returned no structured output (finish_reason=length)")

    monkeypatch.setattr(industry, "ask_gpt_structured", ai_down)

    result = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))

    assert result["failed"] is True
    assert result["career_pathways"]["entry_level"]["roles"] == []


def test_prompt_says_no_codes_without_a_course_list(fakes):
    result = asyncio.run(industry.ai_generate_career_pathways({"program_name": "Bachelor of Arts"}))

    assert "do not name any course codes" in fakes["prompts"][0]
    assert fakes["schemas"][0] is CareerPathwaysSection
    assert result["career_pathways"]["entry_level"]["roles"][0]["degree_courses"] == []


OPTIONS = [
    {"id": "spec-ai", "code": "COMPI1", "name": "Computer Science (Artificial Intelligence)"},
    {"id": "spec-sec", "code": "COMPY1", "name": "Computer Science (Security Engineering)"},
]


def test_thin_program_suggests_real_specialisations_instead_of_courses(fakes):
    suggested = copy.deepcopy(GENERATED)
    for stage in ("entry_level", "mid_career", "senior"):
        suggested["career_pathways"][stage]["roles"] = [
            {**role, "specialisations": ["COMPI1", "COMPI1"]} for role in suggested["career_pathways"][stage]["roles"]
        ]
    fakes["generated"] = suggested
    context = {**CONTEXT, "specialisation_options": OPTIONS}

    result = asyncio.run(industry.ai_generate_career_pathways(context))

    prompt = fakes["prompts"][0]
    assert "- COMPI1: Computer Science (Artificial Intelligence)" in prompt
    assert "do not name any course codes" in prompt
    assert "ACCT1501: Accounting" not in prompt
    role = result["career_pathways"]["entry_level"]["roles"][0]
    assert role["specialisations"] == [OPTIONS[0]]
    assert role["degree_courses"] == []


def test_schema_rejects_a_specialisation_outside_the_program():
    schema = career_pathways_schema(["2211"], ["COMPI1", "COMPY1"])
    invented = copy.deepcopy(GENERATED)
    for stage in ("entry_level", "mid_career", "senior"):
        invented["career_pathways"][stage]["roles"] = [
            {**role, "specialisations": ["COMPI1"]} for role in invented["career_pathways"][stage]["roles"]
        ]
    schema.model_validate(invented)
    invented["career_pathways"]["senior"]["roles"][0]["specialisations"] = ["MADE01"]

    with pytest.raises(ValidationError):
        schema.model_validate(invented)


def test_programs_with_courses_ask_for_no_specialisations(fakes):
    result = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))

    assert "- specialisations: an empty list" in fakes["prompts"][0]
    assert "SPECIALISATIONS:" not in fakes["prompts"][0]
    assert result["career_pathways"]["entry_level"]["roles"][0]["specialisations"] == []


@pytest.mark.parametrize(
    "chosen, course_count, expected",
    [([], 0, OPTIONS), ([], 5, OPTIONS), ([], 6, []), (["spec-ai"], 0, [])],
)
def test_options_only_load_for_thin_programs_without_a_choice(monkeypatch, chosen, course_count, expected):
    seen = {}

    async def careers(context):
        seen["options"] = context["specialisation_options"]
        return {"career_pathways": {"entry_level": {"roles": []}}}

    empty_context = {"selected_major_courses": [], "selected_minor_courses": [], "selected_honours_courses": [], "selected_major_codes": []}
    monkeypatch.setattr(industry, "supabase", None)
    monkeypatch.setattr(industry, "fetch_specialisation_context", lambda ids: dict(empty_context))
    monkeypatch.setattr(industry, "fetch_program_course_list", lambda code, extra: [{"code": f"COMP{1000 + i}"} for i in range(course_count)])
    monkeypatch.setattr(industry, "fetch_career_data", lambda code, majors: {"occupations": [], "outlook": []})
    monkeypatch.setattr(industry, "fetch_specialisation_options", lambda code, name: OPTIONS)
    monkeypatch.setattr(industry, "fetch_society_rows", lambda: [])
    monkeypatch.setitem(industry.INDUSTRY_GENERATORS, "career_pathways", (careers, "career_pathways"))

    existing = {"industry_societies": {"x": 1}, "industry_experience": {"x": 1}, "specialisation_ids": chosen}
    asyncio.run(industry.generate_industry_sections("3778", "Bachelor of Computer Science", existing))

    assert seen["options"] == expected


def test_roles_carry_official_pay_and_demand_and_the_outlook_is_attached(fakes):
    other = {**ROLE, "title": "Audit Senior", "anzsco_code": "2212"}
    generated = copy.deepcopy(GENERATED)
    generated["career_pathways"]["mid_career"]["roles"] = [other, other]
    fakes["generated"] = generated

    pathways = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))["career_pathways"]

    entry = pathways["entry_level"]["roles"][0]
    assert entry["typical_pay"] == {"weekly": 2010, "period": "Earnings May 2025", "source": "Jobs and Skills Australia", "source_url": JSA["source_url"]}
    assert entry["in_demand_nsw"] is True
    mid = pathways["mid_career"]["roles"][0]
    assert mid["typical_pay"] is None
    assert mid["in_demand_nsw"] is False
    assert pathways["outlook"] == OUTLOOK
    assert "market_insights" not in pathways
    assert "MARKET" not in fakes["prompts"][0]


def test_only_entry_roles_get_ad_search_words(fakes):
    pathways = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))["career_pathways"]

    assert pathways["entry_level"]["roles"][0]["ad_search"] == "accountant"
    assert "ad_search" not in pathways["mid_career"]["roles"][0]


def test_a_role_may_have_no_specialisation_and_aviation_may_use_pilots():
    from app.services.roadmap.career_data import PROGRAM_EXTRA_OCCUPATIONS

    schema = career_pathways_schema(["2211"], ["COMPI1"])
    generated = copy.deepcopy(GENERATED)
    schema.model_validate(generated)
    assert PROGRAM_EXTRA_OCCUPATIONS["3980"] == ["2311"]


def test_internships_prompt_prefers_employers_from_the_field(monkeypatch):
    prompts = []

    async def reply(prompt, schema, **kwargs):
        prompts.append(prompt)
        raise ValueError("stop after the prompt")

    monkeypatch.setattr(industry, "ask_claude_structured", reply)
    asyncio.run(industry.ai_generate_industry_experience(CONTEXT))

    assert "main business is in this field" in prompts[0]

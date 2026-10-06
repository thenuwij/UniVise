"""Tests for the roadmap career pathways step.

The AI calls, salary search and link checks are faked; these check that roles
can only use occupations allowed for the degree, that sourced salaries replace
the AI estimate, that each role only names courses from the program's real
course list, and the fallback when generation fails.
"""
import asyncio
import copy

import pytest
from pydantic import ValidationError

from app.models.roadmap import CareerPathwaysSection, career_pathways_schema
from app.services.roadmap import industry

OCCUPATIONS = [{"code": "2211", "title": "Accountants"}, {"code": "2212", "title": "Auditors, Company Secretaries and Corporate Treasurers"}]

CONTEXT = {
    "program_name": "Bachelor of Commerce",
    "faculty": "UNSW Business School",
    "career_occupations": OCCUPATIONS,
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
        "market_insights": {"trends": "Steady demand.", "geographic_notes": "Sydney CBD."},
    }
}


@pytest.fixture
def fakes(monkeypatch):
    calls = {"prompts": [], "schemas": []}

    async def reply(prompt, schema, **kwargs):
        calls["prompts"].append(prompt)
        calls["schemas"].append(schema)
        return schema.model_validate(calls.get("generated", GENERATED))

    async def salaries(roles, program_name):
        return calls.get("salaries", {})

    async def link_ok(url):
        return calls.get("links_ok", True)

    monkeypatch.setattr(industry, "ask_gpt_structured", reply)
    monkeypatch.setattr(industry, "search_role_salaries", salaries)
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


def test_sourced_salary_replaces_the_estimate_and_others_stay_ai_suggested(fakes):
    fakes["salaries"] = {"graduate accountant": {"salary_range": "$72,000 - $78,000", "source": "SEEK", "source_url": "https://www.seek.com.au/career-advice/role/graduate-accountant/salary"}}
    other = {**ROLE, "title": "Audit Senior", "anzsco_code": "2212"}
    generated = copy.deepcopy(GENERATED)
    generated["career_pathways"]["mid_career"]["roles"] = [other, other]
    fakes["generated"] = generated

    pathways = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))["career_pathways"]

    entry = pathways["entry_level"]["roles"][0]
    assert entry["salary_range"] == "$72,000 - $78,000"
    assert entry["salary_source"] == {"name": "SEEK", "url": "https://www.seek.com.au/career-advice/role/graduate-accountant/salary"}
    mid = pathways["mid_career"]["roles"][0]
    assert mid["salary_range"] == "$70,000 - $80,000"
    assert mid["salary_source"] is None


def test_salary_search_failure_keeps_the_estimates(fakes, monkeypatch):
    async def search_down(roles, program_name):
        raise TimeoutError("web search timed out")

    monkeypatch.setattr(industry, "search_role_salaries", search_down)

    result = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))

    role = result["career_pathways"]["entry_level"]["roles"][0]
    assert "failed" not in result
    assert role["salary_range"] == "$70,000 - $80,000"
    assert role["salary_source"] is None


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

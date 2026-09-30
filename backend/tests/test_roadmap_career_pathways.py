"""Tests for the roadmap career pathways step.

The AI call is faked; these check that sector employers come back in the
by_sector shape the frontend reads, that each role only names courses from
the program's real course list, and the fallback when generation fails.
"""
import asyncio
import copy

import pytest
from pydantic import ValidationError

from app.models.roadmap import CareerPathwaysSection
from app.services.roadmap import industry

CONTEXT = {
    "program_name": "Bachelor of Commerce",
    "faculty": "UNSW Business School",
    "program_courses": [
        {"code": "ACCT1501", "name": "Accounting and Financial Management 1A", "section": "Core", "section_rule": ""},
        {"code": "COMM1140", "name": "Financial Management", "section": "Core", "section_rule": ""},
    ],
}

ROLE = {
    "title": "Graduate Accountant",
    "salary_range": "$70,000 - $80,000",
    "description": "Prepares financial statements.",
    "requirements": "Accounting major; Excel",
    "hiring_companies": ["PwC Australia"],
    "source": "Seek",
    "source_url": "https://www.seek.com.au/graduate-accountant-jobs",
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
        "market_insights": {"demand_level": "High", "trends": "Steady demand.", "geographic_notes": "Sydney CBD."},
        "top_employers": [
            {"sector": "Professional services", "companies": ["PwC Australia", "Deloitte"]},
            {"sector": "Banking", "companies": ["Commonwealth Bank"]},
        ],
        "employment_stats": {"employment_rate": "88%", "median_starting_salary": "$72,000", "source": "QILT GOS 2025"},
    }
}


def test_returns_top_employers_keyed_by_sector(monkeypatch):
    async def reply(prompt, schema, **kwargs):
        assert schema is CareerPathwaysSection
        return CareerPathwaysSection.model_validate(GENERATED)

    monkeypatch.setattr(industry, "ask_gpt_structured", reply)

    result = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))

    pathways = result["career_pathways"]
    assert pathways["top_employers"] == {
        "by_sector": {
            "Professional services": ["PwC Australia", "Deloitte"],
            "Banking": ["Commonwealth Bank"],
        }
    }
    assert pathways["entry_level"]["roles"] == [ROLE] * 3
    assert pathways["employment_stats"]["employment_rate"] == "88%"


def test_rejects_a_reply_with_missing_roles():
    short = copy.deepcopy(GENERATED)
    short["career_pathways"]["entry_level"]["roles"] = [ROLE]

    with pytest.raises(ValidationError):
        CareerPathwaysSection.model_validate(short)


def test_returns_fallback_when_generation_fails(monkeypatch):
    async def ai_down(*args, **kwargs):
        raise ValueError("OpenAI returned no structured output (finish_reason=length)")

    monkeypatch.setattr(industry, "ask_gpt_structured", ai_down)

    result = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))

    assert result["failed"] is True
    assert result["career_pathways"]["top_employers"] == {"by_sector": {}}


def test_drops_course_codes_outside_the_program(monkeypatch):
    invented = copy.deepcopy(GENERATED)
    role = invented["career_pathways"]["entry_level"]["roles"][0]
    role["degree_courses"] = ["acct1501", "FAKE9999", "ACCT1501"]
    role["degree_path"] = "Start with FAKE9999 and ACCT1501."

    async def reply(prompt, schema, **kwargs):
        assert "Core\n- ACCT1501: Accounting and Financial Management 1A" in prompt
        return CareerPathwaysSection.model_validate(invented)

    monkeypatch.setattr(industry, "ask_gpt_structured", reply)

    result = asyncio.run(industry.ai_generate_career_pathways(CONTEXT))

    first = result["career_pathways"]["entry_level"]["roles"][0]
    assert first["degree_courses"] == ["ACCT1501"]
    assert first["degree_path"] == "Start with (course not listed) and ACCT1501."


def test_rejects_more_than_three_next_steps():
    extra = copy.deepcopy(GENERATED)
    extra["career_pathways"]["entry_level"]["roles"][0]["next_steps"] = ["a", "b", "c", "d"]

    with pytest.raises(ValidationError):
        CareerPathwaysSection.model_validate(extra)


def test_prompt_says_no_codes_without_a_course_list(monkeypatch):
    prompts = []

    async def reply(prompt, schema, **kwargs):
        prompts.append(prompt)
        return CareerPathwaysSection.model_validate(GENERATED)

    monkeypatch.setattr(industry, "ask_gpt_structured", reply)

    result = asyncio.run(industry.ai_generate_career_pathways({"program_name": "Bachelor of Arts"}))

    assert "do not name any course codes" in prompts[0]
    assert result["career_pathways"]["entry_level"]["roles"][0]["degree_courses"] == []

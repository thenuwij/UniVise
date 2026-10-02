"""Tests for the roadmap industry experience step.

The AI call and the link check are faked; these check the payload shape the
frontend reads, that placement and WIL courses come only from the program's
real course list, dead-link replacement and the fallback when generation fails.
"""
import asyncio

from app.models.roadmap import IndustryExperienceSection
from app.services.roadmap import industry

CONTEXT = {
    "program_name": "Bachelor of Commerce",
    "faculty": "UNSW Business School",
    "program_courses": [{"code": "COMM2233", "name": "Industry Consulting Project", "section": "Work Integrated Learning (WIL)", "section_rule": "Students must complete 6 UOC of the following courses."}],
}

LIVE_URL = "https://careers.example.com/interns"
DEAD_URL = "https://careers.example.com/missing"


def section(apply_urls):
    return {
        "industry_experience": {
            "mandatory_placements": {"required": False, "details": "No mandatory placements required.", "course_codes": []},
            "internship_programs": [
                {
                    "program_name": f"Summer Program {index}",
                    "company": "Example Co",
                    "duration": "10-12 weeks",
                    "timing": "Summer (Nov-Feb)",
                    "paid": True,
                    "application_period": "March-April",
                    "competitiveness": "Highly competitive",
                    "apply_url": url,
                }
                for index, url in enumerate(apply_urls)
            ],
            "career_fairs": "UNSW Careers Fair in Term 1.",
            "wil_opportunities": "COMM2233 Industry Consulting Project.",
            "wil_course_codes": ["COMM2233"],
        }
    }


def fake_reply(monkeypatch, payload):
    async def reply(prompt, schema, **kwargs):
        assert schema is IndustryExperienceSection
        return IndustryExperienceSection.model_validate(payload)

    async def url_is_live(url):
        return url == LIVE_URL

    monkeypatch.setattr(industry, "ask_claude_structured", reply)
    monkeypatch.setattr(industry, "validate_url", url_is_live)


def test_returns_industry_experience_as_plain_dict(monkeypatch):
    payload = section([LIVE_URL])
    fake_reply(monkeypatch, payload)

    result = asyncio.run(industry.ai_generate_industry_experience(CONTEXT))

    assert result == payload


def test_replaces_dead_apply_links_with_a_search(monkeypatch):
    fake_reply(monkeypatch, section([LIVE_URL, DEAD_URL]))

    result = asyncio.run(industry.ai_generate_industry_experience(CONTEXT))

    live, dead = result["industry_experience"]["internship_programs"]
    assert live["apply_url"] == LIVE_URL
    assert dead["apply_url"].startswith("https://www.google.com/search?q=")


def test_returns_fallback_when_generation_fails(monkeypatch):
    async def ai_down(*args, **kwargs):
        raise ValueError("Claude returned no structured output (stop_reason=max_tokens)")

    monkeypatch.setattr(industry, "ask_claude_structured", ai_down)

    result = asyncio.run(industry.ai_generate_industry_experience(CONTEXT))

    assert result["failed"] is True
    assert result["industry_experience"]["internship_programs"] == []


def test_keeps_only_placement_and_wil_courses_from_the_program(monkeypatch):
    payload = section([LIVE_URL])
    experience = payload["industry_experience"]
    experience["mandatory_placements"] = {
        "required": True,
        "details": "Complete ENGG4999 before graduating.",
        "course_codes": ["ENGG4999"],
    }
    experience["wil_course_codes"] = ["COMM2233", "WILX1234"]
    experience["wil_opportunities"] = "COMM2233 and WILX1234."
    fake_reply(monkeypatch, payload)

    result = asyncio.run(industry.ai_generate_industry_experience(CONTEXT))

    out = result["industry_experience"]
    assert out["mandatory_placements"]["course_codes"] == []
    assert out["mandatory_placements"]["details"] == "Complete (course not listed) before graduating."
    assert out["wil_course_codes"] == ["COMM2233"]
    assert out["wil_opportunities"] == "COMM2233 and (course not listed)."

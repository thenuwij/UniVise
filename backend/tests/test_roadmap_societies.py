"""Tests for the roadmap societies step.

Supabase and the AI call are faked; these check the payload shape the
frontend reads and the fallback when generation fails.
"""
import asyncio

import pytest

from app.models.roadmap import SocietiesSection
from app.services.roadmap import industry

CONTEXT = {"program_name": "Bachelor of Commerce", "faculty": "UNSW Business School"}

SECTION = {
    "societies": {
        "faculty_specific": [
            {
                "name": "Commerce Society (CommSoc)",
                "category": "Professional",
                "relevance": "Runs careers events for commerce students.",
                "key_activities": ["Networking nights", "Case competitions"],
                "membership_benefits": "Access to sponsor events.",
                "professional_affiliation": None,
            }
        ],
        "cross_faculty": [{"name": "Arc Volunteering", "why_join": "Builds leadership experience."}],
        "professional_development": {
            "student_chapters": ["CPA Australia"],
            "leadership_note": "Exec roles show initiative to employers.",
            "skills_gained": ["Leadership"],
        },
        "getting_started": {
            "join_timing": "O-Week",
            "how_to_find": "Arc website",
        },
    }
}


@pytest.fixture(autouse=True)
def fake_society_list(monkeypatch):
    rows = [{"name": "Commerce Society", "arc_category": "Faculty", "short_name": "CommSoc"}]
    monkeypatch.setattr(industry, "fetch_society_rows", lambda: rows)


def test_returns_societies_as_plain_dict(monkeypatch):
    async def reply(prompt, schema, **kwargs):
        assert schema is SocietiesSection
        assert "Commerce Society [Faculty] (CommSoc)" in prompt
        return SocietiesSection.model_validate(SECTION)

    monkeypatch.setattr(industry, "ask_claude_structured", reply)

    result = asyncio.run(industry.ai_generate_societies(CONTEXT))

    assert result == SECTION


def test_returns_fallback_when_generation_fails(monkeypatch):
    async def ai_down(*args, **kwargs):
        raise ValueError("Claude returned no structured output (stop_reason=max_tokens)")

    monkeypatch.setattr(industry, "ask_claude_structured", ai_down)

    result = asyncio.run(industry.ai_generate_societies(CONTEXT))

    assert result["failed"] is True
    assert result["societies"]["faculty_specific"] == []


def test_society_list_only_includes_degree_related_categories(monkeypatch):
    from types import SimpleNamespace

    from app.services.roadmap import unsw_queries

    rows = [
        {"name": "Commerce Society", "arc_category": "Faculty & Constituent", "short_name": "CommSoc"},
        {"name": "Climbing Club", "arc_category": "Sport & Recreation", "short_name": None},
    ]

    class Query:
        def __init__(self):
            self.rows = list(rows)

        def select(self, *args):
            return self

        def in_(self, column, values):
            self.rows = [r for r in self.rows if r[column] in values]
            return self

        def order(self, *args):
            return self

        def execute(self):
            return SimpleNamespace(data=self.rows)

    monkeypatch.setattr(unsw_queries, "supabase", SimpleNamespace(table=lambda name: Query()))

    assert [r["name"] for r in unsw_queries.fetch_society_rows()] == ["Commerce Society"]

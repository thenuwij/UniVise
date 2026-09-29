"""Tests for the roadmap overview and capstone generation step.

The AI call is faked; these check the payload shape the frontend reads and
that capstone courses are limited to courses in the student's program.
"""
import asyncio

from app.models.roadmap import ProgramCapstone, ProgramOverview
from app.services.roadmap import unsw

CONTEXT = {
    "program_name": "Computer Science",
    "uac_code": "429850",
    "core_courses": [{"code": "COMP1511"}, {"code": "COMP3900"}],
}


def fake_overview(monkeypatch, courses):
    async def reply(prompt, schema, **kwargs):
        assert schema is ProgramOverview
        return ProgramOverview(
            summary="A program in computing.",
            capstone=ProgramCapstone(courses=courses, highlights="Team capstone project."),
        )

    monkeypatch.setattr(unsw, "ask_gpt_structured", reply)


def test_returns_summary_and_capstone_as_plain_dict(monkeypatch):
    fake_overview(monkeypatch, ["COMP3900 Computer Science Project"])

    result = asyncio.run(unsw.ai_generate_general_info(CONTEXT))

    assert result == {
        "summary": "A program in computing.",
        "capstone": {
            "courses": ["COMP3900 Computer Science Project"],
            "highlights": "Team capstone project.",
        },
    }


def test_drops_capstone_courses_outside_the_program(monkeypatch):
    fake_overview(monkeypatch, ["COMP3900 Computer Science Project", "MATH9999 Invented Course"])

    result = asyncio.run(unsw.ai_generate_general_info(CONTEXT))

    assert result["capstone"]["courses"] == ["COMP3900 Computer Science Project"]


def test_explains_when_no_capstone_course_is_in_the_program(monkeypatch):
    fake_overview(monkeypatch, ["MATH9999 Invented Course"])

    result = asyncio.run(unsw.ai_generate_general_info(CONTEXT))

    assert result["capstone"]["courses"] == []
    assert "No dedicated capstone" in result["capstone"]["highlights"]

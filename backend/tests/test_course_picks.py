"""Tests for the "Recommended for you" course picks.

The AI call and the cache are faked; these check which courses count as
available next, that picks only name listed courses, and that a cached
answer is reused while the student's inputs are unchanged.
"""
import asyncio

from app.models.course_picks import CoursePick, CoursePicks
from app.services import course_picks


def edge(frm, to, logic="or", group=None, kind="prereq"):
    return {"from_key": frm, "to_key": to, "logic_type": logic, "group_id": group, "edge_type": kind}


EDGES = [
    edge("MATH1081", "COMP3121"),
    edge("COMP2521", "COMP3121", group="COMP3121_g1"),
    edge("COMP1521", "COMP3231", group="COMP3231_g1"),
    edge("COMP2121", "COMP3231", group="COMP3231_g1"),
    edge("COMP2521", "COMP3231", group="COMP3231_g2"),
    edge("COMP1531", "COMP3900", "and", "COMP3900_g1"),
    edge("COMP2521", "COMP3900", "and", "COMP3900_g1"),
    edge("COMP1511", "COMP1531", kind="coreq"),
]

INPUTS = {
    "degree_code": "3778",
    "program_name": "Bachelor of Computer Science",
    "specialisations": ["Artificial Intelligence"],
    "interests": ["AI"],
    "careers": ["Machine Learning Engineer"],
    "completed": ["COMP1511", "COMP2521"],
    "candidates": [
        {"code": "COMP3411", "name": "Artificial Intelligence", "section": "Major"},
        {"code": "COMP1531", "name": "Software Engineering Fundamentals", "section": "Core"},
    ],
}


def test_available_follows_prerequisite_groups():
    groups = course_picks.prereq_groups(EDGES)
    done = {"COMP2521", "COMP1521"}

    assert course_picks.is_available("COMP3231", done, groups)
    assert not course_picks.is_available("COMP3121", done, groups)
    assert not course_picks.is_available("COMP3900", done, groups)
    assert not course_picks.is_available("COMP2521", done, groups)
    assert course_picks.is_available("COMP1531", set(), groups)


def test_available_courses_put_specialisation_courses_first():
    courses = [
        {"code": "COMP1531", "name": "", "section": "Core"},
        {"code": "COMP3411", "name": "", "section": "Major"},
        {"code": "COMP3121", "name": "", "section": "Core"},
    ]
    result = course_picks.available_courses(courses, {"COMP2521"}, course_picks.prereq_groups(EDGES), {"COMP3411"})

    assert [c["code"] for c in result] == ["COMP3411", "COMP1531"]


def fake_cache(monkeypatch, stored=None):
    writes = []
    monkeypatch.setattr(course_picks, "read_cache", lambda user_id: stored)
    monkeypatch.setattr(course_picks, "write_cache", lambda *args: writes.append(args))
    return writes


def test_keeps_only_listed_courses(monkeypatch):
    writes = fake_cache(monkeypatch)

    async def reply(prompt, schema, **kwargs):
        assert "- COMP3411: Artificial Intelligence (Major)" in prompt
        return CoursePicks(picks=[
            CoursePick(code="FAKE9999", reason="Made up."),
            CoursePick(code="comp3411", reason="Builds on COMP2521 and leads to COMP9444 for ML roles."),
            CoursePick(code="COMP3411", reason="Duplicate."),
        ])

    monkeypatch.setattr(course_picks, "ask_gpt_structured", reply)

    result = asyncio.run(course_picks.get_course_picks("user-1", INPUTS))

    assert result["picks"] == [{
        "code": "COMP3411",
        "name": "Artificial Intelligence",
        "reason": "Builds on COMP2521 and leads to (course not listed) for ML roles.",
    }]
    assert len(writes) == 1


def test_reuses_cached_picks_while_inputs_are_unchanged(monkeypatch):
    cached = [{"code": "COMP3411", "name": "Artificial Intelligence", "reason": "Cached."}]
    fake_cache(monkeypatch, {"input_hash": course_picks.input_hash(INPUTS), "picks": cached})

    async def no_ai(*args, **kwargs):
        raise AssertionError("AI should not be called")

    monkeypatch.setattr(course_picks, "ask_gpt_structured", no_ai)

    result = asyncio.run(course_picks.get_course_picks("user-1", INPUTS))

    assert result["picks"] == cached


def test_regenerates_when_a_course_is_completed(monkeypatch):
    fake_cache(monkeypatch, {"input_hash": course_picks.input_hash(INPUTS), "picks": []})
    changed = {**INPUTS, "completed": INPUTS["completed"] + ["COMP1531"]}
    calls = []

    async def reply(prompt, schema, **kwargs):
        calls.append(prompt)
        return CoursePicks(picks=[])

    monkeypatch.setattr(course_picks, "ask_gpt_structured", reply)

    asyncio.run(course_picks.get_course_picks("user-1", changed))

    assert len(calls) == 1


def test_no_program_means_no_picks(monkeypatch):
    fake_cache(monkeypatch)

    result = asyncio.run(course_picks.get_course_picks("user-1", None))

    assert result == {"program_code": None, "picks": [], "failed": False}


def test_failed_generation_is_not_cached(monkeypatch):
    writes = fake_cache(monkeypatch)

    async def ai_down(*args, **kwargs):
        raise ValueError("timeout")

    monkeypatch.setattr(course_picks, "ask_gpt_structured", ai_down)

    result = asyncio.run(course_picks.get_course_picks("user-1", INPUTS))

    assert result["failed"] is True and result["picks"] == []
    assert writes == []

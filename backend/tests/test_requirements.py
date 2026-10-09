"""Tests for the degree progress Eunice gets in every chat.

Pure functions, no database: these check required, choice, elective and
open parts, and the totals line.
"""
from app.services.requirements import format_requirements, requirement_status

PROGRAM = [
    {"title": "Overview"},
    {"title": "Disciplinary Component", "kind": "info", "uoc": 168, "courses": []},
    {"title": "Industrial Training", "kind": "core", "uoc": 0, "courses": [{"code": "ENGG4999", "uoc": 0}]},
    {"title": "Free Electives", "kind": "free_elective", "uoc": 12, "courses": []},
    {"title": "Optional Minor", "kind": "specialisations", "uoc": 24, "courses": []},
]

MAJOR = [
    {"title": "One of the following:", "kind": "choice", "courses": [
        {"code": "MATH1131", "uoc": 6, "choice": "c1"},
        {"code": "MATH1141", "uoc": 6, "choice": "c1"},
    ]},
    {"title": "Level 3 Core Courses", "kind": "core", "courses": [
        {"code": "COMP3211", "uoc": 6}, {"code": "COMP3222", "uoc": 6}, {"code": "COMP3601", "uoc": 6},
    ]},
    {"title": "Discipline Electives", "kind": "elective", "uoc": 24, "courses": [
        {"code": "COMP3331", "uoc": 6}, {"code": "COMP3311", "uoc": 6}, {"code": "COMP4418", "uoc": 6},
    ]},
]

LISTS = [(None, PROGRAM), ("Computer Engineering", MAJOR)]


def statuses(completed, added=None):
    return requirement_status(LISTS, set(completed), set(added or []))


def by_name(parts, name):
    return next(p for p in parts if p["name"] == name)


def test_required_parts_split_done_and_left():
    part = by_name(statuses({"COMP3222"}), "Computer Engineering: Level 3 Core Courses")
    assert part["done"] == ["COMP3222"]
    assert part["left"] == ["COMP3211", "COMP3601"]


def test_choice_group_is_done_when_any_option_is_done():
    choice = next(p for p in statuses({"MATH1131"}) if p["type"] == "choice")
    assert choice["codes"] == ["MATH1131", "MATH1141"]
    assert choice["done"] == ["MATH1131"]


def test_electives_count_uoc_and_planned_courses():
    part = by_name(statuses({"COMP3331"}, {"COMP4418"}), "Computer Engineering: Discipline Electives")
    assert part["done_uoc"] == 6
    assert part["uoc"] == 24
    assert part["planned"] == ["COMP4418"]


def test_overview_and_info_sections_are_skipped():
    names = [p["name"] for p in statuses(set())]
    assert "Overview" not in names
    assert "Disciplinary Component" not in names


def test_summary_text_totals_and_lines():
    text = format_requirements(statuses({"ENGG4999", "COMP3222"}), 192, 12)
    assert "- UOC completed: 12 of 192 (180 UOC left to graduate, about 30 courses at 6 UOC each)" in text
    assert "- Required courses still to do: 3" in text
    assert "- Industrial Training: 1 of 1 done" in text
    assert "still to do: COMP3211, COMP3601" in text
    assert "- Computer Engineering: one of MATH1131 or MATH1141: not done yet" in text
    assert "- Computer Engineering: Discipline Electives: 0 of 24 UOC done, choosing from 3 listed courses" in text
    assert "- Optional Minor: 24 UOC, filled by choosing a minor or specialisation" in text
    assert "- Free Electives: 0 of 12 UOC done; the student hasn't placed any courses here in UniVise yet" in text


def test_placed_courses_count_towards_free_electives():
    placed = [
        {"code": "ARTS1000", "section": "Free Electives", "uoc": 6},
        {"code": "PSYC1001", "section": "Added courses", "uoc": 6},
        {"code": "COMP3311", "section": "Free Electives", "uoc": 6},
    ]
    parts = requirement_status(LISTS, {"ARTS1000"}, {"ARTS1000", "PSYC1001", "COMP3311"}, placed)
    free = by_name(parts, "Free Electives")

    assert free["done"] == ["ARTS1000"]
    assert free["planned"] == ["PSYC1001"]
    assert free["done_uoc"] == 6
    text = format_requirements(parts, 192, 6)
    assert "- Free Electives: 6 of 12 UOC done (ARTS1000); planned: PSYC1001" in text

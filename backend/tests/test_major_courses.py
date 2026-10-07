"""Tests for reading a major's courses for the AI prompts.

No database is touched; these check that level-based sections and prescribed
electives count, and that free electives and general education do not.
"""
import json

from app.services.roadmap.unsw_queries import extract_core_course_codes_from_sections

SECTIONS = [
    {"title": "Overview", "courses": []},
    {"title": "Level 1 Courses", "courses": [{"code": "COMP1511"}, {"code": "ELEC1111"}]},
    {"title": "Level 3 and 4 Prescribed Electives", "courses": [{"code": "COMP3211"}, {"code": "COMP1511"}]},
    {"title": "One of the following", "courses": [{"code": "MATH1131"}]},
    {"title": "Free Electives", "courses": [{"code": "ARTS1000"}]},
    {"title": "General Education", "courses": [{"code": "GENC1000"}]},
    {"title": "Flexible Electives", "courses": [{"code": "COMP9999"}]},
]


def test_reads_level_sections_and_prescribed_electives_once_each():
    assert extract_core_course_codes_from_sections(SECTIONS) == ["COMP1511", "ELEC1111", "COMP3211", "MATH1131"]


def test_reads_sections_stored_as_json_text():
    assert extract_core_course_codes_from_sections(json.dumps(SECTIONS[:2])) == ["COMP1511", "ELEC1111"]


def test_empty_or_broken_sections_give_no_courses():
    assert extract_core_course_codes_from_sections(None) == []
    assert extract_core_course_codes_from_sections("not json") == []

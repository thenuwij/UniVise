"""Tests for the display-data audit rules.

No database is touched; these check which values count as must-fix,
which are advisory, and that clean values pass.
"""
from scripts.display_data_audit import ADVISORY, MUST_FIX, duration_problems, section_problems, text_problems


def levels(problems):
    return {level for level, _ in problems}


def test_clean_text_passes():
    assert text_problems("Prerequisite: COMP1511") == []
    assert text_problems(None) == []


def test_placeholders_and_empty_text_must_be_fixed():
    assert levels(text_problems("Not specified")) == {MUST_FIX}
    assert levels(text_problems("  ")) == {MUST_FIX}


def test_broken_characters_and_html_must_be_fixed():
    assert levels(text_problems("Studentsâ€™ choice")) == {MUST_FIX}
    assert levels(text_problems("<p>Overview</p>")) == {MUST_FIX}
    assert levels(text_problems("Arts &amp; Social Sciences")) == {MUST_FIX}


def test_long_text_is_advisory():
    assert levels(text_problems("word " * 200)) == {ADVISORY}


def test_duration_rules():
    assert duration_problems("4 Year(s)", 4) == []
    assert duration_problems("1-3 Year(s)", None) == []
    assert duration_problems(None, None) == []
    assert levels(duration_problems("4 Year(s)", None)) == {MUST_FIX}


def test_section_rules():
    assert section_problems([{"title": "Core", "uoc": 48, "courses": [{"code": "COMP1511", "name": "Programming Fundamentals"}]}]) == []
    assert levels(section_problems([{"title": "Core", "uoc": "48"}])) == {MUST_FIX}
    assert levels(section_problems([{"title": "Core", "description": "Not specified"}])) == {MUST_FIX}
    assert levels(section_problems([{"title": "Core", "courses": [{"code": "COMP1511"}]}])) == {ADVISORY}

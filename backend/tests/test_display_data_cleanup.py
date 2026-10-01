"""Tests for the display-data clean-up rules.

No database is touched; these check how durations are read, which values
count as placeholders, and that only empty section descriptions are removed.
"""
import json

from scripts.display_data_cleanup import is_placeholder, parse_years, without_empty_section_text


def test_parse_years_reads_every_handbook_format():
    assert parse_years("4 Year(s)") == 4
    assert parse_years("1 Year(s)") == 1
    assert parse_years("5 years full-time") == 5
    assert parse_years("4 Years") == 4
    assert parse_years("6.7 Year(s)") == 6.7
    assert parse_years("5.7 years full-time") == 5.7


def test_parse_years_leaves_unreadable_values_alone():
    assert parse_years(None) is None
    assert parse_years("Varies") is None
    assert parse_years("1-3 Year(s)") is None


def test_placeholders():
    for value in ("Not specified", "not specified ", "N/A", "NA", "-", "TBC", "null"):
        assert is_placeholder(value)
    for value in ("Prerequisite: COMP1511", "Not specified elsewhere in the rules", None, ""):
        assert not is_placeholder(value)


def test_empty_notes_are_removed_too():
    cleaned, changed = without_empty_section_text([{"title": "Core", "notes": ""}])
    assert changed and cleaned == [{"title": "Core"}]


def test_only_empty_descriptions_are_removed():
    sections = [{"title": "Core", "description": ""}, {"title": "Electives", "description": "Choose 12 UOC"}]
    cleaned, changed = without_empty_section_text(sections)
    assert changed
    assert "description" not in cleaned[0]
    assert cleaned[1]["description"] == "Choose 12 UOC"


def test_sections_stored_as_text_stay_text():
    raw = json.dumps([{"title": "Core", "description": "  "}])
    cleaned, changed = without_empty_section_text(raw)
    assert changed and isinstance(cleaned, str)
    assert json.loads(cleaned) == [{"title": "Core"}]


def test_null_descriptions_are_left_alone():
    sections = [{"title": "Core", "description": None}]
    assert without_empty_section_text(sections) == (sections, False)


def test_no_change_reports_unchanged():
    sections = [{"title": "Core", "description": "Complete all"}]
    assert without_empty_section_text(sections) == (sections, False)

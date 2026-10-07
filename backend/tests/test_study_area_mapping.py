"""Tests for matching programs and majors to QILT study areas.

No database or AI is touched; these check the name rules, how double degrees
are recognised and split, and that a reviewed file only accepts real areas.
"""
import pytest

from scripts.study_area_mapping import STUDY_AREAS, RULES, is_double_degree, propose_from_halves, read_mapping, rule_area


def test_every_rule_points_at_a_real_study_area():
    assert len(STUDY_AREAS) == 21
    assert all(area in STUDY_AREAS for _, area, _ in RULES)


def test_rules_pick_the_expected_area():
    assert rule_area("Bachelor of Engineering (Honours)") == ("Engineering", False)
    assert rule_area("Civil Engineering") == ("Engineering", False)
    assert rule_area("Psychology") == ("Psychology", False)
    assert rule_area("Bachelor of Social Sciences") == ("Humanities, culture and social sciences", False)
    assert rule_area("Bachelor of Construction Management and Property") == ("Architecture and built environment", False)
    assert rule_area("Physics") == ("Science and mathematics", False)
    assert rule_area("Bachelor of Media") == ("Communications", True)


def test_unknown_names_are_left_for_review():
    assert rule_area("Aviation") == (None, True)


def test_double_degrees_are_recognised():
    assert is_double_degree("Bachelor of Fine Arts/Bachelor of Media")
    assert is_double_degree("Bachelor of Commerce and Bachelor of Actuarial Studies")
    assert not is_double_degree("Bachelor of Commerce")


def test_double_degree_takes_both_halves():
    singles = {
        "commerce": {"areas": ["Business and management"], "check": False},
        "laws": {"areas": ["Law and paralegal studies"], "check": False},
    }
    proposals, leftover = propose_from_halves([{"degree_code": "4733", "program_name": "Bachelor of Commerce / Bachelor of Laws"}], singles)
    assert leftover == []
    assert proposals[0]["areas"] == ["Business and management", "Law and paralegal studies"]
    assert proposals[0]["how"] == "halves"


def test_reviewed_file_rejects_unknown_areas(tmp_path):
    path = tmp_path / "mapping.csv"
    path.write_text("type,code,name,faculty,areas,how,check\nprogram,3707,Engineering,,Engineering,rule,\nmajor,PSYCA1,Psychology,,Psychology,rule,\n")
    assert read_mapping(path) == ([{"degree_code": "3707", "study_area": "Engineering"}], [{"major_code": "PSYCA1", "study_area": "Psychology"}])
    path.write_text("type,code,name,faculty,areas,how,check\nprogram,3707,Engineering,,Rocket science,rule,\n")
    with pytest.raises(ValueError):
        read_mapping(path)


def test_committed_study_area_file_covers_every_program_and_major():
    program_rows, major_rows = read_mapping("data/career/study_areas.csv")
    assert len({row["degree_code"] for row in program_rows}) == 192
    assert len({row["major_code"] for row in major_rows}) == 195

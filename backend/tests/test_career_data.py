"""Tests for choosing a roadmap's study areas.

No database is touched; these check that a chosen major refines a single
degree, and that a double degree keeps both of its areas.
"""
from app.services.roadmap.career_data import choose_study_areas


def test_major_refines_a_single_degree():
    assert choose_study_areas(["Science and mathematics"], ["Psychology"]) == ["Psychology"]


def test_single_degree_without_a_major_uses_the_program_area():
    assert choose_study_areas(["Engineering"], []) == ["Engineering"]


def test_double_degree_keeps_both_areas_and_adds_the_major():
    assert choose_study_areas(["Business and management", "Law and paralegal studies"], ["Business and management"]) == [
        "Business and management",
        "Law and paralegal studies",
    ]

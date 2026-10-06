"""Tests for choosing a roadmap's study areas.

No database is touched; these check that a chosen major refines a single
degree, that a double degree keeps both of its areas, and how an occupation's
official figures are passed to the role cards.
"""
from app.services.roadmap.career_data import choose_study_areas, occupation_for_role


def test_major_refines_a_single_degree():
    assert choose_study_areas(["Science and mathematics"], ["Psychology"]) == ["Psychology"]


def test_single_degree_without_a_major_uses_the_program_area():
    assert choose_study_areas(["Engineering"], []) == ["Engineering"]


def test_double_degree_keeps_both_areas_and_adds_the_major():
    assert choose_study_areas(["Business and management", "Law and paralegal studies"], ["Business and management"]) == [
        "Business and management",
        "Law and paralegal studies",
    ]


def test_only_a_shortage_rating_counts_as_in_demand():
    row = {"anzsco_code": "2332", "title": "Civil Engineering Professionals", "median_weekly_earnings": 2217, "shortage_nsw": "S", "data_period": "May 2025", "source": "JSA", "source_url": "https://www.jobsandskills.gov.au"}

    assert occupation_for_role(row)["in_demand_nsw"] is True
    assert occupation_for_role(row)["weekly_earnings"] == 2217
    assert occupation_for_role({**row, "shortage_nsw": "R"})["in_demand_nsw"] is False
    assert occupation_for_role({**row, "shortage_nsw": None})["in_demand_nsw"] is False

"""Tests for the career figures import.

No database is touched; these check that each source row is validated and
stored with its source, and that the committed Jobs and Skills Australia file
loads cleanly.
"""
import pytest

from scripts.career_data_import import JSA_PATH, diff, jsa_record, qilt_record, read_csv

QILT_ROW = {
    "study_area": "Engineering",
    "full_time_employment_rate": "83.4",
    "overall_employment_rate": "90.1",
    "labour_force_participation_rate": "92.8",
    "median_salary": "82500",
    "further_study_rate": "12.7",
    "professional_occupation_rate": "84.6",
}
JSA_ROW = {
    "anzsco_code": "2332",
    "title": "Civil Engineering Professionals",
    "skill_level": "1",
    "employed": "76800",
    "median_weekly_earnings": "2217",
    "annual_employment_growth": "1700",
    "shortage_national": "S",
    "shortage_nsw": "S",
}


def test_qilt_row_keeps_figures_and_source():
    record = qilt_record(QILT_ROW)
    assert record["full_time_employment_rate"] == 83.4
    assert record["median_salary"] == 82500
    assert record["survey_year"] == 2025
    assert record["source"].startswith("QILT Graduate Outcomes Survey 2025")


def test_qilt_rejects_a_rate_that_is_not_a_percentage():
    with pytest.raises(ValueError):
        qilt_record({**QILT_ROW, "full_time_employment_rate": "834"})


def test_jsa_row_keeps_missing_earnings_empty():
    record = jsa_record({**JSA_ROW, "median_weekly_earnings": ""})
    assert record["median_weekly_earnings"] is None
    assert record["employed"] == 76800
    assert record["source"].startswith("Jobs and Skills Australia")


def test_jsa_rejects_bad_codes_and_ratings():
    with pytest.raises(ValueError):
        jsa_record({**JSA_ROW, "anzsco_code": "233211"})
    with pytest.raises(ValueError):
        jsa_record({**JSA_ROW, "shortage_nsw": "Shortage"})


def test_committed_jsa_file_loads():
    records = [jsa_record(row) for row in read_csv(JSA_PATH)]
    assert len(records) == 119
    assert len({record["anzsco_code"] for record in records}) == 119
    assert all(record["skill_level"] == 1 for record in records)


def test_diff_reports_new_changed_and_same_rows():
    record = qilt_record(QILT_ROW)
    assert diff(record, None) == ("add", "")
    assert diff(record, dict(record)) == ("same", "")
    assert diff(record, {**record, "median_salary": 80000}) == ("change", "median_salary")

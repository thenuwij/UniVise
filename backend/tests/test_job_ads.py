"""Tests for turning a role title into job ad search words."""
from app.services.roadmap.job_ads import ad_search_words, is_early_career


def test_search_words_drop_level_words_and_keep_two():
    assert ad_search_words("Graduate Software Engineer") == "software engineer"
    assert ad_search_words("Junior Data Analyst (Entry Level)") == "data analyst"
    assert ad_search_words("Paralegal") == "paralegal"
    assert ad_search_words("Graduate Environmental Consultant, Water Resources") == "environmental consultant"
    assert ad_search_words("Graduate") == ""


def test_early_career_titles():
    assert is_early_career("Junior Paralegal")
    assert is_early_career("2027 Graduate Program - Policy")
    assert not is_early_career("Senior Paralegal")

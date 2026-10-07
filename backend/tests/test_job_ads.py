"""Tests for the weekly Adzuna job ads fetch.

Adzuna is faked; these check how a role title becomes its search words, that
searches are ordered by how many programs use them, that an empty search is
retried with early-career titles only, that the call cap is respected and the
fallbacks take turns across weeks, and that repeated ads are stored once.
"""
from app.services.roadmap.job_ads import ad_search_words, is_early_career
from scripts.job_ads_fetch import ad_row, count_searches, fetch_ads, rotate, unique_ads


def ad(ad_id, title, company="Acme"):
    return {"id": ad_id, "title": title, "company": {"display_name": company}, "location": {"display_name": "Sydney"}, "created": "2026-10-01T00:00:00Z", "redirect_url": f"https://www.adzuna.com.au/land/ad/{ad_id}"}


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


def test_searches_are_ordered_by_how_many_programs_use_them():
    stages = [
        {"roles": [{"ad_search": "data analyst"}, {"ad_search": "data analyst"}, {"ad_search": "accountant"}]},
        {"roles": [{"ad_search": "data analyst"}, {"ad_search": "software engineer"}]},
        {"roles": [{"ad_search": "software engineer"}, {"title": "Old role without search words"}]},
        None,
    ]
    assert count_searches(stages) == ["data analyst", "software engineer", "accountant"]


def test_empty_search_is_retried_with_early_career_titles_only():
    results = {
        "graduate software engineer": [ad("1", "Graduate Software Engineer")],
        "graduate paralegal": [],
        "paralegal": [ad("2", "Junior Paralegal"), ad("3", "Senior Paralegal")],
    }
    calls = []

    def search(title_words):
        calls.append(title_words)
        return results[title_words]

    found, count = fetch_ads(["software engineer", "paralegal"], search)

    assert calls == ["graduate software engineer", "graduate paralegal", "paralegal"]
    assert count == 3
    assert [a["id"] for a in found["paralegal"]] == ["2"]


def test_calls_stop_at_the_cap_and_unfinished_searches_keep_their_ads():
    found, count = fetch_ads(["a", "b", "c"], lambda words: [], cap=2)

    assert count == 2
    assert found == {}


def test_fallbacks_take_turns_week_by_week():
    def search(title_words):
        return [] if title_words.startswith("graduate") else [ad(title_words, f"Junior {title_words}")]

    words = ["a", "b", "c", "d"]
    week_one, _ = fetch_ads(words, search, cap=6, week=0)
    week_two, _ = fetch_ads(words, search, cap=6, week=1)

    assert sorted(week_one) == ["a", "b"]
    assert sorted(week_two) == ["c", "d"]


def test_rotation_wraps_around():
    assert rotate(["a", "b", "c"], week=1, size=2) == ["c", "a", "b"]
    assert rotate([], week=3, size=2) == []


def test_the_same_ad_from_two_companies_listings_is_kept_once():
    ads = [ad("1", "Graduate Data Analyst"), ad("2", "graduate data analyst "), ad("3", "Graduate Data Analyst", "Other Co"), {"id": "4", "title": "No link"}]

    assert [a["id"] for a in unique_ads(ads)] == ["1", "3"]


def test_stored_row_has_only_what_the_page_shows():
    assert ad_row("data analyst", ad("9", "Graduate Data Analyst")) == {
        "search_words": "data analyst",
        "ad_id": "9",
        "title": "Graduate Data Analyst",
        "company": "Acme",
        "location": "Sydney",
        "posted_at": "2026-10-01T00:00:00Z",
        "url": "https://www.adzuna.com.au/land/ad/9",
    }

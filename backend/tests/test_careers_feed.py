from datetime import date, datetime, timedelta, timezone

from app.services.careers.adzuna import broad_searches, listing, role_searches, unique
from app.services.careers.event_checks import event_date, is_list_page, merge_events
from app.services.careers import feed
from app.services.careers.feed import degree_key, source_state
import asyncio
import json

import pytest


from app.services.careers import job_titles, refresh, top_picks
from app.services.careers.search_words import is_early_career
from app.services.careers.web_search import keep_listing, page_key

TODAY = date(2026, 10, 21)


def ago(**delta) -> str:
    return (datetime.now(timezone.utc) - timedelta(**delta)).isoformat()


def test_degree_key_sorts_specialisations():
    roadmap = {"degree_code": "3707", "payload": {"specialisation_ids": ["b", "a"]}}
    assert degree_key(roadmap) == "3707|a,b"
    assert degree_key({"degree_code": "3778", "payload": {}}) == "3778|"


def test_never_refreshed_source_is_stale():
    state = source_state("adzuna", None, TODAY)
    assert state["status"] == "never" and state["stale"]


def test_refreshed_today_is_fresh_and_yesterday_is_stale():
    row = {"status": "idle", "refresh_day": "2026-10-21", "refreshed_at": ago(hours=2), "items": [{"id": "1"}]}
    assert source_state("adzuna", row, TODAY) == {
        "source": "adzuna", "status": "done", "stale": False, "refreshed_at": row["refreshed_at"], "items": [{"id": "1"}],
    }
    assert source_state("adzuna", {**row, "refresh_day": "2026-10-20"}, TODAY)["stale"]


def test_top_picks_only_go_stale_when_never_made(monkeypatch):
    monkeypatch.setattr(feed, "TOP_PICKS_ENABLED", True)
    made = {"status": "idle", "refresh_day": "2026-09-01", "refreshed_at": ago(days=50), "items": []}
    assert source_state("ai_jobs", made, TODAY)["stale"] is False
    assert source_state("ai_internships", None, TODAY)["stale"] is True


def test_paused_top_picks_show_nothing_and_never_search(monkeypatch):
    monkeypatch.setattr(feed, "TOP_PICKS_ENABLED", False)
    made = {"status": "idle", "refresh_day": "2026-10-21", "refreshed_at": ago(hours=1), "items": [{"id": "1"}]}
    assert source_state("ai_jobs", made, TODAY) == {
        "source": "ai_jobs", "status": "never", "stale": False, "refreshed_at": None, "items": [],
    }

    async def no_search(*args, **kwargs):
        raise AssertionError("paused top picks must not search")

    monkeypatch.setattr(refresh, "fetch_top_picks", no_search)
    monkeypatch.setattr(refresh, "read_feed", lambda key: {})
    roadmap = {"degree_code": "3707", "payload": {"career_pathways": {"entry_level": {"roles": [{"title": "x"}]}}}}
    for source in ("ai_jobs", "ai_internships"):
        assert asyncio.run(refresh.refresh_source(roadmap, source, manual=True))["status"] == "never"
        assert asyncio.run(refresh.force_refresh(roadmap, source))["status"] == "never"


def test_running_refresh_blocks_another_until_it_times_out():
    running = {"status": "running", "claimed_at": ago(minutes=1), "refresh_day": None, "refreshed_at": None}
    assert source_state("adzuna", running, TODAY)["stale"] is False
    stuck = {**running, "claimed_at": ago(minutes=10)}
    assert source_state("adzuna", stuck, TODAY)["stale"] is True


def test_failed_refresh_waits_five_minutes_before_retrying():
    failed = {"status": "failed", "failed_at": ago(minutes=2), "refresh_day": "2026-10-20", "refreshed_at": ago(days=1)}
    state = source_state("ai_networking", failed, TODAY)
    assert state["status"] == "failed" and not state["stale"]
    assert source_state("ai_networking", {**failed, "failed_at": ago(minutes=10)}, TODAY)["stale"]


def test_web_event_must_be_a_searched_page_and_not_a_search_page():
    event = "https://www.meetup.com/en-au/physical-ai-sydney/events/316992198/?eventOrigin=group"
    searched = {page_key(event), page_key("https://www.seek.com.au/software-engineer-jobs")}
    assert keep_listing(event, searched)
    assert keep_listing("https://meetup.com/en-au/physical-ai-sydney/events/316992198", searched)
    assert not keep_listing("https://www.meetup.com/en-au/physical-ai-sydney/events/999", searched)
    assert not keep_listing("https://www.seek.com.au/software-engineer-jobs", searched)
    assert not keep_listing("mailto:events@example.com", searched)


def test_role_searches_dedupe_and_cap():
    roles = [{"ad_search": "network engineer"}, {"ad_search": "network engineer"}, {"ad_search": ""}] + [
        {"ad_search": f"role {i}"} for i in range(6)
    ]
    assert role_searches(roles) == ["network engineer", "role 0", "role 1", "role 2"]


def test_adzuna_listing_marks_internships():
    ad = {"id": 7, "title": "Summer Vacation Program - Engineering", "company": {"display_name": "Telstra"}, "redirect_url": "https://x"}
    item = listing(ad, "internship")
    assert item["kind"] == "internship" and item["organisation"] == "Telstra" and item["id"] == "adzuna-7"
    assert listing({**ad, "title": "Graduate Network Engineer"}, "network engineer")["kind"] == "job"


def test_event_date_rolls_into_next_year():
    assert event_date("Thu 6 Nov, 6pm", TODAY) == date(2026, 11, 6)
    assert event_date("Sat 14 Feb", TODAY) == date(2027, 2, 14)
    assert event_date("Date to be announced", TODAY) is None


def test_explicit_event_year_and_stored_date_do_not_roll_forward():
    from app.services.careers.event_checks import upcoming

    assert event_date("6 November 2025", TODAY) == date(2025, 11, 6)
    assert not upcoming({"date_label": "6 Nov", "event_date": "2025-11-06"}, TODAY)


def test_checked_events_keep_an_absolute_date_for_saved_items(monkeypatch):
    from app.services.careers import event_checks

    async def live(*args):
        return True

    monkeypatch.setattr(event_checks, "page_is_live", live)
    result = asyncio.run(event_checks.check_events([
        {"url": "https://events.humanitix.com/test", "date_label": "6 Nov, 6pm", "kind": "event"},
    ], TODAY))
    assert result[0]["event_date"] == "2026-11-06"


def test_merge_events_keeps_upcoming_events_and_calendars_and_drops_past_ones():
    fresh = [{"url": "https://www.meetup.com/a/events/1", "date_label": "Thu 12 Nov, 6pm", "kind": "event"}]
    previous = [
        {"url": "https://meetup.com/a/events/1/", "date_label": "Thu 12 Nov, 6pm", "kind": "event"},
        {"url": "https://events.humanitix.com/b", "date_label": "Wed 5 Nov, 5pm", "kind": "event"},
        {"url": "https://events.humanitix.com/old", "date_label": "Mon 20 Oct, 5pm", "kind": "event"},
        {"url": "https://www.unsw.edu.au/engineering/news-events/events", "date_label": "Tue 10 Nov", "kind": "event", "title": "UNSW Engineering Events"},
    ]
    merged = merge_events(fresh, previous, TODAY)
    assert [item["url"] for item in merged] == [
        "https://events.humanitix.com/b",
        "https://www.meetup.com/a/events/1",
        "https://www.unsw.edu.au/engineering/news-events/events",
    ]
    assert merged[-1]["kind"] == "calendar" and merged[-1]["date_label"] == ""


def test_list_pages_are_not_single_events():
    assert is_list_page("https://www.engineersaustralia.org.au/learning-and-events/events-webinars-and-courses")
    assert is_list_page("https://www.unsw.edu.au/engineering/news-events/events")
    assert is_list_page("https://www.engineersaustralia.org.au/learning-and-events/events-webinars-and-courses?event%5B0%5D=event_topic%3A1541")
    assert not is_list_page("https://www.meetup.com/en-au/ac-syd/events/pclnrtyjcpbgb/?eventOrigin=group_upcoming_events")
    assert not is_list_page("https://www.events.unsw.edu.au/event/impact-x-showcase-2026")


def test_refresh_waits_until_the_plan_has_career_roles(monkeypatch):
    claims = []
    monkeypatch.setattr(refresh, "read_feed", lambda key: {})
    monkeypatch.setattr(refresh, "claim_refresh", lambda *args: claims.append(args) or True)
    roadmap = {"degree_code": "3707", "payload": {"specialisation_ids": []}}
    state = asyncio.run(refresh.refresh_source(roadmap, "adzuna"))
    assert claims == [] and state["status"] == "never"


def test_early_career_titles_leave_out_senior_roles():
    assert is_early_career("Junior Mechanical Engineer")
    assert is_early_career("Associate Mechanical Engineer")
    assert not is_early_career("Senior Graduate Program Manager")
    assert not is_early_career("Mechanical Engineer")


def ad(title, organisation, kind="internship"):
    return {"title": title, "organisation": organisation, "kind": kind}


def test_unique_merges_company_names_blocks_listed_employers_and_caps_each_employer():
    listings = [
        ad("2027 Undergraduate Engineering Internship", "Cummins"),
        ad("2027 Undergraduate Engineering Internship", "Cummins Inc."),
        ad("Mechanical Engineering Intern", "Study and Work Group"),
    ] + [ad(f"Summer Intern {i}", "Bechtel Corporation") for i in range(5)]
    titles = [item["title"] for item in unique(listings)]
    assert titles.count("2027 Undergraduate Engineering Internship") == 1
    assert "Mechanical Engineering Intern" not in titles
    assert sum(title.startswith("Summer Intern") for title in titles) == 3


def test_broad_searches_use_the_type_of_role_not_the_field():
    assert broad_searches(["aerospace engineer", "systems engineer", "data analyst"]) == ["graduate engineer", "graduate analyst"]
    assert broad_searches(["supply chain"]) == []


def test_research_roles_are_not_early_career():
    assert not is_early_career("Research Associate - School of Civil Engineering")


def test_job_searches_put_common_titles_before_plan_roles(monkeypatch):
    async def suggest(*args, **kwargs):
        return job_titles.JobTitles(titles=["Software Engineer", "Embedded Engineer", "Hardware Engineer", "Extra Engineer"])
    monkeypatch.setattr(job_titles, "ask_gpt_structured", suggest)
    plan = [{"title": "Graduate ICT Support Engineer", "ad_search": "ict support"}]
    roles = asyncio.run(job_titles.job_search_roles("Computer Engineering", plan))
    assert role_searches(roles) == ["software engineer", "embedded engineer", "hardware engineer", "ict support"]


def test_job_searches_keep_plan_roles_when_suggestions_fail(monkeypatch):
    async def fail(*args, **kwargs):
        raise ValueError("down")
    monkeypatch.setattr(job_titles, "ask_gpt_structured", fail)
    plan = [{"title": "Graduate ICT Support Engineer", "ad_search": "ict support"}]
    assert asyncio.run(job_titles.job_search_roles("Computer Engineering", plan)) == plan


def search_again_setup(monkeypatch, claimed):
    runs = []
    async def run(*args):
        runs.append(args)
    monkeypatch.setattr(refresh, "read_feed", lambda key: {"adzuna": {"status": "idle", "items": []}})
    monkeypatch.setattr(refresh, "claim_search_again", lambda key, source: claimed)
    monkeypatch.setattr(refresh, "run_refresh", run)
    return runs, {"degree_code": "3707", "payload": {"career_pathways": {"entry_level": {"roles": [{"ad_search": "software engineer"}]}}}}


def test_search_again_runs_when_the_cooldown_has_passed(monkeypatch):
    runs, roadmap = search_again_setup(monkeypatch, True)
    asyncio.run(refresh.refresh_source(roadmap, "adzuna", manual=True))
    assert len(runs) == 1


def test_search_again_does_nothing_during_the_cooldown(monkeypatch):
    runs, roadmap = search_again_setup(monkeypatch, False)
    asyncio.run(refresh.refresh_source(roadmap, "adzuna", manual=True))
    assert runs == []


def test_top_picks_use_web_search_and_keep_only_pages_it_found(monkeypatch):
    found = {"title": "Graduate Civil Engineer", "organisation": "Arup", "location": "Sydney", "url": "https://arup.com/jobs/1", "source_site": "Arup", "date_label": ""}
    made_up = {**found, "title": "Made Up Job", "url": "https://fake.example/1"}
    async def web(*args, **kwargs):
        return f"Here you go: {json.dumps([found, made_up])}", ["https://arup.com/jobs/1"]
    async def live(client, url):
        return True
    monkeypatch.setattr(top_picks, "ask_claude_web_search", web)
    monkeypatch.setattr(top_picks, "page_is_live", live)
    picks = asyncio.run(top_picks.fetch_top_picks("ai_jobs", "Civil Engineering", [], date(2026, 11, 2)))
    assert [p["title"] for p in picks] == ["Graduate Civil Engineer"]
    assert picks[0]["kind"] == "job"


def test_top_picks_drop_dead_links(monkeypatch):
    found = {"title": "Closed Job", "organisation": "Arup", "url": "https://arup.com/jobs/1"}
    async def web(*args, **kwargs):
        return json.dumps([found]), ["https://arup.com/jobs/1"]
    async def dead(client, url):
        return False
    monkeypatch.setattr(top_picks, "ask_claude_web_search", web)
    monkeypatch.setattr(top_picks, "page_is_live", dead)
    with pytest.raises(ValueError):
        asyncio.run(top_picks.fetch_top_picks("ai_jobs", "Civil Engineering", [], date(2026, 11, 2)))


def test_top_picks_fail_when_the_web_search_finds_nothing(monkeypatch):
    async def web(*args, **kwargs):
        return "[]", []
    monkeypatch.setattr(top_picks, "ask_claude_web_search", web)
    with pytest.raises(ValueError):
        asyncio.run(top_picks.fetch_top_picks("ai_jobs", "Civil Engineering", [], date(2026, 11, 2)))



def test_job_board_list_pages_are_not_treated_as_single_jobs():
    for url in ["https://au.indeed.com/q-mechanical-graduate-jobs.html", "https://au.indeed.com/Mechanical-Product-jobs-in-Brisbane-QLD"]:
        assert not keep_listing(url, {page_key(url)})

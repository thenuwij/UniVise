from datetime import date, datetime, timedelta, timezone

from app.services.careers.adzuna import listing, role_searches
from app.services.careers.event_checks import event_date, is_list_page, merge_events
from app.services.careers.feed import degree_key, source_state
import asyncio

from app.services.careers import top_picks
from app.services.careers.top_picks import backup_cards, field_slug, listing_pages, parse_cards, parse_picks
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


def test_top_picks_only_go_stale_when_never_made():
    made = {"status": "idle", "refresh_day": "2026-09-01", "refreshed_at": ago(days=50), "items": []}
    assert source_state("ai_jobs", made, TODAY)["stale"] is False
    assert source_state("ai_internships", None, TODAY)["stale"] is True


def test_running_refresh_blocks_another_until_it_times_out():
    running = {"status": "running", "claimed_at": ago(minutes=1), "refresh_day": None, "refreshed_at": None}
    assert source_state("adzuna", running, TODAY)["stale"] is False
    stuck = {**running, "claimed_at": ago(minutes=10)}
    assert source_state("adzuna", stuck, TODAY)["stale"] is True


def test_failed_refresh_waits_an_hour_before_retrying():
    failed = {"status": "failed", "failed_at": ago(minutes=20), "refresh_day": "2026-10-20", "refreshed_at": ago(days=1)}
    state = source_state("ai_networking", failed, TODAY)
    assert state["status"] == "failed" and not state["stale"]
    assert source_state("ai_networking", {**failed, "failed_at": ago(hours=2)}, TODAY)["stale"]


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


def test_top_pick_pages_use_seek_for_each_role_and_the_field():
    roles = [{"ad_search": "ict support"}, {"ad_search": "network engineer"}, {"ad_search": "electronics engineer"}]
    degree = "Computer Engineering"
    assert field_slug(degree) == "computer-engineering"
    assert field_slug("Bachelor of Science (Computer Science) / Bachelor of Arts") == "computer-science"
    assert field_slug("Computer Science (Artificial Intelligence)") == "computer-science"
    assert field_slug("Bachelor of Medical Studies - BMed Doctor of Medicine - MD") == "medical-studies"
    assert field_slug("Bachelor of Social Work (Honours) - BSW (Hons)") == "social-work"
    assert field_slug("Bachelor of Engineering (Honours)") == "engineering"
    assert listing_pages("ai_jobs", degree, roles) == [
        "https://www.seek.com.au/graduate-ict-support-jobs/in-All-Sydney-NSW",
        "https://www.seek.com.au/graduate-network-engineer-jobs/in-All-Sydney-NSW",
        "https://www.seek.com.au/graduate-electronics-engineer-jobs/in-All-Sydney-NSW",
    ]
    assert listing_pages("ai_internships", degree, roles)[0] == "https://www.seek.com.au/computer-engineering-internship-jobs/in-All-Sydney-NSW"
    pages = listing_pages("ai_jobs", degree, roles)
    cards = parse_cards(
        "1 | IT Intern | Bromic | Sydney NSW | 7d ago | /job/95249181?type=standard\n"
        "2 | IT Intern | Bromic | Sydney NSW | 7d ago | /job/95249181\n"
        "Here are the cards:\n"
        "3 | Graduate Electronics Engineer | Vertiv | Sydney | - | https://www.seek.com.au/job/95111111",
        pages,
    )
    assert [c["url"] for c in cards] == ["https://www.seek.com.au/job/95249181?type=standard", "https://www.seek.com.au/job/95111111"]
    assert cards[1]["date_label"] == "" and cards[0]["source_site"] == "SEEK"
    assert parse_picks("Picks: [1, 0, 1, 7]", 2) == [1, 0]


def test_backup_cards_add_adzuna_listings_without_duplicates():
    cards = [{"title": "Graduate Engineer", "organisation": "Arup", "location": "Sydney", "date_label": "", "url": "https://www.seek.com.au/job/1", "source_site": "SEEK"}]
    backup = [
        {"title": "graduate engineer", "organisation": "ARUP", "url": "https://adzuna.com.au/1"},
        {"title": "Site Engineer", "organisation": "Lendlease", "location": "Sydney", "url": "https://adzuna.com.au/2", "source_site": "Adzuna"},
        {"title": "No link", "organisation": "X"},
    ]
    merged = backup_cards(cards, backup)
    assert [c["title"] for c in merged] == ["Graduate Engineer", "Site Engineer"]
    assert merged[1]["source_site"] == "Adzuna"


def test_top_picks_fall_back_to_adzuna_when_job_sites_block(monkeypatch):
    async def blocked(prompt, page_count, model):
        return "All pages failed to load."

    async def judge(prompt, model):
        return "[0]"

    monkeypatch.setattr(top_picks, "read_web_pages", blocked)
    monkeypatch.setattr(top_picks, "ask_claude_text", judge)
    roles = [{"title": "Civil Engineer", "ad_search": "civil engineer"}]
    backup = [{"title": "Graduate Civil Engineer", "organisation": "Aurecon", "location": "Sydney", "url": "https://adzuna.com.au/9"}]
    picks = asyncio.run(top_picks.fetch_top_picks("ai_jobs", "Civil Engineering", "Civil Engineering", roles, date(2026, 10, 22), backup))
    assert [p["title"] for p in picks] == ["Graduate Civil Engineer"]
    assert picks[0]["source_site"] == "Adzuna" and picks[0]["kind"] == "job"


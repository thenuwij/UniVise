"""Tests for the internship opening-time search.

The search call is faked; these check that an opening time only counts when
its page was among the search results and is on the company's own website.
"""
import asyncio

from app.services.roadmap import internship_timing
from app.services.roadmap.internship_timing import ProgramTiming, ProgramTimings, apply_timings, page_is_company

DELOITTE = "https://www.deloitte.com/au/en/careers/students/vacationers.html"


def test_page_must_be_on_the_company_site():
    assert page_is_company(DELOITTE, "Deloitte Australia")
    assert page_is_company("https://www.commbank.com.au/about-us/careers/graduate.html", "Commonwealth Bank")
    assert not page_is_company("https://au.gradconnection.com/employers/deloitte/", "KPMG Australia")
    assert not page_is_company("https://www.example.com/jobs", "Pty Ltd")


def test_only_company_pages_from_the_search_count(monkeypatch):
    async def fake_search(prompt, schema, allowed_domains, **kwargs):
        assert allowed_domains is None
        assert kwargs["search_context_size"] == "low"
        reply = ProgramTimings(programs=[
            ProgramTiming(company="Deloitte Australia", program_name="Vacationer Program", usually_opens="February to March", source_url=DELOITTE),
            ProgramTiming(company="KPMG Australia", program_name="Vacation Program", usually_opens="March", source_url="https://au.gradconnection.com/employers/kpmg/"),
            ProgramTiming(company="EY", program_name="Summer Program", usually_opens="", source_url=""),
        ])
        return reply, [DELOITTE, "https://au.gradconnection.com/employers/kpmg/"]

    monkeypatch.setattr(internship_timing, "ask_gpt_web_search", fake_search)

    programs = [
        {"company": "Deloitte Australia", "program_name": "Vacationer Program", "application_period": "March-April"},
        {"company": "KPMG Australia", "program_name": "Vacation Program", "application_period": "July"},
    ]
    found = asyncio.run(internship_timing.search_program_timings(programs))
    apply_timings(programs, found)

    assert programs[0]["application_period"] == "February to March"
    assert programs[0]["application_period_source"] == DELOITTE
    assert programs[1]["application_period"] == "July"
    assert programs[1]["application_period_source"] is None

"""Tests for the role salary web search.

The search call is faked; these check how salary text is read, and that a
salary only counts as sourced when its page is on an approved site and was
actually among the search results, and that the page is about the same role,
is a market salary page rather than a single job ad or one employer's pay,
and is not for another state.
"""
import asyncio

from app.services.roadmap import salary_search
from app.services.roadmap.salary_search import RoleSalaries, RoleSalary, normalise_salary, page_matches_role, site_for, sourced_salary

PAGE = "https://au.indeed.com/career/civil-engineer/salaries/Sydney-NSW"


def test_salary_text_is_read_as_annual_dollars():
    assert normalise_salary("$89,733.28 - $101,515.44 + 12% superannuation") == "$89,733 - $101,515"
    assert normalise_salary("$75k - $85k") == "$75,000 - $85,000"
    assert normalise_salary("$70,000") == "$70,000"
    assert normalise_salary("about $1,200 per week") is None
    assert normalise_salary("") is None


def test_only_approved_sites_count():
    assert site_for("https://www.seek.com.au/career-advice/role/civil-engineer/salary") == "seek.com.au"
    assert site_for("https://grad.seek.com.au/jobs") == "seek.com.au"
    assert site_for("https://www.linkedin.com/jobs") is None


def test_salary_needs_a_page_from_the_search_results():
    found = RoleSalary(title="Graduate Civil Engineer", salary_range="$75,000 - $85,000", source_url=PAGE + "?from=serp")
    assert sourced_salary(found, {salary_search.page_key(PAGE)}, "Graduate Civil Engineer") == {"salary_range": "$75,000 - $85,000", "source": "Indeed", "source_url": PAGE + "?from=serp"}
    assert sourced_salary(found, set(), "Graduate Civil Engineer") is None
    assert sourced_salary(RoleSalary(title="x", salary_range="", source_url=""), {salary_search.page_key(PAGE)}, "x") is None


def test_page_must_be_about_the_role_and_not_another_state():
    assert page_matches_role(PAGE, "Graduate Civil Engineer")
    assert not page_matches_role("https://www.seek.com.au/companies/department-of-transport-n-planning-victoria-1/salaries/stock-analyst", "Policy Analyst")
    assert not page_matches_role("https://www.seek.com.au/career-advice/role/civil-engineer/salary/in-bendigo%2C-goldfields", "Civil Engineer")
    assert page_matches_role("https://www.seek.com.au/career-advice/role/civil-engineer/salary/in-sydney-nsw", "Civil Engineer")
    assert not page_matches_role("https://www.seek.com.au/civil-engineer-jobs/in-Castle-Hill-NSW-2154", "Civil Engineer")
    assert not page_matches_role("https://www.michaelpage.com.au/job-detail/management-consultant/ref/jn-1", "Management Consultant")
    assert not page_matches_role("https://www.glassdoor.com.au/Salaries/sydney-manager-salary.htm", "Senior Manager")


def test_search_returns_only_sourced_roles(monkeypatch):
    async def fake_search(prompt, schema, allowed_domains, **kwargs):
        assert "seek.com.au" in allowed_domains
        reply = RoleSalaries(roles=[
            RoleSalary(title="Graduate Civil Engineer", salary_range="$75,000 - $85,000", source_url=PAGE),
            RoleSalary(title="Project Engineer", salary_range="$110,000", source_url="https://example.com/salaries"),
        ])
        return reply, [PAGE]

    monkeypatch.setattr(salary_search, "ask_gpt_web_search", fake_search)

    found = asyncio.run(salary_search.search_role_salaries([{"title": "Graduate Civil Engineer"}, {"title": "Project Engineer"}], "Civil Engineering"))

    assert list(found) == ["graduate civil engineer"]


def test_one_employers_salary_page_does_not_count():
    assert not page_matches_role("https://www.seek.com.au/companies/aurecon-432740/salaries/electrical-engineer", "Electrical Engineer")
    assert not page_matches_role("https://au.indeed.com/cmp/Atlassian/salaries/Software-Engineer", "Software Engineer")
    assert not page_matches_role("https://www.payscale.com/research/AU/Employer=Telstra/Salary", "Network Engineer at Telstra")
    assert not page_matches_role("https://www.glassdoor.com.au/Salary/Atlassian-Software-Engineer-Salaries-E115699_D_KO10,27.htm", "Software Engineer")
    assert page_matches_role("https://www.seek.com.au/career-advice/role/electrical-engineer/salary", "Electrical Engineer")
    assert page_matches_role("https://www.payscale.com/research/AU/Job=Software_Engineer/Salary", "Software Engineer")

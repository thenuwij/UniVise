import logging
import re
from typing import Any, Dict, List
from urllib.parse import unquote, urlsplit

from pydantic import BaseModel

from app.llm.openai_client import ask_gpt_web_search

logger = logging.getLogger(__name__)

SALARY_SITES = {
    "seek.com.au": "SEEK",
    "au.indeed.com": "Indeed",
    "au.prosple.com": "Prosple",
    "au.gradconnection.com": "GradConnection",
    "yourcareer.gov.au": "YourCareer",
    "jobsandskills.gov.au": "Jobs and Skills Australia",
    "qilt.edu.au": "QILT",
    "hays.com.au": "Hays",
    "roberthalf.com.au": "Robert Half",
    "michaelpage.com.au": "Michael Page",
    "payscale.com": "Payscale",
    "glassdoor.com.au": "Glassdoor",
}

GENERIC_WORDS = {
    "graduate", "junior", "senior", "lead", "principal", "head", "chief", "manager", "officer", "analyst",
    "specialist", "consultant", "coordinator", "assistant", "associate", "advisor", "adviser", "executive",
    "director", "trainee", "intern", "entry", "level", "and", "the", "of", "for",
}
OTHER_PLACES = (
    "victoria", "melbourne", "bendigo", "geelong", "queensland", "brisbane", "perth", "adelaide",
    "hobart", "tasmania", "darwin", "canberra", "new-zealand", "auckland",
)
AMOUNT = re.compile(r"\$\s?(\d{1,3}(?:,\d{3})+|\d{2,7})(?:\.\d+)?\s*(k\b)?", re.I)


class RoleSalary(BaseModel):
    title: str
    salary_range: str
    source_url: str


class RoleSalaries(BaseModel):
    roles: list[RoleSalary]


def site_for(url: str) -> str | None:
    host = (urlsplit(url or "").hostname or "").lower()
    for domain in SALARY_SITES:
        if host == domain or host.endswith("." + domain):
            return domain
    return None


def page_key(url: str) -> str:
    parts = urlsplit(url or "")
    return f"{(parts.hostname or '').lower()}{parts.path.rstrip('/')}"


def normalise_salary(text: str) -> str | None:
    amounts = []
    for number, thousands in AMOUNT.findall(text or ""):
        value = int(number.replace(",", ""))
        amounts.append(value * 1000 if thousands else value)
    amounts = [a for a in amounts if 20000 <= a <= 1000000]
    if not amounts:
        return None
    low, high = min(amounts[:2]), max(amounts[:2])
    return f"${low:,}" if low == high else f"${low:,} - ${high:,}"


def distinctive_stems(title: str) -> List[str]:
    words = re.findall(r"[a-z]+", (title or "").lower())
    return [word[:6] for word in words if word not in GENERIC_WORDS and len(word) > 1]


EMPLOYER_PAGE = re.compile(r"/companies/|/cmp/|employer=|-e\d+[_.]")


def page_matches_role(url: str, title: str) -> bool:
    path = unquote(urlsplit(url or "").path).lower()
    if "salar" not in path:
        return False
    if any(place in path for place in OTHER_PLACES):
        return False
    if EMPLOYER_PAGE.search(path):
        return False
    location = re.search(r"/in-([^/]+)", path)
    if location and not re.search(r"nsw|sydney", location.group(1)):
        return False
    stems = distinctive_stems(title)
    return bool(stems) and any(stem in path for stem in stems)


def sourced_salary(found: RoleSalary, searched_pages: set, role_title: str) -> Dict[str, str] | None:
    salary = normalise_salary(found.salary_range)
    domain = site_for(found.source_url)
    if not salary or not domain or page_key(found.source_url) not in searched_pages:
        return None
    if not page_matches_role(found.source_url, role_title):
        return None
    return {"salary_range": salary, "source": SALARY_SITES[domain], "source_url": found.source_url}


def salary_prompt(roles: List[Dict[str, Any]], program_name: str) -> str:
    listing = "\n".join(f"- {role['title']}" for role in roles)
    return (
        f"Look up current Australian salaries, preferably for Sydney, for these roles that {program_name} graduates move into:\n{listing}\n\n"
        "Use salary pages (salary guides and salary summaries), not single job ads. For each role, return the salary range exactly as one page in your "
        "search results states it, and that page's URL in source_url. If no search result gives a figure for a role, return an empty "
        "salary_range and an empty source_url for it. Never estimate. Return every role, with its title exactly as given."
    )


async def search_role_salaries(roles: List[Dict[str, Any]], program_name: str) -> Dict[str, Dict[str, str]]:
    if not roles:
        return {}
    result, sources = await ask_gpt_web_search(
        salary_prompt(roles, program_name), RoleSalaries, list(SALARY_SITES), max_tokens=3000, model="gpt-5.4-mini"
    )
    searched_pages = {page_key(url) for url in sources}
    found = {}
    for item in result.roles:
        salary = sourced_salary(item, searched_pages, item.title)
        if salary:
            found[item.title.strip().lower()] = salary
    logger.info(f"[salary_search] {len(found)} of {len(roles)} salaries found with a source")
    return found

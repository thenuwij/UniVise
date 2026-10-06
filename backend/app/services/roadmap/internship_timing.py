import logging
import re
from typing import Any, Dict, List
from urllib.parse import urlsplit

from pydantic import BaseModel

from app.llm.openai_client import ask_gpt_web_search
from app.services.roadmap.salary_search import page_key

logger = logging.getLogger(__name__)

COMPANY_FILLER = {
    "pty", "ltd", "limited", "australia", "australian", "group", "inc", "the", "and", "co", "company",
    "corporation", "corp", "holdings", "services", "plc", "llp", "nsw", "of",
}


class ProgramTiming(BaseModel):
    company: str
    program_name: str
    usually_opens: str
    source_url: str


class ProgramTimings(BaseModel):
    programs: list[ProgramTiming]


def company_words(company: str) -> List[str]:
    return [w for w in re.findall(r"[a-z0-9]+", (company or "").lower()) if w not in COMPANY_FILLER and len(w) > 1]


def page_is_company(url: str, company: str) -> bool:
    host = (urlsplit(url or "").hostname or "").lower()
    words = company_words(company)
    return bool(host and words) and any(word in host for word in words)


def program_key(company: str, program_name: str) -> str:
    return f"{(company or '').strip().lower()}|{(program_name or '').strip().lower()}"


def timing_prompt(programs: List[Dict[str, Any]]) -> str:
    listing = "\n".join(f"- {p.get('company', '')}: {p.get('program_name', '')}" for p in programs)
    return (
        "For each of these Australian student and graduate programs, find on the company's own careers website when applications usually open:\n"
        f"{listing}\n\n"
        "Return usually_opens as the months, for example 'February to March', exactly as the company's page states or clearly implies, "
        "and that page's URL in source_url. Only use the company's own website, never a job board or a third party. If you cannot find it, "
        "return an empty usually_opens and an empty source_url. Never estimate. Return every program with its company and name exactly as given."
    )


async def search_program_timings(programs: List[Dict[str, Any]]) -> Dict[str, Dict[str, str]]:
    if not programs:
        return {}
    result, sources = await ask_gpt_web_search(timing_prompt(programs), ProgramTimings, None, max_tokens=3000, model="gpt-5.4-mini")
    searched_pages = {page_key(url) for url in sources}
    found = {}
    for item in result.programs:
        months = (item.usually_opens or "").strip()
        if months and page_key(item.source_url) in searched_pages and page_is_company(item.source_url, item.company):
            found[program_key(item.company, item.program_name)] = {"usually_opens": months, "source_url": item.source_url}
    logger.info(f"[internship_timing] {len(found)} of {len(programs)} opening times found on the company's site")
    return found


def apply_timings(programs: List[Dict[str, Any]], timings: Dict[str, Dict[str, str]]) -> None:
    for program in programs:
        found = timings.get(program_key(program.get("company"), program.get("program_name")))
        if found:
            program["application_period"] = found["usually_opens"]
            program["application_period_source"] = found["source_url"]
        else:
            program["application_period_source"] = None

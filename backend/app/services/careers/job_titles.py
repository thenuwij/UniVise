import logging
from typing import Any, Dict, List

from pydantic import BaseModel

from app.llm.openai_client import ask_gpt_structured
from app.services.careers.search_words import ad_search_words

logger = logging.getLogger(__name__)

MODEL = "gpt-5.4-mini"
MAX_SUGGESTED = 3


class JobTitles(BaseModel):
    titles: list[str]


def job_titles_prompt(program_name: str) -> str:
    return (
        f"A UNSW student is studying {program_name}.\n"
        f"List the {MAX_SUGGESTED} most common job titles that graduates of this exact degree and major get in Australia, most common first. "
        "Use plain titles as they appear in job ads, such as Software Engineer, without words like Graduate or Junior."
    )


async def job_search_roles(program_name: str, plan_roles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    try:
        result = await ask_gpt_structured(job_titles_prompt(program_name), JobTitles, max_tokens=300, temperature=1, model=MODEL)
    except Exception:
        logger.exception("[careers_feed] job title suggestions failed, using the plan's roles")
        return plan_roles
    suggested = [{"title": title, "ad_search": ad_search_words(title)} for title in result.titles[:MAX_SUGGESTED]]
    return suggested + list(plan_roles or [])

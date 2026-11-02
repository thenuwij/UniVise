import logging
from typing import Any, Dict, List

from pydantic import BaseModel

from app.llm.openai_client import ask_gpt_structured

logger = logging.getLogger(__name__)

MODEL = "gpt-5.4-mini"


class RelevantListings(BaseModel):
    keep: list[int]


def relevance_prompt(listings: List[Dict[str, Any]], program_name: str, roles: List[Dict[str, Any]]) -> str:
    role_titles = ", ".join(role.get("title") for role in roles or [] if role.get("title")) or "graduate roles in this field"
    numbered = "\n".join(
        f"{i}. {item.get('title')} | {item.get('organisation')} | {item.get('category')}" for i, item in enumerate(listings)
    )
    return (
        f"A UNSW student is studying {program_name or 'a UNSW degree'}. Their degree leads to entry-level roles such as: {role_titles}.\n\n"
        "Below are job, internship and event listings. Decide which ones a student or recent graduate of this degree would see as "
        "a sensible fit for their field.\n"
        "Keep listings in the degree's field, including closely related titles and any title matching the entry-level roles above "
        "(for example mechanical roles for mechatronics, embedded systems or network roles for computer engineering, or general IT "
        "internships for an IT-related degree). When unsure, keep it.\n"
        "General graduate programs or internships open to any discipline in this broad field are a fit. An internship or graduate role "
        "named for a different discipline is not, unless it matches the roles above (for example drop an electrical engineering internship "
        "for a nuclear engineering degree, unless electrical roles are listed).\n"
        "Drop listings that clearly belong to an unrelated field (for example marketing, sales, accounting or law for an engineering "
        "degree), trade apprenticeships, and roles needing several years of experience.\n\n"
        f"{numbered}\n\n"
        "Return the numbers of the listings to keep in keep."
    )


async def keep_relevant(listings: List[Dict[str, Any]], program_name: str, roles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not listings:
        return []
    try:
        result = await ask_gpt_structured(
            relevance_prompt(listings, program_name, roles), RelevantListings, max_tokens=2000, temperature=1, model=MODEL
        )
    except Exception:
        logger.exception("[careers_feed] relevance check failed, keeping every listing")
        return listings
    keep = {i for i in result.keep if 0 <= i < len(listings)}
    logger.info(f"[careers_feed] relevance check kept {len(keep)} of {len(listings)} listings")
    return [item for i, item in enumerate(listings) if i in keep]

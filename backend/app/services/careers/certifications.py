import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone

from app.core.database import supabase
from app.llm.openai_client import ask_gpt_structured
from app.models.certifications import CareerCertificationGroups
from app.services.course_picks import MAX_CAREERS, career_roles
from app.services.roadmap.grounding import validate_url

logger = logging.getLogger(__name__)

PROMPT_VERSION = 1
PER_CAREER = 4


def careers_for(user_id: str, roadmap: dict) -> list:
    saved = (
        supabase.from_("user_saved_items")
        .select("item_name")
        .eq("user_id", user_id)
        .eq("item_type", "career_path")
        .execute()
        .data
        or []
    )
    careers = [s["item_name"] for s in saved if s.get("item_name")]
    careers += [name for name in career_roles(roadmap.get("payload")) if name.lower() not in {c.lower() for c in careers}]
    return careers[:MAX_CAREERS]


def input_hash(program: str, careers: list) -> str:
    key = {"program": program, "careers": careers, "version": PROMPT_VERSION}
    return hashlib.sha256(json.dumps(key, sort_keys=True).encode()).hexdigest()


def read_cache(user_id: str) -> dict | None:
    try:
        rows = supabase.from_("user_career_certifications").select("input_hash, groups").eq("user_id", user_id).limit(1).execute().data
        return rows[0] if rows else None
    except Exception as e:
        logger.warning(f"[certifications] cache read failed: {e}")
        return None


def write_cache(user_id: str, hash_value: str, groups: list) -> None:
    try:
        supabase.from_("user_career_certifications").upsert(
            {"user_id": user_id, "input_hash": hash_value, "groups": groups, "updated_at": datetime.now(timezone.utc).isoformat()}
        ).execute()
    except Exception as e:
        logger.warning(f"[certifications] cache write failed: {e}")


def build_prompt(program: str, careers: list) -> str:
    return f"""A UNSW student studying {program} is considering these careers: {', '.join(careers)}.

For each career, list up to {PER_CAREER} industry certifications that employers in Australia genuinely value for that career.

Rules:
- Only real, well-known, industry-recognised certifications with an exam or formal credential (for example AWS Certified Cloud Practitioner, Cisco CCNA, CompTIA Security+).
- Never include university courses, degrees, bootcamps, free learning paths, MOOCs, memberships, or chartered status.
- Never include licences or exams for other countries, such as the US FE, EIT or PE exams.
- Use the career names exactly as given. Skip a career if no certification is genuinely valuable for it.
- why: one plain sentence of at most 20 words on how it helps that career.
- level: Beginner, Intermediate or Advanced. cost: Free or Paid (exam fee counts as Paid).
- time: typical preparation time, such as "4 to 6 weeks".
- when: "While studying" if a student can sensibly earn it during their degree, otherwise "After graduating".
- url: the certification's official page on the provider's own website.
- Mark exactly one certification per career as start_here: the best first one a student can earn while studying.
- Do not use em dashes, en dashes or double hyphens."""


async def check_links(groups: list) -> list:
    flat = [cert for group in groups for cert in group["certifications"]]
    flags = await asyncio.gather(*[validate_url(cert["url"]) for cert in flat])
    bad = {id(cert) for cert, ok in zip(flat, flags) if not ok}
    kept = []
    for group in groups:
        certs = [c for c in group["certifications"] if id(c) not in bad]
        if certs:
            if not any(c["start_here"] for c in certs):
                certs[0]["start_here"] = True
            kept.append({"career": group["career"], "certifications": certs})
    return kept


def clean(groups: list, careers: list) -> list:
    names = {c.lower(): c for c in careers}
    out, seen = [], set()
    for group in groups:
        career = names.get(group["career"].strip().lower())
        if not career or career in seen:
            continue
        seen.add(career)
        certs, starts = [], 0
        for cert in group["certifications"][:PER_CAREER]:
            if not cert["url"].startswith("https://") or any(c["name"].lower() == cert["name"].lower() for c in certs):
                continue
            starts += cert["start_here"]
            cert["start_here"] = cert["start_here"] and starts == 1
            certs.append(cert)
        if certs:
            out.append({"career": career, "certifications": certs})
    return sorted(out, key=lambda g: careers.index(g["career"]))


async def get_certifications(user_id: str, roadmap: dict) -> dict:
    careers = await asyncio.to_thread(careers_for, user_id, roadmap)
    result = {"careers": careers, "groups": [], "failed": False}
    if not careers:
        return result
    program = roadmap.get("program_name") or roadmap.get("degree_code") or "their degree"
    hash_value = input_hash(program, careers)
    cached = await asyncio.to_thread(read_cache, user_id)
    if cached and cached.get("input_hash") == hash_value:
        result["groups"] = cached.get("groups") or []
        return result
    try:
        generated = await ask_gpt_structured(build_prompt(program, careers), CareerCertificationGroups, max_tokens=3000, model="gpt-5.4-mini")
    except Exception as e:
        logger.error(f"[certifications] generation failed: {e}")
        result["failed"] = True
        return result
    groups = await check_links(clean(generated.model_dump()["groups"], careers))
    await asyncio.to_thread(write_cache, user_id, hash_value, groups)
    result["groups"] = groups
    return result

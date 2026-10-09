import asyncio
import logging

from app.services.course_picks import input_hash, load_inputs, read_cache
from app.services.requirements import format_requirements, requirement_status

logger = logging.getLogger(__name__)

MAX_COMPLETED = 40
MAX_AVAILABLE = 15
MAX_CAREERS = 8


def cached_picks(user_id: str, inputs: dict | None) -> list:
    if not inputs or not inputs["candidates"]:
        return []
    cached = read_cache(user_id)
    if cached and cached.get("input_hash") == input_hash(inputs):
        return cached.get("picks") or []
    return []


def format_student_summary(inputs: dict | None, picks: list) -> str:
    if not inputs:
        return "- No UNSW program saved yet. Use the student profile above."

    lines = [
        f"- Program: {inputs['program_name']} ({inputs['degree_code']})",
        f"- Specialisations: {', '.join(inputs['specialisations']) or 'none chosen yet'}",
    ]

    completed = inputs["completed"]
    shown = completed[:MAX_COMPLETED]
    extra = f" and {len(completed) - len(shown)} more" if len(completed) > len(shown) else ""
    lines.append(f"- Completed courses ({len(completed)}): {', '.join(shown) or 'none ticked yet'}{extra}")

    available = inputs["candidates"][:MAX_AVAILABLE]
    if available:
        lines.append("- Courses they can take now (prerequisites met):")
        lines += [f"  - {c['code']}: {c['name']}" for c in available]
    else:
        lines.append("- Courses they can take now: none found in their program list")

    if picks:
        lines.append("- Recommended for you (UniVise course picks):")
        lines += [f"  - {p['code']}: {p['reason']}" for p in picks]

    saved = inputs.get("saved_careers") or []
    recommended = [c for c in inputs["careers"] if c not in saved]
    lines.append(f"- Shortlisted careers: {', '.join(saved[:MAX_CAREERS]) or 'none yet'}")
    lines.append(f"- Career recommendations: {', '.join(recommended[:MAX_CAREERS]) or 'none yet'}")

    if inputs.get("requirement_lists"):
        parts = requirement_status(inputs["requirement_lists"], set(completed), set(inputs.get("added") or []), inputs.get("placed"), inputs.get("completed_uoc_by_code"))
        lines.append("")
        lines.append("## Degree progress (from their ticked courses and the 2026 Handbook)")
        lines.append(format_requirements(parts, inputs.get("minimum_uoc"), inputs.get("completed_uoc") or 0))
        planned = [code for code in inputs.get("added") or [] if code not in completed]
        if planned:
            lines.append(f"- Courses they've added to their plan: {', '.join(planned)}")
    return "\n".join(lines)


def build_student_summary(user_id: str) -> str:
    inputs = load_inputs(user_id)
    return format_student_summary(inputs, cached_picks(user_id, inputs))


async def safe_student_summary(user_id: str) -> str | None:
    try:
        return await asyncio.to_thread(build_student_summary, user_id)
    except Exception as e:
        logger.warning(f"[chat] student summary unavailable: {type(e).__name__}")
        return None

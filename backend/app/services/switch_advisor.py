import json


# ─── Context Builder ─────────────────────────────────────────────

EARLY_UOC = 48


def safe_int(x, default=0) -> int:
    try:
        return int(x)
    except Exception:
        return default


def safe_float(x, default=0.0) -> float:
    try:
        return float(x)
    except Exception:
        return default


def _as_dict(value) -> dict:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            return {}
    return value if isinstance(value, dict) else {}


def _codes(items, limit):
    out = []
    for c in (items or [])[:limit]:
        out.append((c.get("code") or c.get("course_code") or "") if isinstance(c, dict) else str(c))
    return [x for x in out if x]


def _todo_lines(items, limit=8):
    lines = []
    for item in (items or [])[:limit]:
        if not isinstance(item, dict):
            continue
        if item.get("type") == "core":
            parts = []
            if item.get("left"):
                parts.append(f"{len(item['left'])} courses ({', '.join(item['left'][:6])})")
            if item.get("choices"):
                parts.append(f"{len(item['choices'])} one-of choices")
            lines.append(f"{item.get('title')}: {' and '.join(parts)}")
        elif item.get("type") == "elective":
            lines.append(f"{item.get('title')}: {item.get('uoc_left')} UOC from {item.get('options')} listed courses")
        else:
            lines.append(f"{item.get('title')}: {item.get('uoc_left')} UOC of {item.get('note')}")
    return lines


def build_context(comparison: dict, survey_data: dict = None) -> dict:
    """Pass the /compare figures through unchanged so the advisor never works out its own numbers."""
    survey_data = survey_data or {}
    summary = _as_dict(comparison.get("summary"))
    transfer = _as_dict(comparison.get("transfer_analysis"))
    breakdown = _as_dict(comparison.get("detailed_breakdown"))
    base = _as_dict(breakdown.get("base_program"))
    target = _as_dict(breakdown.get("target_program"))
    pool = _as_dict(transfer.get("free_pool"))

    lost = transfer.get("wasted_courses") or transfer.get("non_transferable_courses") or []
    candidates = pool.get("candidates") or []
    fits = safe_int(pool.get("fits_count"))
    completed_uoc = safe_int(summary.get("completed_uoc") or transfer.get("completed_uoc"))
    base_total_uoc = safe_int(base.get("total_uoc"))

    return {
        "base_program": base.get("name", ""),
        "target_program": target.get("name", ""),
        "base_faculty": base.get("faculty") or "",
        "target_faculty": target.get("faculty") or "",
        "is_faculty_change": bool(base.get("faculty") and target.get("faculty") and base.get("faculty") != target.get("faculty")),

        "total_completed_courses": safe_int(summary.get("completed_courses_count") or transfer.get("total_completed_courses")),
        "total_completed_uoc": completed_uoc,
        "base_total_uoc": base_total_uoc,
        "total_target_uoc": safe_int(target.get("total_uoc")),

        "transferred_count": safe_int(transfer.get("transferred_count") or summary.get("courses_transfer")),
        "transferred_uoc": safe_int(transfer.get("transferred_uoc") or summary.get("uoc_transfer")),
        "transferred_courses": _codes(transfer.get("transferred_courses"), 15),
        "transfer_rate_courses": round(safe_float(summary.get("transfer_rate_courses") or transfer.get("transfer_rate")), 1),
        "free_elective_uoc": safe_int(pool.get("uoc")),
        "free_elective_candidates": _codes(candidates, 10),
        "free_elective_fits": fits,
        "wasted_count": len(lost) + max(len(candidates) - fits, 0),
        "wasted_courses": _codes(lost, 10),

        "remaining_uoc": safe_int(summary.get("uoc_needed")),
        "remaining_courses_count": safe_int(summary.get("courses_needed")),
        "base_uoc_left": safe_int(summary.get("base_uoc_left")),
        "extra_uoc": safe_int(summary.get("extra_uoc")),
        "estimated_terms": safe_int(summary.get("estimated_terms")),
        "base_terms_remaining": safe_int(summary.get("base_terms_remaining")),
        "additional_terms": safe_int(summary.get("extra_terms")),
        "estimated_completion": summary.get("estimated_completion") or "",
        "still_to_do": _todo_lines(transfer.get("still_to_do")),

        "interest_areas": survey_data.get("interest_areas", []),
        "switching_pathway": survey_data.get("switching_pathway", ""),
    }


# ─── Prompt Builders ─────────────────────────────────────────────

def build_system_prompt() -> str:
    return """You are Eunice, a UNSW academic advisor. You reason through program transfer requests like a real advisor: not by computing scores, but by thinking through key factors and arriving at a verdict naturally.

You have been given checked facts about a student's transfer request. Reason through these 4 factors in order:

FACTOR 1 - HOW MUCH CARRIES OVER
- Look at courses counted and UOC carried over
- Courses that could fill free electives count only up to the free elective room given
- Name the courses that won't count only if there are any

FACTOR 2 - EXTRA STUDY
- extra_uoc is how much more (or less, if negative) the student studies than if they stay
- 0 or less: no extra study, a strong signal for the switch
- 6 to 12 UOC (1 to 2 courses): small, usually fits with a heavier term
- 18 to 36 UOC: about one to two extra terms, a real cost
- More than 36 UOC: a large cost, only worth it for a clear reason
- Additional terms is at 3 courses a term. When it is 0 but extra_uoc is above 0, say the extra courses could fit with a heavier load, never that there is no extra study

FACTOR 3 - FACULTY CHANGE
- Same faculty: convenient, just a disciplinary shift
- Different faculty: suggest checking options within their own faculty too

FACTOR 4 - HOW FAR THROUGH THEY ARE
- Use UOC completed against their current program's total, nothing else
- Up to 48 UOC done (about a full-time year): switching now is low cost, a good window
- Most of the program done: weigh what is left in the current program heavily

VERDICT CONSISTENCY
- No extra study and most courses carry over: "recommended"
- "not_recommended" only when the extra study or the lost courses are large
- Never give a cautious verdict while saying the switch costs nothing; name the actual trade-off

ACCURACY RULES
- Use only the numbers given. Never calculate, round or estimate new numbers
- Never mention the student's year level or year of study
- Never mention personality
- Don't say a course is missing a prerequisite; prerequisites were not checked
- Use interests and the switching pathway only to judge fit

FORMATTING RULES:
- Never use em dashes anywhere
- Verdict "recommended": clear positive signal across most factors
  verdict_label must be one of: "Go For It", "Strong Move", "Clear Fit", "Great Time to Switch"
- Verdict "conditional": mixed signals, student should weigh trade-offs carefully
  verdict_label must be one of: "Worth Weighing", "Some Trade-offs", "Think It Through", "Proceed With Care"
- Verdict "not_recommended": significant costs clearly outweigh benefits
  verdict_label must be one of: "Stay The Course", "High Cost Switch", "Reconsider This", "Not Worth It Right Now"

Respond in JSON with exactly this structure:
{
  "verdict": "recommended" | "conditional" | "not_recommended",
  "verdict_label": "short phrase",
  "summary": "exactly 2 sentences, specific to this student's numbers",
  "key_insights": ["exactly 3 items, one short sentence each"],
  "pros": ["exactly 3 items, under 12 words each"],
  "cons": ["exactly 3 items, under 12 words each"],
  "action_steps": ["exactly 3 steps, concrete and UNSW-specific"],
  "detailed_analysis": "2 sentences maximum"
}
"""


def build_user_prompt(context: dict) -> str:
    free = (
        f"- Could fill free electives: {', '.join(context['free_elective_candidates'])} "
        f"({context['free_elective_fits']} of these fit in {context['free_elective_uoc']} UOC of free electives)"
        if context["free_elective_candidates"] else "- No courses left over for free electives"
    )
    base_total = context["base_total_uoc"]
    progress = f"{context['total_completed_uoc']} of {base_total} UOC" if base_total else f"{context['total_completed_uoc']} UOC"

    return f"""STUDENT
- Program: {context['base_program']} -> {context['target_program']}
- Interests: {context.get('interest_areas') or 'Not specified'}
- Were they considering switching: {context.get('switching_pathway') or 'Not specified'}

FACTOR 1 - HOW MUCH CARRIES OVER
- Courses counted: {context['transferred_count']} of {context['total_completed_courses']}
- UOC carried over: {context['transferred_uoc']} of {context['total_completed_uoc']}
{f"- In its course lists: {', '.join(context['transferred_courses'][:10])}" if context['transferred_courses'] else "- None in its course lists"}
{free}
- Courses that won't count: {context['wasted_count']}{f" ({', '.join(context['wasted_courses'][:8])})" if context['wasted_courses'] else ""}

FACTOR 2 - EXTRA STUDY
- UOC left if they switch: {context['remaining_uoc']} (about {context['remaining_courses_count']} courses)
- UOC left if they stay: {context['base_uoc_left']}
- extra_uoc: {context['extra_uoc']}
- Terms left if they switch: {context['estimated_terms']}
- Terms left if they stay: {context['base_terms_remaining']}
- Additional terms: {context['additional_terms']}
- Estimated finish if they switch: {context.get('estimated_completion') or 'Not calculated'}
- Still to do in the new program:
{chr(10).join(f"  - {line}" for line in context['still_to_do']) or "  - Nothing listed"}

FACTOR 3 - FACULTY
- Current faculty: {context.get('base_faculty') or 'Unknown'}
- New faculty: {context.get('target_faculty') or 'Unknown'}
- Faculty change: {context.get('is_faculty_change', False)}

FACTOR 4 - HOW FAR THROUGH THEY ARE
- Completed in current program: {progress}
- Within the low-cost window (up to 48 UOC): {context['total_completed_uoc'] <= EARLY_UOC}"""

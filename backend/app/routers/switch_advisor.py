# app/routers/switch_advisor.py
# AI-powered program switch advisor
# Takes the EXISTING /compare endpoint results and sends them to OpenAI for analysis
# Does NOT duplicate compare logic — receives comparison_data from frontend

import os
import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

logger = logging.getLogger(__name__)

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ─── Request / Response Models ───────────────────────────────────

class SwitchAdvisorRequest(BaseModel):
    user_id: str
    base_program_code: str
    base_specialisation_codes: list[str] = []
    target_program_code: str
    target_specialisation_codes: list[str] = []
    comparison_data: dict  # The full response from /compare endpoint


class SwitchAdvisorResponse(BaseModel):
    verdict: str            # "recommended" | "conditional" | "not_recommended"
    verdict_label: str      # Human-friendly label
    summary: str            # 2-3 sentence overview
    key_insights: list[str] # 3-5 bullet points
    pros: list[str]         # Reasons to switch
    cons: list[str]         # Reasons to stay
    action_steps: list[str] # Recommended next steps
    detailed_analysis: str  # 2-3 paragraph deep dive


# ─── Endpoint ────────────────────────────────────────────────────

@router.post("/switch-advisor", response_model=SwitchAdvisorResponse)
async def get_switch_advice(request: SwitchAdvisorRequest):
    """
    Generate AI-powered program switch recommendation.

    Receives comparison_data computed by /compare and passes it to GPT for
    a natural language analysis and recommendation.
    """
    try:
        comparison = request.comparison_data

        context = build_context(comparison)
        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(context)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        result = json.loads(raw)

        return SwitchAdvisorResponse(
            verdict=result.get("verdict", "conditional"),
            verdict_label=result.get("verdict_label", "Review Needed"),
            summary=result.get("summary", ""),
            key_insights=result.get("key_insights", []),
            pros=result.get("pros", []),
            cons=result.get("cons", []),
            action_steps=result.get("action_steps", []),
            detailed_analysis=result.get("detailed_analysis", ""),
        )

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"Switch advisor error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Context Builder ─────────────────────────────────────────────

def _safe_int(x, default=0) -> int:
    try:
        return int(x)
    except Exception:
        return default


def _safe_float(x, default=0.0) -> float:
    try:
        return float(x)
    except Exception:
        return default


def build_context(comparison: dict) -> dict:
    """Extract the most relevant data from comparison results for the AI prompt."""

    summary = comparison.get("summary", {}) or {}
    transfer = comparison.get("transfer_analysis", {}) or {}
    breakdown = comparison.get("detailed_breakdown", {}) or {}
    critical = comparison.get("critical_issues", []) or []
    reqs_by_level = comparison.get("requirements_by_level", {}) or {}

    # Handle cases where some fields accidentally arrive as strings
    if isinstance(transfer, str):
        try:
            transfer = json.loads(transfer)
        except Exception:
            transfer = {}
    if isinstance(summary, str):
        try:
            summary = json.loads(summary)
        except Exception:
            summary = {}
    if isinstance(breakdown, str):
        try:
            breakdown = json.loads(breakdown)
        except Exception:
            breakdown = {}
    if isinstance(reqs_by_level, str):
        try:
            reqs_by_level = json.loads(reqs_by_level)
        except Exception:
            reqs_by_level = {}

    # Pull transferred / wasted lists using BOTH possible keys
    transferred = transfer.get("transferred_courses", []) or []
    wasted = (
        transfer.get("non_transferable_courses")
        or transfer.get("wasted_courses")
        or transfer.get("nontransferable_courses")
        or []
    )

    # Course code lists
    def _codes(items, limit):
        out = []
        for c in items[:limit]:
            if isinstance(c, dict):
                out.append(c.get("code") or c.get("course_code") or "")
            else:
                out.append(str(c))
        return [x for x in out if x]

    transferred_codes = _codes(transferred, 15)
    wasted_codes = _codes(wasted, 10)

    # TRUE completed denominator (course count)
    total_completed_courses = (
        transfer.get("total_completed_courses")
        or summary.get("completed_courses_count")
        or transfer.get("completed_courses_count")
        or comparison.get("completed_courses_count")
    )
    total_completed_courses = _safe_int(total_completed_courses, default=(len(transferred) + len(wasted)))

    # UOC totals
    completed_uoc = (
        transfer.get("completed_uoc")
        or summary.get("completed_uoc")
        or 0
    )
    completed_uoc = _safe_int(completed_uoc)

    transferred_uoc = transfer.get("transferred_uoc")
    if transferred_uoc is None:
        # fallback: sum from transferred list
        transferred_uoc = sum(_safe_int(c.get("uoc")) for c in transferred if isinstance(c, dict))
    transferred_uoc = _safe_int(transferred_uoc)

    wasted_uoc = transfer.get("wasted_uoc")
    if wasted_uoc is None:
        wasted_uoc = sum(_safe_int(c.get("uoc")) for c in wasted if isinstance(c, dict))
    wasted_uoc = _safe_int(wasted_uoc)

    # Rates
    transfer_rate_courses = (
        transfer.get("transfer_rate")
        or summary.get("transfer_rate_courses")
        or 0
    )
    transfer_rate_courses = _safe_float(transfer_rate_courses)

    transfer_rate_uoc = summary.get("transfer_rate_uoc")
    if transfer_rate_uoc is None:
        transfer_rate_uoc = (transferred_uoc / max(completed_uoc, 1)) * 100 if completed_uoc else 0
    transfer_rate_uoc = float(transfer_rate_uoc)

    # Remaining requirements: aggregate from requirements_by_level (dict of LevelGroup)
    needed_courses = []
    prereq_issues = []

    if isinstance(reqs_by_level, dict):
        level_groups = reqs_by_level.values()
    elif isinstance(reqs_by_level, list):
        level_groups = reqs_by_level
    else:
        level_groups = []

    for level_group in level_groups:
        if not isinstance(level_group, dict):
            continue
        courses = level_group.get("courses", []) or []
        for course in courses:
            if isinstance(course, str):
                needed_courses.append(course)
                continue
            code = course.get("code") or course.get("course_code") or ""
            if code:
                needed_courses.append(code)
            if course.get("has_prereq_issue"):
                prereq_issues.append({
                    "code": code,
                    "missing_prerequisites": course.get("missing_prerequisites", []),
                    "prereq_type": course.get("prereq_type", ""),
                })

    # Critical issues
    critical_descriptions = []
    for issue in (critical[:5] if critical else []):
        if isinstance(issue, dict):
            # Compare uses "message"
            critical_descriptions.append(issue.get("message") or issue.get("description") or str(issue))
        else:
            critical_descriptions.append(str(issue))

    # Target program total UOC
    target_total_uoc = 0
    if isinstance(breakdown, dict):
        tp = breakdown.get("target_program", {}) or {}
        target_total_uoc = _safe_int(tp.get("total_uoc") or 0)

    # Remaining UOC: use compare summary if present
    remaining_uoc = _safe_int(summary.get("uoc_needed") or 0)
    remaining_courses_count = _safe_int(summary.get("courses_needed") or 0)

    return {
        "can_transfer": comparison.get("can_transfer", True),
        "recommendation": comparison.get("recommendation", ""),

        "base_program": (breakdown.get("base_program", {}) or {}).get("name", "") if isinstance(breakdown, dict) else "",
        "target_program": (breakdown.get("target_program", {}) or {}).get("name", "") if isinstance(breakdown, dict) else "",

        # Denominators
        "total_completed_courses": total_completed_courses,
        "total_completed_uoc": completed_uoc,
        "total_target_uoc": target_total_uoc,

        # Transfer counts
        "transferred_count": len(transferred),
        "wasted_count": len(wasted),

        # Transfer UOC
        "transferred_uoc": transferred_uoc,
        "wasted_uoc": wasted_uoc,

        # Lists
        "transferred_courses": transferred_codes,
        "wasted_courses": wasted_codes,

        # Remaining
        "remaining_courses_count": remaining_courses_count,
        "remaining_uoc": remaining_uoc,
        "needed_courses": needed_courses[:20],
        "prereq_issues": prereq_issues[:10],
        "critical_issues": critical_descriptions,

        "estimated_completion": summary.get("estimated_completion") or summary.get("estimated_completion_date") or "",
        "transfer_rate_courses": round(transfer_rate_courses, 1),
        "transfer_rate_uoc": round(transfer_rate_uoc, 1),
    }


# ─── Prompt Builders ─────────────────────────────────────────────

def build_system_prompt() -> str:
    return """You are a UNSW academic advisor AI. You analyse program comparison data and provide
clear, actionable advice about whether a student should switch programs.

You must respond in JSON with exactly this structure:
{
  "verdict": "recommended" | "conditional" | "not_recommended",
  "verdict_label": "string (2-4 words, e.g. 'Go For It', 'Proceed With Caution', 'Think Twice')",
  "summary": "string (2-3 sentences summarising the recommendation)",
  "key_insights": ["string", ...] (3-5 most important findings - BE ACCURATE WITH NUMBERS),
  "pros": ["string", ...] (3-5 reasons to switch),
  "cons": ["string", ...] (3-5 reasons to stay),
  "action_steps": ["string", ...] (3-5 concrete next steps if they decide to switch),
  "detailed_analysis": "string (2-3 paragraphs with deeper analysis)"
}

CRITICAL NUMBERS RULES:
- Use the provided COURSE transfer rate as the headline (transfer_rate_courses).
- Do NOT infer denominators from list lengths unless explicitly told; use total_completed_courses.
- You may mention UOC transfer rate (transfer_rate_uoc) as a secondary supporting stat.
- Always state: transferred_count out of total_completed_courses (and the %).
- If transfer_rate_courses is 100%, it means ALL completed courses transfer.
- If transfer_rate_courses is 0%, it means NONE of the completed courses transfer.

Other Guidelines:
- Be specific with course counts, UOC numbers, and percentages.
- Mention prerequisite blockers if present.
- Consider the student's progress and how much would be lost.
- Reference UNSW processes (IPT, academic advising).
- Keep language clear, professional, and student-friendly.
"""


def build_user_prompt(context: dict) -> str:
    total_completed = context["total_completed_courses"]

    return f"""Analyse this program switch scenario for a UNSW student:

CURRENT PROGRAM: {context['base_program']}
TARGET PROGRAM: {context['target_program']}

PROGRESS SO FAR:
- Completed courses: {total_completed} courses ({context['total_completed_uoc']} UOC)
- Target program total requirement: {context['total_target_uoc']} UOC

TRANSFER ANALYSIS (SOURCE OF TRUTH):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COURSE TRANSFER RATE: {context['transfer_rate_courses']}%
- Courses that WILL transfer: {context['transferred_count']} out of {total_completed} courses ({context['transferred_uoc']} UOC)
- Courses that WON'T transfer: {context['wasted_count']} out of {total_completed} courses ({context['wasted_uoc']} UOC)

UOC TRANSFER RATE (secondary): {context['transfer_rate_uoc']}%

{f"✓ Transferred courses: {', '.join(context['transferred_courses'][:10])}" if context['transferred_courses'] else "✓ No transferred courses listed"}
{f"✗ Non-transferable courses: {', '.join(context['wasted_courses'][:8])}" if context['wasted_courses'] else "✗ No non-transferable courses listed"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMAINING REQUIREMENTS:
- Additional NEW courses needed: {context['remaining_courses_count']} courses ({context['remaining_uoc']} UOC)
- Sample required courses: {', '.join(context['needed_courses'][:12]) if context['needed_courses'] else 'None listed'}

PREREQUISITE ISSUES (missing prerequisites):
{json.dumps(context['prereq_issues'][:8], indent=2) if context['prereq_issues'] else 'None detected'}

CRITICAL BLOCKERS:
{chr(10).join('- ' + issue for issue in context['critical_issues']) if context['critical_issues'] else 'None detected'}

SYSTEM RECOMMENDATION: {context['recommendation']}
ESTIMATED COMPLETION: {context['estimated_completion'] or 'Not calculated'}
CAN TRANSFER: {context['can_transfer']}

⚠️ CRITICAL: In key_insights, you MUST state the correct course transfer rate:
{context['transferred_count']} out of {total_completed} courses = {context['transfer_rate_courses']}%."""

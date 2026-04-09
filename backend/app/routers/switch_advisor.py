# app/routers/switch_advisor.py
# AI-powered program switch advisor
# Takes the EXISTING /compare endpoint results and sends them to OpenAI for analysis
# Does NOT duplicate compare logic — receives comparison_data from frontend

import os
import json
import logging
import asyncio
import anthropic
from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from pydantic import BaseModel
from app.utils.parse_llm import extract_json
from app.utils.database import supabase

logger = logging.getLogger(__name__)

router = APIRouter()
_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


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
    # Timeline data passed through from context
    additional_terms: float = 0
    estimated_completion: str = ""
    transfer_rate: float = 0
    courses_transferred: int = 0
    courses_lost: int = 0


# ─── Endpoint ────────────────────────────────────────────────────

@router.post("/switch-advisor", response_model=SwitchAdvisorResponse)
async def get_switch_advice(
    request: SwitchAdvisorRequest,
    user=Depends(get_current_user),
):
    """
    Generate AI-powered program switch recommendation.

    Receives comparison_data computed by /compare and passes it to GPT for
    a natural language analysis and recommendation.
    """
    try:
        comparison = request.comparison_data

        def fetch_personality():
            try:
                res = supabase.table("personality_results") \
                    .select("top_types, result_summary, trait_scores") \
                    .eq("user_id", str(request.user_id)) \
                    .maybe_single() \
                    .execute()
                return res.data or {}
            except Exception as e:
                logger.warning(f"[switch_advisor] fetch_personality failed for user {request.user_id}: {e}")
                return {}

        def fetch_survey():
            try:
                res = supabase.table("student_uni_data") \
                    .select("academic_year, study_feelings, interest_areas, switching_pathway, confidence") \
                    .eq("user_id", str(request.user_id)) \
                    .maybe_single() \
                    .execute()
                return res.data or {}
            except Exception as e:
                logger.warning(f"[switch_advisor] fetch_survey failed for user {request.user_id}: {e}")
                return {}

        personality_data, survey_data = await asyncio.gather(
            asyncio.to_thread(fetch_personality),
            asyncio.to_thread(fetch_survey)
        )

        context = build_context(comparison, personality_data, survey_data)
        user_prompt = build_user_prompt(context)

        response = _client.messages.create(
            model="claude-sonnet-4-6",
            system=build_system_prompt(),
            messages=[{"role": "user", "content": user_prompt}],
            max_tokens=2000,
        )

        result = extract_json(response.content[0].text)

        return SwitchAdvisorResponse(
            verdict=result.get("verdict", "conditional"),
            verdict_label=result.get("verdict_label", "Review Needed"),
            summary=result.get("summary", ""),
            key_insights=result.get("key_insights", []),
            pros=result.get("pros", []),
            cons=result.get("cons", []),
            action_steps=result.get("action_steps", []),
            detailed_analysis=result.get("detailed_analysis", ""),
            # Pass through timeline and transfer stats from context
            additional_terms=context.get("additional_terms", 0),
            estimated_completion=context.get("estimated_completion", ""),
            transfer_rate=context.get("transfer_rate_courses", 0),
            courses_transferred=context.get("transferred_count", 0),
            courses_lost=context.get("wasted_count", 0),
        )

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Claude response: {e}")
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


def build_context(comparison: dict, personality_data: dict = None, survey_data: dict = None) -> dict:
    """Extract the most relevant data from comparison results for the AI prompt."""
    if personality_data is None:
        personality_data = {}
    if survey_data is None:
        survey_data = {}

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
    base_faculty = ""
    target_faculty = ""
    if isinstance(breakdown, dict):
        bp = breakdown.get("base_program", {}) or {}
        tp = breakdown.get("target_program", {}) or {}
        target_total_uoc = _safe_int(tp.get("total_uoc") or 0)
        base_faculty = bp.get("faculty", "") or ""
        target_faculty = tp.get("faculty", "") or ""

    # Remaining UOC: use compare summary if present
    remaining_uoc = _safe_int(summary.get("uoc_needed") or 0)
    remaining_courses_count = _safe_int(summary.get("courses_needed") or 0)

    # Estimated terms (calculate from UOC if not provided)
    estimated_terms = _safe_int(summary.get("estimated_terms") or 0)
    if estimated_terms == 0 and remaining_uoc > 0:
        estimated_terms = max(1, (remaining_uoc + 17) // 18)

    # Progress percentage
    progress_percentage = _safe_float(summary.get("progress_percentage") or 0)

    # Base degree terms remaining (how long they'd stay in current degree)
    base_total_uoc = 0
    if isinstance(breakdown, dict):
        bp = breakdown.get("base_program", {}) or {}
        base_total_uoc = _safe_int(bp.get("total_uoc") or 0)
    base_terms_remaining = max(0, (base_total_uoc - completed_uoc) / 18) if base_total_uoc > 0 else 0
    base_terms_remaining = round(base_terms_remaining, 1)
    additional_terms = max(0, round(estimated_terms - base_terms_remaining, 1))

    return {
        "can_transfer": comparison.get("can_transfer", True),
        "recommendation": comparison.get("recommendation", ""),

        "base_program": (breakdown.get("base_program", {}) or {}).get("name", "") if isinstance(breakdown, dict) else "",
        "target_program": (breakdown.get("target_program", {}) or {}).get("name", "") if isinstance(breakdown, dict) else "",
        "base_faculty": base_faculty,
        "target_faculty": target_faculty,
        "is_faculty_change": base_faculty != target_faculty and base_faculty and target_faculty,

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
        "estimated_terms": estimated_terms,
        "progress_percentage": round(progress_percentage, 1),
        "needed_courses": needed_courses[:20],
        "prereq_issues": prereq_issues[:10],
        "critical_issues": critical_descriptions,

        "estimated_completion": summary.get("estimated_completion") or summary.get("estimated_completion_date") or "",
        "transfer_rate_courses": round(transfer_rate_courses, 1),
        "transfer_rate_uoc": round(transfer_rate_uoc, 1),

        # Time delta
        "base_terms_remaining": base_terms_remaining,
        "additional_terms": additional_terms,

        # Personality
        "personality_top_types": personality_data.get("top_types", []),
        "personality_summary": personality_data.get("result_summary", ""),

        # Survey context
        "academic_year": survey_data.get("academic_year", ""),
        "study_feelings": survey_data.get("study_feelings", ""),
        "interest_areas": survey_data.get("interest_areas", []),
        "switching_pathway": survey_data.get("switching_pathway", ""),
    }


# ─── Prompt Builders ─────────────────────────────────────────────

def build_system_prompt() -> str:
    return """You are Eunice, a UNSW academic advisor. You reason through program transfer requests like a real advisor: not by computing scores, but by thinking through key factors and arriving at a verdict naturally.

You have been given structured facts about a student's transfer request. Reason through these 5 factors in order:

FACTOR 1 - COURSE TRANSFER RATE
- 80%+ transferring: strong foundation, student loses little
- 50-79% transferring: some loss, worth noting
- Under 50% transferring: most work does not carry over, significant cost

FACTOR 2 - TIME IMPACT
- Use additional_terms (delta vs current degree, not total remaining)
- 0 additional terms: no extra time, non-issue
- 1-2 additional terms: manageable, worth noting
- 3-6 additional terms: real cost, think carefully
- 6+ additional terms: only if truly essential

FACTOR 3 - FACULTY CHANGE
- Same faculty: convenient, just a disciplinary shift
- Different faculty: prompt student to check alternatives within their own faculty first

FACTOR 4 - PREREQUISITE GAPS
- Only flag genuine gaps where student should have completed something by now but has not
- Not "has not done it yet" but only "behind for their year level"

FACTOR 5 - HOW EARLY THE STUDENT IS
- completed_uoc <= 54 (first year): switching now is low cost regardless of other factors, ideal window

ADDITIONAL CONTEXT
- Use personality_top_types and study_feelings to personalise tone
- Use interest_areas to check if target degree aligns with interests
- Use switching_pathway: if student said they are happy with current path but is now exploring a switch, acknowledge that nuance

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
    total_completed = context["total_completed_courses"]
    prereq_count = len(context.get("prereq_issues", []))
    is_first_year = context.get("total_completed_uoc", 0) <= 54

    return f"""STUDENT PROFILE
- Program: {context['base_program']} -> {context['target_program']}
- Academic year: {context.get('academic_year') or 'Unknown'}
- Personality: {context.get('personality_top_types') or 'Not available'} ({context.get('personality_summary') or 'No summary'})
- Interests: {context.get('interest_areas') or 'Not specified'}
- How they feel about studying: {context.get('study_feelings') or 'Not specified'}
- Were they considering switching: {context.get('switching_pathway') or 'Not specified'}

FACTOR 1 - TRANSFER RATE
- {context['transferred_count']} of {total_completed} courses transfer ({context['transfer_rate_courses']:.1f}%)
- UOC preserved: {context['transferred_uoc']} of {context['total_completed_uoc']}
- Courses lost: {context['wasted_count']}
{f"- Transferring: {', '.join(context['transferred_courses'][:10])}" if context['transferred_courses'] else "- No courses transfer"}
{f"- Lost: {', '.join(context['wasted_courses'][:8])}" if context['wasted_courses'] else "- No courses lost"}

FACTOR 2 - TIME IMPACT
- Estimated completion: {context.get('estimated_completion') or 'Not calculated'}
- Terms remaining in target degree: {context['estimated_terms']}
- Terms remaining in current degree: {context['base_terms_remaining']}
- Additional terms from switching: {context['additional_terms']}
- Additional courses needed: {context['remaining_courses_count']} courses ({context['remaining_uoc']} UOC)

FACTOR 3 - FACULTY
- Base faculty: {context.get('base_faculty') or 'Unknown'}
- Target faculty: {context.get('target_faculty') or 'Unknown'}
- Faculty change: {context.get('is_faculty_change', False)}

FACTOR 4 - PREREQUISITE GAPS
- Prereq issues identified: {prereq_count}
  (Note: many may be normal for year level, not genuine blockers)
{json.dumps(context['prereq_issues'][:8], indent=2) if context['prereq_issues'] else '  None detected'}

FACTOR 5 - HOW EARLY
- Completed UOC: {context['total_completed_uoc']}
- First year threshold: 54 UOC
- Is first year: {is_first_year}

SYSTEM RECOMMENDATION: {context['recommendation']}
CAN TRANSFER: {context['can_transfer']}"""

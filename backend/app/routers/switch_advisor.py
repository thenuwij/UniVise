# app/routers/switch_advisor.py
# AI-powered program switch advisor
# Takes the EXISTING /compare endpoint results and sends them to OpenAI for analysis
# Does NOT duplicate compare logic — receives comparison_data from frontend

import json
import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.models.switch_advisor import SwitchAdvisorRequest, SwitchAdvisorResponse
from app.llm.claude_client import ask_claude_async
from app.llm.json_parsing import extract_json
from app.core.database import supabase
from app.services.switch_advisor import build_context, build_system_prompt, build_user_prompt, safe_int

logger = logging.getLogger(__name__)

router = APIRouter()


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

        # ── [Transfer Debug] RAW INPUTS ──────────────────────────────
        # Logged immediately after DB fetches, before any calculation.
        _bdown_in = comparison.get("detailed_breakdown", {}) or {}
        _base_in = _bdown_in.get("base_program", {}) or {}
        _target_in = _bdown_in.get("target_program", {}) or {}
        _summary_in = comparison.get("summary", {}) or {}
        _transfer_in = comparison.get("transfer_analysis", {}) or {}
        _completed_uoc_in = (
            _summary_in.get("completed_uoc")
            or _transfer_in.get("completed_uoc")
            or 0
        )
        logger.info(f"[Transfer Debug] RAW INPUTS — user={request.user_id}")
        logger.info(
            f"[Transfer Debug] current: name='{_base_in.get('name','')}' "
            f"code={request.base_program_code} total_uoc={_base_in.get('total_uoc','')}"
        )
        logger.debug(f"[Transfer Debug] completed_uoc={_completed_uoc_in}")
        logger.info(
            f"[Transfer Debug] target: name='{_target_in.get('name','')}' "
            f"code={request.target_program_code} "
            f"summary.estimated_terms={_summary_in.get('estimated_terms','')}"
        )
        logger.info(
            f"[Transfer Debug] base_spec={request.base_specialisation_codes} "
            f"target_spec={request.target_specialisation_codes}"
        )
        logger.info(
            f"[Transfer Debug] personality_top_types={personality_data.get('top_types', [])}"
        )
        logger.info(
            f"[Transfer Debug] academic_year={survey_data.get('academic_year','')} "
            f"study_feelings={survey_data.get('study_feelings','')}"
        )
        logger.info(
            f"[Transfer Debug] interest_areas={survey_data.get('interest_areas', [])}"
        )

        context = build_context(comparison, personality_data, survey_data)

        # ── [Transfer Debug] CALCULATED VALUES ───────────────────────
        # Logged immediately after build_context() computes additional_terms
        # and base_terms_remaining. base_total_uoc isn't exposed in the
        # returned context dict, so recompute it locally from the breakdown.
        _base_total_uoc_calc = safe_int(_base_in.get("total_uoc") or 0)
        logger.info(
            f"[Transfer Debug] CALCULATED — base_total_uoc={_base_total_uoc_calc} "
            f"completed_uoc={context.get('total_completed_uoc', 0)} "
            f"transferred_uoc={context.get('transferred_uoc', 0)}"
        )
        logger.info(
            f"[Transfer Debug] base_terms_remaining={int(context.get('base_terms_remaining', 0))} (whole terms) "
            f"estimated_terms={int(context.get('estimated_terms', 0))} "
            f"additional_terms={int(context.get('additional_terms', 0))}"
        )
        logger.info(
            f"[Transfer Debug] estimated_completion='{context.get('estimated_completion','')}' "
            f"transfer_rate_courses={context.get('transfer_rate_courses', 0)}"
        )
        logger.info(
            f"[Transfer Debug] courses_transferred={context.get('transferred_count', 0)} "
            f"courses_lost={context.get('wasted_count', 0)}"
        )

        user_prompt = build_user_prompt(context)

        # ── [Transfer Debug] AI INPUT SUMMARY ────────────────────────
        # Logged immediately before the Claude call. The band thresholds
        # mirror the FACTOR 2 rules in build_system_prompt().
        _add_t = context.get("additional_terms", 0)
        if _add_t == 0:
            _band = "0 (no extra time)"
        elif _add_t <= 2:
            _band = "1-2 (manageable)"
        elif _add_t <= 6:
            _band = "3-6 (real cost)"
        else:
            _band = "6+ (only if essential)"
        logger.info(
            "[Transfer Debug] AI INPUT — verdict bands: "
            "recommended / conditional / not_recommended"
        )
        logger.info(f"[Transfer Debug] additional_terms band={_band}")
        logger.info(
            f"[Transfer Debug] system_prompt_chars={len(build_system_prompt())} "
            f"user_prompt_chars={len(user_prompt)}"
        )
        logger.info(
            f"[Eunice] user={request.user_id} "
            f"current='{context.get('base_program','')}' "
            f"target='{context.get('target_program','')}' "
            f"completed={context.get('total_completed_uoc', 0)}uoc "
            f"base_remaining={context.get('base_terms_remaining', 0)}t "
            f"target_needs={context.get('estimated_terms', 0)}t "
            f"additional={_add_t}t "
            f"completion='{context.get('estimated_completion','')}' "
            f"verdict_band={_band}"
        )

        response_text = await ask_claude_async(
            user_prompt,
            max_tokens=2000,
            model="claude-sonnet-4-6",
            system_prompt=build_system_prompt(),
        )

        result = extract_json(response_text)

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

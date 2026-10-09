# app/routers/switch_advisor.py
# AI-powered program switch advisor
# Takes the EXISTING /compare endpoint results and sends them to OpenAI for analysis
# Does NOT duplicate compare logic — receives comparison_data from frontend

import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.models.switch_advisor import SwitchAdvice, SwitchAdvisorRequest, SwitchAdvisorResponse
from app.llm.claude_client import ask_claude_structured
from app.core.database import supabase
from app.services.switch_advisor import build_context, build_system_prompt, build_user_prompt

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

        def fetch_survey():
            try:
                res = supabase.table("student_uni_data") \
                    .select("interest_areas, switching_pathway") \
                    .eq("user_id", str(user.id)) \
                    .maybe_single() \
                    .execute()
                return res.data or {}
            except Exception as e:
                logger.warning(f"[switch_advisor] fetch_survey failed for user {user.id}: {e}")
                return {}

        survey_data = await asyncio.to_thread(fetch_survey)
        context = build_context(comparison, survey_data)

        user_prompt = build_user_prompt(context)

        logger.info(
            f"[Eunice] user={user.id} "
            f"current='{context.get('base_program','')}' "
            f"target='{context.get('target_program','')}' "
            f"completed={context.get('total_completed_uoc', 0)}uoc "
            f"carried={context.get('transferred_uoc', 0)}uoc "
            f"extra={context.get('extra_uoc', 0)}uoc/{context.get('additional_terms', 0)}t "
            f"completion='{context.get('estimated_completion','')}'"
        )

        advice = await ask_claude_structured(
            user_prompt,
            SwitchAdvice,
            max_tokens=2000,
            temperature=None,
            model="claude-sonnet-5",
            system_prompt=build_system_prompt(),
            disable_thinking=True,
        )

        return SwitchAdvisorResponse(
            **advice.model_dump(),
            # Pass through timeline and transfer stats from context
            additional_terms=context.get("additional_terms", 0),
            estimated_completion=context.get("estimated_completion", ""),
            transfer_rate=context.get("transfer_rate_courses", 0),
            courses_transferred=context.get("transferred_count", 0),
            courses_lost=context.get("wasted_count", 0),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Switch advisor error: {e}")
        raise HTTPException(status_code=500, detail="Could not create the switch advice. Please try again.")

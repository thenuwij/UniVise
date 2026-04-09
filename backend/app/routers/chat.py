import logging

from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user

logger = logging.getLogger(__name__)
from .user import (
    get_user_info,
    get_student_type,
    get_user_recommendations,
    get_user_academic_analysis,
)
from app.utils.database import supabase
from app.utils.openai_client import ask_gpt_stream
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

MAX_HISTORY_MESSAGES = 20  # keep last 20 turns to avoid token bloat


def _build_system_prompt(student_type: str, user_info: dict, recommendations: list, academic_history: list) -> str:
    is_hs = student_type == "high_school"

    # Format user profile cleanly
    if is_hs:
        profile_lines = [
            f"- Year level: {user_info.get('year_level', 'unknown')}",
            f"- Target ATAR: {user_info.get('atar', 'not set')}",
            f"- Confidence level: {user_info.get('confidence_level', 'unknown')}",
            f"- Academic strengths: {', '.join(user_info.get('academic_strengths', [])) or 'not provided'}",
            f"- Career interests: {', '.join(user_info.get('career_interests', [])) or 'not provided'}",
            f"- Degree interests: {', '.join(user_info.get('degree_interests', [])) or 'not provided'}",
            f"- Hobbies: {', '.join(user_info.get('hobbies', [])) or 'not provided'}",
        ]
        rec_lines = [
            f"  - {r.get('degree_name', 'Unknown')} at {r.get('university_name', 'Unknown')} "
            f"(ATAR req: {r.get('atar_requirement', '?')}, suitability: {r.get('suitability_score', '?')})"
            for r in (recommendations or [])[:5]
        ]
        focus = (
            "Your focus areas: ATAR strategy, subject selection, university entry requirements, "
            "degree exploration, career pathways, and building confidence for the transition to university."
        )
        persona = "You are Eunice, a warm and knowledgeable university preparation advisor at UniVise."
    else:
        profile_lines = [
            f"- Degree field: {user_info.get('degree_field', 'unknown')}",
            f"- Degree stage: {user_info.get('degree_stage', 'unknown')}",
            f"- WAM: {user_info.get('wam', 'not provided')}",
            f"- Interest areas: {', '.join(user_info.get('interest_areas', [])) or 'not provided'}",
        ]
        rec_lines = [
            f"  - {r.get('career_title', 'Unknown')} in {r.get('industry', 'Unknown')} "
            f"(salary: {r.get('avg_salary_range', '?')}, education: {r.get('education_required', '?')})"
            for r in (recommendations or [])[:5]
        ]
        focus = (
            "Your focus areas: course selection, elective planning, internship and job opportunities, "
            "WAM improvement strategies, career path guidance, and making the most of university life."
        )
        persona = "You are Eunice, a sharp and supportive career and academic advisor at UniVise for UNSW students."

    academic_summary = ""
    if academic_history:
        try:
            analysis_text = academic_history[0].get("analysis", "") if isinstance(academic_history, list) else ""
            if analysis_text:
                academic_summary = f"\n## Academic Analysis\n{analysis_text[:800]}"
        except Exception:
            pass

    profile_block = "\n".join(profile_lines)
    rec_block = "\n".join(rec_lines) if rec_lines else "  - No recommendations available yet"

    return (
        f"{persona}\n\n"
        f"{focus}\n\n"
        f"## Student Profile\n{profile_block}\n\n"
        f"## Their Top Recommendations\n{rec_block}"
        f"{academic_summary}\n\n"
        "## How to respond\n"
        "- Speak like a trusted advisor in a one-on-one session — warm, direct, and genuinely helpful.\n"
        "- Keep replies focused and conversational. No long essays.\n"
        "- Use Markdown formatting (bold key points, bullet lists where helpful, short headings if needed).\n"
        "- Do NOT use emojis.\n"
        "- Ask one follow-up question when appropriate to keep the conversation going.\n"
        "- Reference the student's specific profile details and recommendations when relevant — make it personal.\n"
        "- If asked about something outside your scope (e.g., unrelated personal issues), gently redirect to academic/career topics."
    )


@router.post("/conversations/{conv_id}/reply/stream")
async def reply_to_conversation_stream(conv_id: str, user=Depends(get_current_user)):
    try:
        student_type = await get_student_type(user)
        user_info = await get_user_info(user, student_type)
        recommendations = await get_user_recommendations(user, student_type)
        academic_history = await get_user_academic_analysis(user, student_type)

        if not student_type or not user_info or not recommendations:
            raise HTTPException(status_code=401, detail="Invalid User")

        user_messages = (
            supabase.table("conversation_messages")
            .select("sender, content")
            .eq("conversation_id", conv_id)
            .order("created_at")
            .execute()
        )

        if not user_messages.data:
            raise HTTPException(status_code=500, detail="Invalid messages")

        rows = user_messages.data

        # Trim to last MAX_HISTORY_MESSAGES to keep token usage manageable
        rows = rows[-MAX_HISTORY_MESSAGES:]

        history = []
        for row in rows:
            role = "assistant" if row["sender"] == "bot" else "user"
            history.append({"role": role, "content": row["content"]})

        system_prompt = _build_system_prompt(student_type, user_info, recommendations, academic_history)

        token_stream = ask_gpt_stream(
            history,
            system_prompt,
            temperature=0.7,
            max_tokens=1500,
        )

        async def event_generator():
            full_response = ""
            try:
                async for token in token_stream:
                    full_response += token
                    if token:
                        yield token
                supabase.table("conversation_messages").insert(
                    {
                        "conversation_id": conv_id,
                        "sender": "bot",
                        "content": full_response,
                    }
                ).execute()
            except Exception as e:
                logger.error(f"[chat] Stream failed for conv {conv_id}, user {user.id}: {e}")
                yield "data: [STREAM_ERROR]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[chat] Endpoint failed for conv {conv_id}, user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Chat stream failed")

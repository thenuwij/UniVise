import logging

from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user

logger = logging.getLogger(__name__)
from app.services.user_profile import (
    get_user_info,
    get_student_type,
    get_user_recommendations,
)
from app.core.database import supabase
from app.llm.openai_client import ask_gpt_stream
from app.services.chat import build_system_prompt
from fastapi.responses import StreamingResponse

router = APIRouter()

MAX_HISTORY_MESSAGES = 20  # keep last 20 turns to avoid token bloat


@router.post("/conversations/{conv_id}/reply/stream")
async def reply_to_conversation_stream(conv_id: str, user=Depends(get_current_user)):
    try:
        conversation = (
            supabase.table("conversations")
            .select("id")
            .eq("id", conv_id)
            .eq("user_id", user.id)
            .limit(1)
            .execute()
        )
        if not conversation.data:
            raise HTTPException(status_code=404, detail="Conversation not found")

        student_type = await get_student_type(user)
        user_info = await get_user_info(user, student_type)
        recommendations = await get_user_recommendations(user, student_type)

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

        system_prompt = build_system_prompt(student_type, user_info, recommendations)

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

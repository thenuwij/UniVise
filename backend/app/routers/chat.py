from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from .user import (
    get_user_info,
    get_student_type,
    get_user_recommendations,
    get_user_academic_analysis,
)
from app.utils.database import supabase
from app.utils.openai_client import ask_chat_completion_stream
from fastapi.responses import StreamingResponse

router = APIRouter()


@router.post("/conversations/{conv_id}/reply/stream")
async def reply_to_conversation_stream(conv_id: str, user=Depends(get_current_user)):
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

    if not user_messages:
        raise HTTPException(status_code=500, detail="Invalid messages")

    rows = user_messages.data

    history = []
    for row in rows:
        role = "assistant" if row["sender"] == "bot" else "user"
        history.append({"role": role, "content": row["content"]})

    prompt = (
        f"You are a helpful expert career advisor.\n"
        f"Student Background: {user_info}"
        f"Student Recommendations: {recommendations}.\n"
        f"Academic History: {academic_history}"
        "Keep these details in mind when you respond. Make it conversational. I dont expect you to write long paragraphs but rather keep the conversation going. Active Listening."
    )

    # 1. Kick off the streaming API call
    stream = ask_chat_completion_stream(history, prompt)

    # 2. Define a generator that yields each token as it comes
    async def event_generator():
        full_response = ""
        for chunk in stream:
            # Safely read the `.content` attribute
            delta = chunk.choices[0].delta
            token = delta.content or ""
            full_response += token
            if token:  # only yield when there’s new text
                yield token
        # 3. Once done, persist the full bot message
        supabase.table("conversation_messages").insert(
            {
                "conversation_id": conv_id,
                "sender": "bot",
                "content": full_response,
            }
        ).execute()

    # 4. Return a text/event-stream so the browser can process it
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )

from fastapi import APIRouter, Request, Depends, HTTPException
from dependencies import get_current_user
from app.utils.database import supabase

import json
import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversations")
async def create_conversation(user=Depends(get_current_user)):
    """
    Create a new chatbot conversation.
    """
    resp = (
        await supabase.table("conversations")
        .insert(
            {
                "user_id": user.id,
                "created_at": datetime.datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )

    if not resp:
        raise HTTPException(status_code=500, detail="Failed to create conversation")

    conversation = resp.data[0]
    return {"conversation_id": conversation["id"]}


@router.get("/conversations")
async def get_conversations(user=Depends(get_current_user)):
    """
    Get all chatbot conversations for the user.
    """
    resp = (
        await supabase.table("conversations")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )

    if not resp:
        raise HTTPException(status_code=500, detail="Failed to fetch conversations")

    return resp.data


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str, user=Depends(get_current_user)
):
    """
    Get all messages in a specific conversation.
    """
    resp = (
        await supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not resp:
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

    return resp.data


@router.post("/conversations/{conversation_id}/messages")
async def add_message(
    conversation_id: str, request: Request, user=Depends(get_current_user)
):
    """
    Add a new message to a conversation.
    """
    data = await request.json()
    message = data.get("message")

    if not message:
        raise HTTPException(status_code=400, detail="Message content is required")

    resp = (
        await supabase.table("messages")
        .insert(
            {
                "conversation_id": conversation_id,
                "user_id": user.id,
                "content": message,
                "created_at": datetime.datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )

    if not resp:
        raise HTTPException(status_code=500, detail="Failed to add message")

    return {"message_id": resp.data[0]["id"], "content": message}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user=Depends(get_current_user)):
    """
    Delete a specific conversation.
    """
    resp = (
        await supabase.table("conversations")
        .delete()
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not resp:
        raise HTTPException(status_code=500, detail="Failed to delete conversation")

    return {"detail": "Conversation deleted successfully"}

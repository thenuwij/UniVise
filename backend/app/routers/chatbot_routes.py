from fastapi import APIRouter, Request, Depends, HTTPException
from app.dependencies import get_current_user
from app.utils.chatbot_service import generate_chatbot_reply
from app.utils.database import log_chatbot_session

router = APIRouter()

@router.post("/")
async def chat(request: Request, user=Depends(get_current_user)):
    try:
        body = await request.json()
        message = body.get("message")

        if not message:
            raise HTTPException(status_code=400, detail="Message required")

        reply = generate_chatbot_reply(message)
        log_chatbot_session(user.id, message, reply)

        return {"reply": reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Request, Depends, HTTPException
from dependencies import get_current_user
from app.utils.chatbot_service import generate_chatbot_reply
from app.utils.database import log_chatbot_session

router = APIRouter()

@router.post("/")
async def chat(request: Request, user=Depends(get_current_user)):
    try:
        body = await request.json()
        message = body.get("message")

        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        reply = generate_chatbot_reply(message)

        if not reply:
            raise HTTPException(status_code=500, detail="No response from chatbot")
        
        log_chatbot_session(user.id, message, reply)

        return {"reply": reply}
    
    except HTTPException:
        raise

    except Exception as e:
        print("Chatbot error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")
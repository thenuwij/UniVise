from app.utils.openai_client import ask_openai

def generate_chatbot_reply(message: str) -> str:
    return ask_openai(message)

import openai
from app.config import settings

client = openai.Client(api_key=settings.openai_api_key)

def ask_openai(message: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": message}
            ],
            max_tokens=500
        )
        reply = response.choices[0].message.content.strip()
        return reply

    except Exception as e:
        print("OpenAI API error:", e)
        return "Sorry, I couldn't process your request."

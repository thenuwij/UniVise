from openai import OpenAI
from app.config import OPENAI_API_KEY

openai = OpenAI(api_key=OPENAI_API_KEY)

def ask_openai(prompt: str) -> str:
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful and concise career advisor.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1000,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("OpenAI API error:", e)
        return "Sorry, I couldn't process your request."

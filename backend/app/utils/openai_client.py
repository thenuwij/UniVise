import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def ask_openai(prompt: str) -> str:
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

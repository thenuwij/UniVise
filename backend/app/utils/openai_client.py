import os
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict, Optional

load_dotenv()

openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
gemini = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)


def ask_openai(prompt: str) -> str:
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful expert career advisor.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=3000,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("OpenAI API error:", e)
        return "Sorry, I couldn't process your request."


def ask_gemini(prompt: str) -> str:
    try:
        response = gemini.chat.completions.create(
            model="gemini-2.5-flash-lite-preview-06-17",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful expert career advisor.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2048,
        )
        print(response.choices[0].message.content)
        return response.choices[0].message.content.strip()

    except Exception as e:
        print("Gemini API error:", e)
        return "Sorry could process Gemini request"


def ask_chat_completion_stream(
    history: List[Dict[str, str]],
    system_prompt: str,
    model: str = "gpt-4o-mini",
    temperature: float = 0.6,
    max_tokens: int = 500,
):
    messages = [{"role": "system", "content": system_prompt}] + history
    # ask OpenAI to stream
    return openai.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )

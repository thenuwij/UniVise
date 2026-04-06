import os
import anthropic
from typing import List, Dict, AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

if not os.getenv("ANTHROPIC_API_KEY"):
    raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")

_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
_async_client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

_MODEL = "claude-sonnet-4-6"
_SYSTEM = "You are a helpful expert career advisor."


def ask_openai(prompt: str, max_tokens: int = 3000) -> str:
    try:
        response = _client.messages.create(
            model=_MODEL,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            max_tokens=max_tokens,
        )
        return response.content[0].text.strip()
    except Exception as e:
        print("Claude API error (ask_openai):", e)
        return "Sorry, I couldn't process your request."


def ask_gemini(prompt: str) -> str:
    try:
        response = _client.messages.create(
            model=_MODEL,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            max_tokens=2048,
        )
        return response.content[0].text.strip()
    except Exception as e:
        print("Claude API error (ask_gemini):", e)
        return "Sorry, I couldn't process your request."


async def ask_chat_completion_stream(
    history: List[Dict[str, str]],
    system_prompt: str,
    model: str = _MODEL,
    temperature: float = 1,
    max_tokens: int = 500,
) -> AsyncGenerator[str, None]:
    async with _async_client.messages.stream(
        model=model,
        system=system_prompt,
        messages=history,
        temperature=temperature,
        max_tokens=max_tokens,
    ) as stream:
        async for text in stream.text_stream:
            yield text

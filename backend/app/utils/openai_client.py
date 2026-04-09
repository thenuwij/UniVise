import os
import openai
from typing import List, Dict, AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    raise RuntimeError("OPENAI_API_KEY environment variable is not set")

_openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_openai_async_client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

_GPT_MODEL = "gpt-4o-mini"
_GPT_SYSTEM = "You are a helpful expert career advisor."


def ask_gpt(prompt: str, max_tokens: int = 3000, system_prompt: str = _GPT_SYSTEM) -> str:
    """Sync GPT-4o mini call."""
    try:
        response = _openai_client.chat.completions.create(
            model=_GPT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("OpenAI API error (ask_gpt):", e)
        return "Sorry, I couldn't process your request."


async def ask_gpt_async(prompt: str, max_tokens: int = 3000, temperature: float = 1, system_prompt: str = _GPT_SYSTEM, model: str = _GPT_MODEL, reasoning_effort: str = None) -> str:
    """Async GPT call. Supports GPT-5.x reasoning_effort and max_completion_tokens."""
    try:
        # GPT-5.x models use max_completion_tokens, older models use max_tokens
        token_param = {"max_completion_tokens": max_tokens} if model.startswith("gpt-5") else {"max_tokens": max_tokens}
        # reasoning_effort is only supported on GPT-5.x models
        reasoning_param = {"reasoning_effort": reasoning_effort} if reasoning_effort and model.startswith("gpt-5") else {}
        response = await _openai_async_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            **token_param,
            **reasoning_param,
            temperature=temperature,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("OpenAI API error (ask_gpt_async):", e)
        return "Sorry, I couldn't process your request."


async def ask_gpt_stream(
    history: List[Dict[str, str]],
    system_prompt: str,
    max_tokens: int = 500,
    temperature: float = 1,
) -> AsyncGenerator[str, None]:
    """Async streaming GPT-4o mini call — mirrors ask_chat_completion_stream signature."""
    response = await _openai_async_client.chat.completions.create(
        model=_GPT_MODEL,
        messages=[{"role": "system", "content": system_prompt}] + history,
        max_tokens=max_tokens,
        temperature=temperature,
        stream=True,
    )
    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

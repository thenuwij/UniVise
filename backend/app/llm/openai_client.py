import logging
import os
import openai
from typing import List, Dict, AsyncGenerator, TypeVar
from dotenv import load_dotenv
from pydantic import BaseModel

logger = logging.getLogger(__name__)

load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    raise RuntimeError("OPENAI_API_KEY environment variable is not set")

_TIMEOUT_SECONDS = 60
_MAX_RETRIES = 2

_openai_client = openai.OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"), timeout=_TIMEOUT_SECONDS, max_retries=_MAX_RETRIES
)
_openai_async_client = openai.AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"), timeout=_TIMEOUT_SECONDS, max_retries=_MAX_RETRIES
)

_GPT_MODEL = "gpt-4o-mini"
_GPT_SYSTEM = "You are a helpful expert career advisor."

SchemaT = TypeVar("SchemaT", bound=BaseModel)


def ask_gpt(prompt: str, max_tokens: int = 3000, system_prompt: str = _GPT_SYSTEM) -> str:
    """Sync GPT-4o mini call."""
    try:
        response = _openai_client.chat.completions.create(
            model=_GPT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_completion_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI API error (ask_gpt): {e}")
        raise


async def ask_gpt_async(prompt: str, max_tokens: int = 3000, temperature: float = 1, system_prompt: str = _GPT_SYSTEM, model: str = _GPT_MODEL, reasoning_effort: str = None) -> str:
    """Async GPT call. Supports GPT-5.x reasoning_effort."""
    try:
        # reasoning_effort is only supported on GPT-5.x models
        reasoning_param = {"reasoning_effort": reasoning_effort} if reasoning_effort and model.startswith("gpt-5") else {}
        response = await _openai_async_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_completion_tokens=max_tokens,
            **reasoning_param,
            temperature=temperature,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI API error (ask_gpt_async): {e}")
        raise


async def ask_gpt_structured(
    prompt: str,
    schema: type[SchemaT],
    max_tokens: int = 3000,
    temperature: float = 0.3,
    system_prompt: str = _GPT_SYSTEM,
    model: str = _GPT_MODEL,
) -> SchemaT:
    """Async GPT call whose reply is constrained to and validated against a Pydantic schema."""
    try:
        response = await _openai_async_client.chat.completions.parse(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            response_format=schema,
            max_completion_tokens=max_tokens,
            temperature=temperature,
        )
    except Exception as e:
        logger.error(f"OpenAI API error (ask_gpt_structured): {e}")
        raise
    choice = response.choices[0]
    if choice.message.parsed is None:
        raise ValueError(f"OpenAI returned no structured output (finish_reason={choice.finish_reason})")
    return choice.message.parsed


async def ask_gpt_stream(
    history: List[Dict[str, str]],
    system_prompt: str,
    max_tokens: int = 500,
    temperature: float = 1,
) -> AsyncGenerator[str, None]:
    """Async streaming GPT-4o mini call."""
    response = await _openai_async_client.chat.completions.create(
        model=_GPT_MODEL,
        messages=[{"role": "system", "content": system_prompt}] + history,
        max_completion_tokens=max_tokens,
        temperature=temperature,
        stream=True,
    )
    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

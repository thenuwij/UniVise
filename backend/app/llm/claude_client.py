import logging
import os
from typing import Optional, TypeVar
import anthropic
from dotenv import load_dotenv
from pydantic import BaseModel

logger = logging.getLogger(__name__)

load_dotenv()

if not os.getenv("ANTHROPIC_API_KEY"):
    raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")

_TIMEOUT_SECONDS = 60
_MAX_RETRIES = 2

_async_client = anthropic.AsyncAnthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY"), timeout=_TIMEOUT_SECONDS, max_retries=_MAX_RETRIES
)

_MODEL = "claude-sonnet-4-6"
_SYSTEM = "You are a helpful expert career advisor."

SchemaT = TypeVar("SchemaT", bound=BaseModel)


async def ask_claude_structured(
    prompt: str,
    schema: type[SchemaT],
    max_tokens: int = 3000,
    temperature: Optional[float] = 0.3,
    model: str = _MODEL,
    system_prompt: str = _SYSTEM,
    disable_thinking: bool = False,
) -> SchemaT:
    """Async Claude call whose reply is constrained to and validated against a Pydantic schema.

    Pass temperature=None for models that reject it (Claude 5 family), and
    disable_thinking=True for models that think by default (Sonnet 5) when
    thinking would only spend the max_tokens budget.
    """
    temperature_param = {"temperature": temperature} if temperature is not None else {}
    thinking_param = {"thinking": {"type": "disabled"}} if disable_thinking else {}
    try:
        response = await _async_client.messages.parse(
            model=model,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
            output_format=schema,
            max_tokens=max_tokens,
            **temperature_param,
            **thinking_param,
        )
    except Exception as e:
        logger.error(f"Claude API error (ask_claude_structured): {e}")
        raise
    if response.parsed_output is None:
        raise ValueError(f"Claude returned no structured output (stop_reason={response.stop_reason})")
    return response.parsed_output


async def read_web_pages(prompt: str, page_count: int, model: str, max_tokens: int = 24000, page_tokens: int = 20000) -> str:
    """Claude call that may open up to page_count of the URLs named in the prompt with web fetch; returns its text reply."""
    messages = [{"role": "user", "content": prompt}]
    tools = [{"type": "web_fetch_20250910", "name": "web_fetch", "max_uses": page_count, "max_content_tokens": page_tokens}]
    client = _async_client.with_options(timeout=90, max_retries=0)
    try:
        for _ in range(3):
            async with client.messages.stream(model=model, max_tokens=max_tokens, messages=messages, tools=tools) as stream:
                response = await stream.get_final_message()
            if response.stop_reason != "pause_turn":
                break
            messages = [{"role": "user", "content": prompt}, {"role": "assistant", "content": response.content}]
    except Exception as e:
        logger.error(f"Claude API error (read_web_pages): {e}")
        raise
    return "".join(block.text for block in response.content if block.type == "text")


async def ask_claude_text(prompt: str, model: str, max_tokens: int = 4000, effort: str = "low") -> str:
    """Plain Claude call for models that take an effort level instead of temperature (Claude 5 family)."""
    try:
        response = await _async_client.messages.create(
            model=model,
            max_tokens=max_tokens,
            output_config={"effort": effort},
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        logger.error(f"Claude API error (ask_claude_text): {e}")
        raise
    if response.stop_reason == "refusal":
        raise ValueError("Claude declined the request")
    return "".join(block.text for block in response.content if block.type == "text")

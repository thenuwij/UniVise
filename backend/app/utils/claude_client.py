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


async def ask_claude_async(prompt: str, max_tokens: int = 3000, temperature: float = 1, model: str = _MODEL) -> str:
    """Non-blocking async Claude call — use inside async route handlers and background tasks."""
    try:
        response = await _async_client.messages.create(
            model=model,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.content[0].text.strip()
    except Exception as e:
        print("Claude API error (ask_claude_async):", e)
        raise


_WEB_SEARCH_TOOL = {"type": "web_search_20250305", "name": "web_search"}


def _extract_last_text(content) -> str:
    """Return the last text block — safe when web_search adds tool_use blocks."""
    last_text = None
    for block in content:
        if getattr(block, "type", None) == "text":
            last_text = block.text
    if last_text is None:
        raise ValueError("No text block found in Claude response content")
    return last_text.strip()


async def ask_claude_async_with_search(prompt: str, max_tokens: int = 3000, temperature: float = 1) -> str:
    """Async Claude call with web search enabled."""
    try:
        response = await _async_client.messages.create(
            model=_MODEL,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
            tools=[_WEB_SEARCH_TOOL],
        )
        return _extract_last_text(response.content)
    except Exception as e:
        print("Claude API error (ask_claude_async_with_search):", e)
        raise


def ask_claude_with_search(prompt: str, max_tokens: int = 3000) -> str:
    """Sync Claude call with web search enabled."""
    try:
        response = _client.messages.create(
            model=_MODEL,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            max_tokens=max_tokens,
            tools=[_WEB_SEARCH_TOOL],
        )
        return _extract_last_text(response.content)
    except Exception as e:
        print("Claude API error (ask_claude_with_search):", e)
        return "Sorry, I couldn't process your request."


def ask_claude(prompt: str, max_tokens: int = 3000, model: str = _MODEL) -> str:
    """Sync Claude call."""
    try:
        response = _client.messages.create(
            model=model,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            max_tokens=max_tokens,
        )
        return response.content[0].text.strip()
    except Exception as e:
        print("Claude API error (ask_claude):", e)
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



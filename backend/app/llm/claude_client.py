import logging
import os
import anthropic
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

if not os.getenv("ANTHROPIC_API_KEY"):
    raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")

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
        logger.error(f"Claude API error (ask_claude_async): {e}")
        raise

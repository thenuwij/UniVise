import logging
import os
import openai
from typing import List, Dict, AsyncGenerator, Awaitable, Callable, TypeVar
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


def ask_gpt(prompt: str, max_tokens: int = 3000, temperature: float = 1, system_prompt: str = _GPT_SYSTEM, model: str = _GPT_MODEL) -> str:
    """Sync GPT call, for sync route handlers that FastAPI runs in a worker thread."""
    try:
        response = _openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_completion_tokens=max_tokens,
            temperature=temperature,
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


async def ask_gpt_web_search(
    prompt: str,
    schema: type[SchemaT],
    allowed_domains: List[str] | None,
    search_context_size: str = "medium",
    max_tokens: int = 3000,
    system_prompt: str = _GPT_SYSTEM,
    model: str = _GPT_MODEL,
) -> tuple[SchemaT, List[str]]:
    """Structured GPT call that may search the web, limited to allowed_domains when given.

    Returns the parsed reply and the URLs of every page the search returned.
    """
    tool = {
        "type": "web_search",
        "user_location": {"type": "approximate", "country": "AU", "city": "Sydney", "region": "New South Wales"},
        "search_context_size": search_context_size,
    }
    if allowed_domains:
        tool["filters"] = {"allowed_domains": allowed_domains}
    try:
        response = await _openai_async_client.responses.parse(
            model=model,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            tools=[tool],
            include=["web_search_call.action.sources"],
            text_format=schema,
            max_output_tokens=max_tokens,
        )
    except Exception as e:
        logger.error(f"OpenAI API error (ask_gpt_web_search): {e}")
        raise
    if response.output_parsed is None:
        raise ValueError("OpenAI returned no structured output (ask_gpt_web_search)")
    sources = [
        source.url
        for item in response.output
        if item.type == "web_search_call"
        for source in (getattr(item.action, "sources", None) or [])
        if getattr(source, "url", None)
    ]
    return response.output_parsed, sources


async def ask_gpt_stream_with_tools(
    history: List[Dict[str, str]],
    system_prompt: str,
    tools: list,
    run_tool: Callable[[str, str], Awaitable[str]],
    max_tokens: int = 1500,
    temperature: float = 1,
    model: str = _GPT_MODEL,
    max_rounds: int = 4,
) -> AsyncGenerator[str, None]:
    """Streaming GPT call that can look things up with tools before or while answering.

    Text streams out as it arrives. When the model asks for tools, run_tool(name, arguments)
    supplies each result and the model continues. After max_rounds of tools it must answer.
    """
    messages = [{"role": "system", "content": system_prompt}] + list(history)
    for round_number in range(max_rounds + 1):
        tool_param = {"tools": tools} if round_number < max_rounds else {}
        response = await _openai_async_client.chat.completions.create(
            model=model,
            messages=messages,
            max_completion_tokens=max_tokens,
            temperature=temperature,
            stream=True,
            **tool_param,
        )
        text = ""
        calls: dict = {}
        async for chunk in response:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta.content:
                text += delta.content
                yield delta.content
            for call in delta.tool_calls or []:
                slot = calls.setdefault(call.index, {"id": "", "name": "", "arguments": ""})
                if call.id:
                    slot["id"] = call.id
                if call.function and call.function.name:
                    slot["name"] += call.function.name
                if call.function and call.function.arguments:
                    slot["arguments"] += call.function.arguments
        if not calls:
            return
        ordered = [calls[i] for i in sorted(calls)]
        messages.append({
            "role": "assistant",
            "content": text or None,
            "tool_calls": [
                {"id": c["id"], "type": "function", "function": {"name": c["name"], "arguments": c["arguments"]}}
                for c in ordered
            ],
        })
        for c in ordered:
            messages.append({"role": "tool", "tool_call_id": c["id"], "content": await run_tool(c["name"], c["arguments"])})

from typing import List
import logging
import os
from typing import Optional, TypeVar
import anthropic
from dotenv import load_dotenv
from pydantic import BaseModel

logger = logging.getLogger(__name__)

load_dotenv()

_TIMEOUT_SECONDS = 60
_MAX_RETRIES = 2
_ANTHROPIC_AUDIENCE = "https://api.anthropic.com"


def _aws_identity_token() -> str:
    """Short-lived AWS-signed token that proves this is the UniVise Lambda role."""
    import boto3  # only needed on AWS, where the image installs it

    sts = boto3.client("sts", region_name=os.getenv("AWS_REGION", "ap-southeast-2"))
    response = sts.get_web_identity_token(
        Audience=[_ANTHROPIC_AUDIENCE], SigningAlgorithm="RS256", DurationSeconds=900
    )
    return response["WebIdentityToken"]


def _auth_kwargs() -> dict:
    """Workload identity federation on AWS (no stored key), the API key everywhere else."""
    if os.getenv("ANTHROPIC_FEDERATION_RULE_ID"):
        return {
            "credentials": anthropic.WorkloadIdentityCredentials(
                identity_token_provider=_aws_identity_token,
                federation_rule_id=os.environ["ANTHROPIC_FEDERATION_RULE_ID"],
                organization_id=os.environ["ANTHROPIC_ORGANIZATION_ID"],
                service_account_id=os.environ["ANTHROPIC_SERVICE_ACCOUNT_ID"],
                workspace_id=os.getenv("ANTHROPIC_WORKSPACE_ID"),
            )
        }
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise RuntimeError("Set ANTHROPIC_API_KEY, or the ANTHROPIC_FEDERATION_* variables on AWS")
    return {"api_key": os.getenv("ANTHROPIC_API_KEY")}


_async_client = anthropic.AsyncAnthropic(**_auth_kwargs(), timeout=_TIMEOUT_SECONDS, max_retries=_MAX_RETRIES)

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


async def ask_claude_web_search(prompt: str, model: str, effort: str = "low", max_uses: int = 5, max_tokens: int = 8000, timeout: float = 100) -> tuple[str, List[str]]:
    """Claude call that may search the web. Returns its text reply and the URLs of every page the search returned."""
    messages = [{"role": "user", "content": prompt}]
    tools = [{"type": "web_search_20250305", "name": "web_search", "max_uses": max_uses}]
    client = _async_client.with_options(timeout=timeout, max_retries=0)
    sources: List[str] = []
    try:
        for _ in range(4):
            async with client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                output_config={"effort": effort},
                messages=messages,
                tools=tools,
            ) as stream:
                response = await stream.get_final_message()
            for block in response.content:
                if block.type == "web_search_tool_result" and isinstance(block.content, list):
                    sources += [result.url for result in block.content if getattr(result, "url", None)]
            if response.stop_reason != "pause_turn":
                break
            messages = [messages[0], {"role": "assistant", "content": response.content}]
    except Exception as e:
        logger.error(f"Claude API error (ask_claude_web_search): {e}")
        raise
    if response.stop_reason == "refusal":
        raise ValueError("Claude declined the request")
    logger.info(f"[claude_web_search] {model}: {response.usage.input_tokens} in, {response.usage.output_tokens} out, {len(sources)} pages")
    return "".join(block.text for block in response.content if block.type == "text"), sources

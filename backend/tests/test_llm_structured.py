"""Tests for the structured-output helpers in the LLM clients.

The SDK clients are replaced with fakes, so no network call is made.
"""
import asyncio
from types import SimpleNamespace

import pytest
from pydantic import BaseModel

from app.llm import claude_client, openai_client


class City(BaseModel):
    name: str
    country: str


SYDNEY = City(name="Sydney", country="Australia")


class FakeParser:
    def __init__(self, response):
        self.response = response
        self.kwargs = None

    async def parse(self, **kwargs):
        self.kwargs = kwargs
        return self.response


def fake_openai(monkeypatch, parsed, finish_reason="stop"):
    choice = SimpleNamespace(message=SimpleNamespace(parsed=parsed), finish_reason=finish_reason)
    parser = FakeParser(SimpleNamespace(choices=[choice]))
    client = SimpleNamespace(chat=SimpleNamespace(completions=parser))
    monkeypatch.setattr(openai_client, "_openai_async_client", client)
    return parser


def fake_claude(monkeypatch, parsed_output, stop_reason="end_turn"):
    parser = FakeParser(SimpleNamespace(parsed_output=parsed_output, stop_reason=stop_reason))
    monkeypatch.setattr(claude_client, "_async_client", SimpleNamespace(messages=parser))
    return parser


def test_gpt_structured_returns_parsed_model_and_sends_schema(monkeypatch):
    parser = fake_openai(monkeypatch, SYDNEY)

    result = asyncio.run(openai_client.ask_gpt_structured("Name a city", City, model="gpt-5.4-mini"))

    assert result == SYDNEY
    assert parser.kwargs["response_format"] is City
    assert parser.kwargs["model"] == "gpt-5.4-mini"
    assert parser.kwargs["temperature"] == 0.3


def test_gpt_structured_raises_when_no_parsed_output(monkeypatch):
    fake_openai(monkeypatch, None, finish_reason="content_filter")

    with pytest.raises(ValueError, match="content_filter"):
        asyncio.run(openai_client.ask_gpt_structured("Name a city", City))


def test_claude_structured_returns_parsed_model_and_sends_schema(monkeypatch):
    parser = fake_claude(monkeypatch, SYDNEY)

    result = asyncio.run(claude_client.ask_claude_structured("Name a city", City))

    assert result == SYDNEY
    assert parser.kwargs["output_format"] is City
    assert parser.kwargs["temperature"] == 0.3


def test_claude_structured_omits_temperature_when_none(monkeypatch):
    parser = fake_claude(monkeypatch, SYDNEY)

    asyncio.run(claude_client.ask_claude_structured("Name a city", City, temperature=None))

    assert "temperature" not in parser.kwargs


def test_claude_structured_sends_thinking_only_when_disabled(monkeypatch):
    parser = fake_claude(monkeypatch, SYDNEY)

    asyncio.run(claude_client.ask_claude_structured("Name a city", City))
    assert "thinking" not in parser.kwargs

    asyncio.run(claude_client.ask_claude_structured("Name a city", City, disable_thinking=True))
    assert parser.kwargs["thinking"] == {"type": "disabled"}


def test_claude_structured_raises_when_no_parsed_output(monkeypatch):
    fake_claude(monkeypatch, None, stop_reason="max_tokens")

    with pytest.raises(ValueError, match="max_tokens"):
        asyncio.run(claude_client.ask_claude_structured("Name a city", City))

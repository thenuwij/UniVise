"""Tests for the streaming GPT helper used by chat.

The SDK client is replaced with a fake, so no network call is made.
"""
import asyncio
from types import SimpleNamespace

from app.llm import openai_client


def test_gpt_stream_yields_tokens_from_the_chosen_model(monkeypatch):
    class Stream:
        def __init__(self, tokens):
            self.tokens = iter(tokens)

        def __aiter__(self):
            return self

        async def __anext__(self):
            try:
                token = next(self.tokens)
            except StopIteration:
                raise StopAsyncIteration
            return SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content=token))])

    sent = {}

    async def create(**kwargs):
        sent.update(kwargs)
        return Stream(["Hel", None, "lo"])

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    monkeypatch.setattr(openai_client, "_openai_async_client", client)

    async def collect():
        return [token async for token in openai_client.ask_gpt_stream([], "system", model="gpt-5.4-mini")]

    assert asyncio.run(collect()) == ["Hel", "lo"]
    assert sent["model"] == "gpt-5.4-mini"
    assert sent["stream"] is True

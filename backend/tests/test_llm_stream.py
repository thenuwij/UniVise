"""Tests for the streaming GPT helper Eunice uses, with handbook tools.

The SDK client is replaced with a fake, so no network call is made. These
check plain text streaming, one tool round, and that tools are dropped on
the final round so the model has to answer.
"""
import asyncio
from types import SimpleNamespace

from app.llm import openai_client


def text_chunk(token):
    return SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content=token, tool_calls=None))])


def tool_chunk(index, call_id=None, name=None, arguments=None):
    call = SimpleNamespace(index=index, id=call_id, function=SimpleNamespace(name=name, arguments=arguments))
    return SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content=None, tool_calls=[call]))])


class Stream:
    def __init__(self, chunks):
        self.chunks = iter(chunks)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self.chunks)
        except StopIteration:
            raise StopAsyncIteration


def fake_client(monkeypatch, rounds):
    sent = []
    replies = iter(rounds)

    async def create(**kwargs):
        sent.append({**kwargs, "messages": list(kwargs["messages"])})
        return Stream(next(replies))

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    monkeypatch.setattr(openai_client, "_openai_async_client", client)
    return sent


def collect(run_tool, max_rounds=4):
    async def go():
        stream = openai_client.ask_gpt_stream_with_tools(
            [{"role": "user", "content": "Can I take COMP3231?"}], "system", [{"type": "function"}], run_tool, model="gpt-5.4-mini", max_rounds=max_rounds
        )
        return [token async for token in stream]

    return asyncio.run(go())


def test_plain_reply_streams_without_tools(monkeypatch):
    sent = fake_client(monkeypatch, [[text_chunk("Hel"), text_chunk(None), text_chunk("lo")]])

    async def run_tool(name, arguments):
        raise AssertionError("no tool should run")

    assert collect(run_tool) == ["Hel", "lo"]
    assert sent[0]["model"] == "gpt-5.4-mini"
    assert sent[0]["stream"] is True
    assert sent[0]["tools"] == [{"type": "function"}]


def test_tool_call_runs_then_model_answers(monkeypatch):
    sent = fake_client(monkeypatch, [
        [tool_chunk(0, "call-1", "check_prereq", '{"code":'), tool_chunk(0, None, "uisites", '"COMP3231"}')],
        [text_chunk("Yes, "), text_chunk("you can.")],
    ])
    calls = []

    async def run_tool(name, arguments):
        calls.append((name, arguments))
        return '{"prerequisites_met": true}'

    assert collect(run_tool) == ["Yes, ", "you can."]
    assert calls == [("check_prerequisites", '{"code":"COMP3231"}')]
    follow_up = sent[1]["messages"]
    assert follow_up[-2]["tool_calls"][0]["id"] == "call-1"
    assert follow_up[-1] == {"role": "tool", "tool_call_id": "call-1", "content": '{"prerequisites_met": true}'}


def test_last_round_drops_tools_so_the_model_must_answer(monkeypatch):
    sent = fake_client(monkeypatch, [
        [tool_chunk(0, "call-1", "get_course", '{"code":"COMP3231"}')],
        [text_chunk("Operating Systems is offered in Term 2.")],
    ])

    async def run_tool(name, arguments):
        return "{}"

    assert collect(run_tool, max_rounds=1) == ["Operating Systems is offered in Term 2."]
    assert "tools" in sent[0]
    assert "tools" not in sent[1]

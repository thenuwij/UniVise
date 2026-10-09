"""Tests for the Eunice reply stream.

Supabase and the AI stream are faked; these check that a broken stream ends
with the plain error marker and saves nothing, and that a finished reply is
saved once.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import chat

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")
MESSAGES = [{"sender": "user", "content": "Which electives should I take?"}]


class Table:
    def __init__(self, name, inserts):
        self.name = name
        self.inserts = inserts

    def select(self, *args):
        return self

    def eq(self, *args):
        return self

    def order(self, *args):
        return self

    def limit(self, *args):
        return self

    def insert(self, row):
        self.inserts.append(row)
        return self

    def execute(self):
        if self.name == "conversations":
            return SimpleNamespace(data=[{"id": "conv-1"}])
        return SimpleNamespace(data=MESSAGES)


@pytest.fixture
def inserts(monkeypatch):
    saved = []

    async def student_type(user):
        return "university"

    async def user_info(user, student_type):
        return {"degree_field": "Bachelor of Computer Science"}

    async def recommendations(user, student_type):
        return []

    async def summary(user_id):
        return None

    monkeypatch.setattr(chat, "supabase", SimpleNamespace(table=lambda name: Table(name, saved)))
    monkeypatch.setattr(chat, "get_student_type", student_type)
    monkeypatch.setattr(chat, "get_user_info", user_info)
    monkeypatch.setattr(chat, "get_user_recommendations", recommendations)
    monkeypatch.setattr(chat, "safe_student_summary", summary)
    app.dependency_overrides[get_current_user] = lambda: USER
    yield saved
    app.dependency_overrides.clear()


def stream_of(tokens, fail=False):
    async def stream(*args, **kwargs):
        for token in tokens:
            yield token
        if fail:
            raise ConnectionError("upstream closed")

    return stream


def test_broken_stream_ends_with_marker_and_saves_nothing(inserts, monkeypatch):
    monkeypatch.setattr(chat, "ask_gpt_stream_with_tools", stream_of(["Take ", "COMP2521"], fail=True))

    response = TestClient(app).post("/chat/conversations/conv-1/reply/stream")

    assert response.text == "Take COMP2521" + chat.STREAM_ERROR_MARKER
    assert inserts == []


def test_finished_reply_is_saved(inserts, monkeypatch):
    monkeypatch.setattr(chat, "ask_gpt_stream_with_tools", stream_of(["Take ", "COMP2521"]))

    response = TestClient(app).post("/chat/conversations/conv-1/reply/stream")

    assert response.text == "Take COMP2521"
    assert inserts == [{"conversation_id": "conv-1", "sender": "bot", "content": "Take COMP2521"}]

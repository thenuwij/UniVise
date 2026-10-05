"""Tests for the Switch Degree advisor endpoint.

Supabase and the AI call are faked; these check that the verdict is limited
to the allowed values and that the AI advice is merged with the computed
transfer figures.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.auth import get_current_user
from app.main import app
from app.models.switch_advisor import SwitchAdvice
from app.routers import switch_advisor

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")

ADVICE = {
    "verdict": "conditional",
    "verdict_label": "Worth Weighing",
    "summary": "Most of your courses transfer. The switch adds one term.",
    "key_insights": ["Insight one.", "Insight two.", "Insight three."],
    "pros": ["Better fit", "Most credit transfers", "Clear pathway"],
    "cons": ["One extra term", "New prerequisites", "Timetable change"],
    "action_steps": ["Book an advisor", "Check prerequisites", "Apply by week 5"],
    "detailed_analysis": "The cost is small. The fit is strong.",
}


def test_rejects_a_verdict_label_outside_the_allowed_list():
    with pytest.raises(ValidationError):
        SwitchAdvice.model_validate({**ADVICE, "verdict_label": "Maybe"})


class EmptyTable:
    def select(self, *args):
        return self

    def eq(self, *args):
        return self

    def maybe_single(self):
        return self

    def execute(self):
        return SimpleNamespace(data=None)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(switch_advisor, "supabase", SimpleNamespace(table=lambda name: EmptyTable()))
    app.dependency_overrides[get_current_user] = lambda: USER
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


REQUEST = {
    "base_program_code": "3502",
    "target_program_code": "3778",
    "comparison_data": {},
}


def test_merges_ai_advice_with_transfer_figures(client, monkeypatch):
    async def reply(prompt, schema, **kwargs):
        assert schema is SwitchAdvice
        return SwitchAdvice.model_validate(ADVICE)

    monkeypatch.setattr(switch_advisor, "ask_claude_structured", reply)

    response = client.post("/switch-advisor", json=REQUEST)

    assert response.status_code == 200
    body = response.json()
    assert {key: body[key] for key in ADVICE} == ADVICE
    assert {"additional_terms", "estimated_completion", "transfer_rate", "courses_transferred", "courses_lost"} <= body.keys()


def test_returns_500_when_ai_reply_is_unusable(client, monkeypatch):
    async def ai_down(*args, **kwargs):
        raise ValueError("Claude returned no structured output (stop_reason=max_tokens)")

    monkeypatch.setattr(switch_advisor, "ask_claude_structured", ai_down)

    response = client.post("/switch-advisor", json=REQUEST)

    assert response.status_code == 500
    assert response.json() == {"detail": "Could not create the switch advice. Please try again."}

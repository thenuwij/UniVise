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


COMPARISON = {
    "summary": {
        "completed_courses_count": 13, "completed_uoc": 78, "courses_transfer": 11, "uoc_transfer": 66,
        "courses_needed": 21, "uoc_needed": 126, "base_uoc_left": 114, "extra_uoc": 12,
        "estimated_terms": 7, "base_terms_remaining": 7, "extra_terms": 0, "estimated_completion": "Term 1, 2029",
    },
    "transfer_analysis": {
        "transferred_count": 11, "transferred_uoc": 66, "transferred_courses": [{"code": "COMP1511"}],
        "free_pool": {"uoc": 6, "used_uoc": 6, "fits_count": 1, "candidates": [{"code": "ARTS1000"}, {"code": "ARTS1001"}]},
        "wasted_courses": [{"code": "PSYC1001"}],
        "still_to_do": [{"title": "Level 3 Core", "type": "core", "left": ["ELEC3115"], "choices": []}],
    },
    "detailed_breakdown": {
        "base_program": {"name": "Computer Science", "faculty": "Engineering", "total_uoc": 192},
        "target_program": {"name": "Electrical Engineering", "faculty": "Engineering", "total_uoc": 192},
    },
}


def test_context_passes_compare_numbers_through_unchanged():
    from app.services.switch_advisor import build_context

    context = build_context(COMPARISON, {"academic_year": "3"})

    assert (context["extra_uoc"], context["additional_terms"], context["remaining_uoc"], context["base_uoc_left"]) == (12, 0, 126, 114)
    assert context["remaining_courses_count"] == 21
    assert context["wasted_count"] == 2
    assert "academic_year" not in context


def test_prompt_has_no_year_or_personality_and_shows_extra_uoc():
    from app.services.switch_advisor import build_context, build_user_prompt

    prompt = build_user_prompt(build_context(COMPARISON, {"academic_year": "3"}))

    assert "extra_uoc: 12" in prompt
    assert "78 of 192 UOC" in prompt
    assert "1 of these fit in 6 UOC" in prompt
    assert "year" not in prompt.lower() and "personality" not in prompt.lower()


def test_empty_comparison_still_builds_a_prompt():
    from app.services.switch_advisor import build_context, build_user_prompt

    assert "Nothing listed" in build_user_prompt(build_context({}))

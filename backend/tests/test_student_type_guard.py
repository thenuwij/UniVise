"""Tests for the university-only guard.

The high-school flow is closed: its student type is refused before any
database or AI work.
"""
import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services import user_profile
from app.services.user_profile import UNIVERSITY_ONLY, get_student_type


def user_with_type(student_type):
    return SimpleNamespace(
        id="00000000-0000-0000-0000-000000000001",
        user_metadata={"student_type": student_type},
    )


def test_university_student_type_is_allowed():
    assert asyncio.run(get_student_type(user_with_type("university"))) == "university"


def test_high_school_student_type_is_refused():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_student_type(user_with_type("high_school")))

    assert exc.value.status_code == 403
    assert exc.value.detail == UNIVERSITY_ONLY


def test_missing_student_type_is_still_a_bad_request(monkeypatch):
    monkeypatch.setattr(user_profile, "stored_student_type", lambda user_id: None)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_student_type(user_with_type(None)))

    assert exc.value.status_code == 400


def test_token_from_before_the_survey_uses_the_account_student_type(monkeypatch):
    looked_up = []

    def stored(user_id):
        looked_up.append(user_id)
        return "university"

    monkeypatch.setattr(user_profile, "stored_student_type", stored)

    assert asyncio.run(get_student_type(user_with_type(None))) == "university"
    assert looked_up == ["00000000-0000-0000-0000-000000000001"]


def test_student_type_in_the_token_skips_the_account_lookup(monkeypatch):
    def fail_if_called(user_id):
        raise AssertionError("no lookup needed")

    monkeypatch.setattr(user_profile, "stored_student_type", fail_if_called)

    assert asyncio.run(get_student_type(user_with_type("university"))) == "university"


def test_high_school_account_found_by_lookup_is_still_refused(monkeypatch):
    monkeypatch.setattr(user_profile, "stored_student_type", lambda user_id: "high_school")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_student_type(user_with_type(None)))

    assert exc.value.status_code == 403


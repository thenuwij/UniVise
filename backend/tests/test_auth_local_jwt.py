"""Tests for checking the Supabase login token locally.

A signing key is generated here and Supabase is faked; these check a valid
token is accepted without calling Supabase, an expired one is rejected, and
anything that cannot be checked locally falls back to Supabase.
"""
import asyncio
import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException

from app.core import auth

PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())


def token(**overrides):
    claims = {
        "sub": "user-1",
        "email": "student@example.com",
        "aud": "authenticated",
        "iss": auth.AUTH_ISSUER,
        "exp": int(time.time()) + 600,
        "user_metadata": {"student_type": "university"},
        **overrides,
    }
    return jwt.encode(claims, PRIVATE_KEY, algorithm="ES256", headers={"kid": "test-key"})


def check(raw):
    return asyncio.run(auth.get_current_user(SimpleNamespace(credentials=raw)))


@pytest.fixture(autouse=True)
def fake_keys(monkeypatch):
    key = SimpleNamespace(key=PRIVATE_KEY.public_key())
    monkeypatch.setattr(auth, "signing_keys", SimpleNamespace(get_signing_key_from_jwt=lambda raw: key))
    calls = []

    def get_user(raw):
        calls.append(raw)
        return SimpleNamespace(user=SimpleNamespace(id="from-supabase"))

    monkeypatch.setattr(auth, "supabase", SimpleNamespace(auth=SimpleNamespace(get_user=get_user)))
    return calls


def test_valid_token_is_checked_without_supabase(fake_keys):
    user = check(token())

    assert user.id == "user-1"
    assert user.email == "student@example.com"
    assert user.user_metadata == {"student_type": "university"}
    assert fake_keys == []


def test_expired_token_is_rejected(fake_keys):
    with pytest.raises(HTTPException) as error:
        check(token(exp=int(time.time()) - 10))

    assert error.value.status_code == 401
    assert fake_keys == []


def test_token_that_cannot_be_checked_locally_falls_back_to_supabase(fake_keys):
    user = check(token(aud="something-else"))

    assert user.id == "from-supabase"
    assert len(fake_keys) == 1

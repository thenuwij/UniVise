import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services import demo

NOW = datetime(2026, 11, 8, 12, tzinfo=timezone.utc)


def account(hours_old: float, demo_flag: bool = True):
    return SimpleNamespace(
        id=f"user-{hours_old}",
        email="demo@example.com",
        created_at=NOW - timedelta(hours=hours_old),
        app_metadata={"demo": True} if demo_flag else {},
    )


def test_only_flagged_accounts_are_demo():
    assert demo.is_demo(account(1))
    assert not demo.is_demo(account(1, demo_flag=False))
    assert not demo.is_demo(SimpleNamespace(id="x"))


def test_expired_demo_accounts_are_deleted(monkeypatch):
    deleted = []
    monkeypatch.setattr(demo.supabase.auth.admin, "delete_user", deleted.append)
    kept = demo.delete_expired([account(1), account(25)], NOW)
    assert [a.id for a in kept] == ["user-1"]
    assert deleted == ["user-25"]


def test_demo_start_is_capped_per_hour(monkeypatch):
    now = datetime.now(timezone.utc)
    recent = [SimpleNamespace(id=str(i), created_at=now - timedelta(minutes=30)) for i in range(demo.MAX_DEMOS_PER_HOUR)]
    monkeypatch.setattr(demo, "demo_accounts", lambda: recent)
    monkeypatch.setattr(demo, "delete_expired", lambda accounts, now: accounts)
    monkeypatch.setattr(demo, "create_account", lambda: pytest.fail("should not create an account"))
    with pytest.raises(HTTPException) as err:
        asyncio.run(demo.start_demo())
    assert err.value.status_code == 429


def test_failed_setup_removes_the_half_made_account(monkeypatch):
    deleted = []
    monkeypatch.setattr(demo, "demo_accounts", lambda: [])
    monkeypatch.setattr(demo, "create_account", lambda: account(0))
    monkeypatch.setattr(demo, "degree", lambda: (_ for _ in ()).throw(RuntimeError("db down")))
    monkeypatch.setattr(demo.supabase.auth.admin, "delete_user", deleted.append)
    with pytest.raises(HTTPException) as err:
        asyncio.run(demo.start_demo())
    assert err.value.status_code == 500
    assert deleted == ["user-0"]


def test_demo_chat_limit_only_applies_to_demo_accounts(monkeypatch):
    monkeypatch.setattr(demo, "demo_chat_messages", lambda user_id: demo.MAX_DEMO_CHAT_MESSAGES + 1)
    asyncio.run(demo.check_demo_chat_limit(account(1, demo_flag=False)))
    with pytest.raises(HTTPException) as err:
        asyncio.run(demo.check_demo_chat_limit(account(1)))
    assert err.value.status_code == 429

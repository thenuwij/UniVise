"""Tests for certifications grouped by career.

The AI call, link checks and cache are faked; these check that only the
student's careers are kept, broken links are dropped, each career has one
starting point, and a cached answer is reused while the inputs are unchanged.
"""
import asyncio

from app.models.certifications import CareerCertificationGroups
from app.services.careers import certifications

ROADMAP = {"program_name": "Bachelor of Engineering (Honours)", "payload": {}}
CAREERS = ["Software Engineer", "Network Engineer"]


def cert(name, url="https://example.com/cert", start=False):
    return {
        "name": name, "provider": "Provider", "why": "Helps.", "level": "Beginner", "cost": "Paid",
        "time": "4 to 6 weeks", "when": "While studying", "url": url, "start_here": start,
    }


def test_clean_keeps_only_listed_careers_and_one_start():
    groups = [
        {"career": "network engineer", "certifications": [cert("CCNA", start=True), cert("CCNP", start=True), cert("ccna")]},
        {"career": "Astronaut", "certifications": [cert("Space 101")]},
        {"career": "Software Engineer", "certifications": [cert("AWS CCP", url="http://insecure.example.com")]},
    ]

    result = certifications.clean(groups, CAREERS)

    assert [g["career"] for g in result] == ["Network Engineer"]
    assert [(c["name"], c["start_here"]) for c in result[0]["certifications"]] == [("CCNA", True), ("CCNP", False)]


def test_broken_links_are_dropped_and_a_start_is_kept(monkeypatch):
    async def fake_validate(url):
        return "broken" not in url

    monkeypatch.setattr(certifications, "validate_url", fake_validate)
    groups = [
        {"career": "Software Engineer", "certifications": [cert("Gone", url="https://broken.example.com", start=True), cert("AWS CCP")]},
        {"career": "Network Engineer", "certifications": [cert("Gone too", url="https://broken.example.com")]},
    ]

    result = asyncio.run(certifications.check_links(groups))

    assert result == [{"career": "Software Engineer", "certifications": [{**cert("AWS CCP"), "start_here": True}]}]


def test_reuses_cache_and_regenerates_when_careers_change(monkeypatch):
    calls, writes = [], []
    monkeypatch.setattr(certifications, "careers_for", lambda user_id, roadmap: CAREERS)
    monkeypatch.setattr(certifications, "write_cache", lambda *args: writes.append(args))

    async def fake_validate(url):
        return True

    async def reply(prompt, schema, **kwargs):
        calls.append(prompt)
        return CareerCertificationGroups.model_validate({"groups": [{"career": "Software Engineer", "certifications": [cert("AWS CCP", start=True)]}]})

    monkeypatch.setattr(certifications, "validate_url", fake_validate)
    monkeypatch.setattr(certifications, "ask_gpt_structured", reply)

    hash_value = certifications.input_hash(ROADMAP["program_name"], CAREERS)
    monkeypatch.setattr(certifications, "read_cache", lambda user_id: {"input_hash": hash_value, "groups": [{"career": "cached"}]})
    assert asyncio.run(certifications.get_certifications("user-1", ROADMAP))["groups"] == [{"career": "cached"}]
    assert calls == []

    monkeypatch.setattr(certifications, "read_cache", lambda user_id: {"input_hash": "old", "groups": []})
    result = asyncio.run(certifications.get_certifications("user-1", ROADMAP))
    assert [g["career"] for g in result["groups"]] == ["Software Engineer"]
    assert len(calls) == 1 and len(writes) == 1
    assert "Software Engineer, Network Engineer" in calls[0] and "Never include university courses" in calls[0]


def test_no_careers_means_no_generation(monkeypatch):
    monkeypatch.setattr(certifications, "careers_for", lambda user_id, roadmap: [])

    async def boom(*args, **kwargs):
        raise AssertionError("should not call the AI")

    monkeypatch.setattr(certifications, "ask_gpt_structured", boom)

    assert asyncio.run(certifications.get_certifications("user-1", ROADMAP)) == {"careers": [], "groups": [], "failed": False}

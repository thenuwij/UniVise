"""Tests for the shared roadmap cache.

Supabase and the AI are faked; these check the cache key only changes when
the prompt inputs change, and that a cached roadmap is copied into the
student's own row without any AI call.
"""
import asyncio
from types import SimpleNamespace

from app.routers import roadmap as roadmap_router
from app.services.roadmap import cache

CONTEXT = {
    "degree_code": "3707",
    "program_name": "Bachelor of Engineering (Honours)",
    "uac_code": "429000",
    "faculty": "Faculty of Engineering",
    "core_courses": [{"code": "ENGG1000", "name": "Engineering Design"}],
    "specialisation_ids": ["a-major"],
    "selected_major_name": "Computer Engineering",
    "selected_major_courses": ["COMP1521"],
    "program_courses": [{"code": "ENGG1000", "name": "Engineering Design"}],
    "societies": [{"name": "Engineering Society", "arc_category": "Faculty", "short_name": None}],
}


def test_same_inputs_give_the_same_key():
    assert cache.roadmap_cache_key(dict(CONTEXT)) == cache.roadmap_cache_key(dict(CONTEXT))


def test_changed_data_or_specialisation_gives_a_new_key():
    base = cache.roadmap_cache_key(dict(CONTEXT))
    changed_data = cache.roadmap_cache_key({**CONTEXT, "core_courses": [{"code": "ENGG1000", "name": "Design and Innovation"}]})
    changed_spec = cache.roadmap_cache_key({**CONTEXT, "specialisation_ids": ["b-major"]})

    assert changed_data["input_hash"] != base["input_hash"]
    assert changed_spec["cache_key"] != base["cache_key"]
    assert changed_spec["input_hash"] == base["input_hash"]


def test_no_program_code_means_no_caching():
    assert cache.roadmap_cache_key({**CONTEXT, "degree_code": None}) is None
    assert cache.read_cached_roadmap(None) is None


class Table:
    def __init__(self, rows, log):
        self.rows = rows
        self.log = log

    def select(self, *args):
        return self

    def eq(self, column, value):
        self.rows = [r for r in self.rows if r.get(column) == value]
        return self

    def limit(self, *args):
        return self

    def update(self, values):
        self.log.append(("update", values))
        return self

    def insert(self, row):
        self.log.append(("insert", row))
        self.rows = [{"id": "row-1", **row}]
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


def test_hit_returns_the_payload_and_marks_it_used(monkeypatch):
    log = []
    key = cache.roadmap_cache_key(dict(CONTEXT))
    rows = [{"cache_key": key["cache_key"], "payload": {"summary": "Cached"}}]
    monkeypatch.setattr(cache, "supabase", SimpleNamespace(from_=lambda name: Table(list(rows), log)))

    assert cache.read_cached_roadmap(key) == {"summary": "Cached"}
    assert log[0][0] == "update" and "last_used_at" in log[0][1]


def test_cached_roadmap_is_copied_without_an_ai_call(monkeypatch):
    log = []
    cached = {"summary": "Cached", "career_pathways": {"entry_level": {}}, "industry_failed": []}

    async def context(user_id, body):
        return dict(CONTEXT)

    async def no_ai(ctx):
        raise AssertionError("AI should not be called on a cache hit")

    monkeypatch.setattr(roadmap_router, "gather_unsw_context", context)
    monkeypatch.setattr(roadmap_router, "read_cached_roadmap", lambda key: dict(cached))
    monkeypatch.setattr(roadmap_router, "ai_generate_unsw_payload", no_ai)
    monkeypatch.setattr(roadmap_router, "supabase", SimpleNamespace(table=lambda name: Table([], log)))

    body = SimpleNamespace(degree_id="d1", uac_code=None, program_name=None)
    result = asyncio.run(roadmap_router.create_unsw(body, user=SimpleNamespace(id="u1")))

    inserted = log[0][1]
    assert inserted["user_id"] == "u1"
    assert inserted["payload"]["summary"] == "Cached"
    assert inserted["payload"]["specialisation_ids"] == ["a-major"]
    assert inserted["payload"]["cache_key"]["degree_code"] == "3707"
    assert result["payload"]["career_pathways"] == {"entry_level": {}}

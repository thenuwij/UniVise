# app/utils/mindmesh_rules.py
from typing import List, Dict, Any, Optional, Protocol, Tuple
import re
from .database import supabase

# ---- Local "Item-like" protocol so we don't import the router ----
class ItemLike(Protocol):
    item_key: str
    item_type: str
    title: str
    metadata: Dict[str, Any]
    source_table: Optional[str]
    source_id: Optional[str]

# ---------- helpers ----------
def _infer_level_from_code(code: Optional[str]) -> Optional[int]:
    m = re.search(r"\d{4}", code or "")
    return int(m.group(0)[0]) if m else None

def _is_level1_code(code: Optional[str]) -> bool:
    m = re.search(r"\b[A-Z]{4}(\d{4})\b", str(code or ""))
    return bool(m and m.group(1)[0] == "1")

async def _fetch_course_catalog(keys_or_ids: List[Tuple[Optional[str], Optional[str]]]) -> Dict[str, Dict[str, Any]]:
    """
    Accepts list of (source_id, item_key), returns map by both id and code:
      idx[id] and idx[code] -> { id, code, title, faculty, level }
    """
    ids = [sid for sid, _ in keys_or_ids if sid]
    codes = [k for _, k in keys_or_ids if k]

    idx: Dict[str, Dict[str, Any]] = {}

    # Fetch by id
    if ids:
        cr = (
            supabase.table("unsw_courses")
            .select("id,code,title,faculty")
            .in_("id", ids)
            .execute()
        )
        for r in (cr.data or []):
            rec = {
                "id": r["id"],
                "code": r.get("code"),
                "title": r.get("title"),
                "faculty": r.get("faculty"),
                "level": _infer_level_from_code(r.get("code")),
            }
            idx[r["id"]] = rec
            if rec["code"]:
                idx[rec["code"]] = rec

    # Fill missing by code
    fetch_codes = [c for c in codes if c not in idx]
    if fetch_codes:
        cr2 = (
            supabase.table("unsw_courses")
            .select("id,code,title,faculty")
            .in_("code", fetch_codes)
            .execute()
        )
        for r in (cr2.data or []):
            rec = {
                "id": r["id"],
                "code": r.get("code"),
                "title": r.get("title"),
                "faculty": r.get("faculty"),
                "level": _infer_level_from_code(r.get("code")),
            }
            idx[r["id"]] = rec
            if rec["code"]:
                idx[rec["code"]] = rec

    return idx

async def _fetch_degree_faculty(deg: ItemLike) -> Optional[str]:
    """
    Get faculty for a degree using source_id if available,
    otherwise by uac_code or program_name — from unsw_degrees_final.
    """
    # Try by id
    if deg.source_id:
        dr = (
            supabase.table("unsw_degrees_final")
            .select("id,faculty")
            .eq("id", deg.source_id)
            .limit(1)
            .execute()
        )
        row = (dr.data or [None])[0]
        if row:
            return row.get("faculty")

    # Fallback by uac_code
    if deg.item_key and re.fullmatch(r"\d{6}", str(deg.item_key)):
        dr2 = (
            supabase.table("unsw_degrees_final")
            .select("uac_code,faculty")
            .eq("uac_code", str(deg.item_key))
            .limit(1)
            .execute()
        )
        row = (dr2.data or [None])[0]
        if row:
            return row.get("faculty")

    # Fallback by program_name
    if deg.title:
        dr3 = (
            supabase.table("unsw_degrees_final")
            .select("program_name,faculty")
            .eq("program_name", deg.title)
            .limit(1)
            .execute()
        )
        row = (dr3.data or [None])[0]
        if row:
            return row.get("faculty")

    return None


async def _existing_item_keys(user_id: str, mesh_id: str) -> set:
    q = (
        supabase.from_("mindmesh_items")
        .select("item_type,item_key")
        .eq("user_id", user_id)
        .eq("mesh_id", mesh_id)
        .execute()
    )
    return { (r["item_type"], r["item_key"]) for r in (q.data or []) }

async def _auto_add_level1_courses(user_id: str, mesh_id: str, faculty: str) -> int:
    """
    Pull all level-1 courses in the same faculty and upsert them into mindmesh_items.
    Returns count inserted/upserted.
    """
    # Pull a reasonable slice (adjust if needed)
    cr = (
        supabase.table("unsw_courses")
        .select("id,code,title,faculty")
        .eq("faculty", faculty)
        .limit(500)
        .execute()
    )
    rows = [r for r in (cr.data or []) if _is_level1_code(r.get("code"))]
    if not rows:
        return 0

    existing = await _existing_item_keys(user_id, mesh_id)
    to_add = []
    for r in rows:
        key = ("course", r["code"])
        if key in existing:
            continue
        to_add.append({
            "user_id": user_id,
            "mesh_id": mesh_id,
            "item_type": "course",
            "item_key": r["code"],
            "title": r.get("title") or r["code"],
            "tags": ["course", f"level-{_infer_level_from_code(r.get('code')) or 'x'}"],
            "metadata": {"faculty": r.get("faculty")},
            "source_table": "unsw_courses",
            "source_id": r["id"],
        })

    if not to_add:
        return 0

    res = supabase.table("mindmesh_items").upsert(
        to_add,
        on_conflict="user_id,mesh_id,item_type,item_key"
    ).execute()
    if getattr(res, "error", None):
        # Don't explode the request if inserts fail – treat as 0
        return 0
    return len(to_add)

# ---------- main rule ----------
async def degree_to_level1_edges(
    user_id: str,
    mesh_id: str,
    new_items: List[ItemLike],
    existing_items: List[ItemLike],
    max_edges_per_degree: int = 30,
    allow_cross_faculty: bool = False,
    auto_add_missing_level1: bool = False,
) -> List[Dict[str, Any]]:
    """
    DEGREE -> COURSE (level 1) within same faculty.
    If auto_add_missing_level1=True, we will insert level-1 courses (same faculty)
    into mindmesh_items first so edges always have visible targets.
    """
    new_degrees = [it for it in new_items if it.item_type == "degree"]
    if not new_degrees:
        return []

    # Ensure we have candidates (existing + new)
    candidates = [it for it in [*new_items, *existing_items] if it.item_type == "course"]

    edges: List[Dict[str, Any]] = []

    for deg in new_degrees:
        d_fac = await _fetch_degree_faculty(deg)
        if not d_fac:
            # Nothing to do without faculty info
            continue

        # Optionally auto-add missing level-1 courses for this faculty
        if auto_add_missing_level1:
            await _auto_add_level1_courses(user_id, mesh_id, d_fac)
            # Refresh candidates after auto-add
            # (Only pull minimal fields needed)
            refreshed = (
                supabase.from_("mindmesh_items")
                .select("item_type,item_key,source_table,source_id")
                .eq("user_id", user_id)
                .eq("mesh_id", mesh_id)
                .eq("item_type", "course")
                .limit(800)
                .execute()
            )
            candidates = [  # rebuild with ItemLike-shape dicts
                type("X",(object,),r)() for r in (refreshed.data or [])
            ]

        # Build course catalog for candidates (by source_id or code)
        keys_or_ids = [(it.source_id, it.item_key) for it in candidates]
        cat = await _fetch_course_catalog(keys_or_ids)

        added = 0
        for c in candidates:
            if added >= max_edges_per_degree:
                break

            rec = cat.get(c.source_id) or cat.get(c.item_key) or {}
            if not rec:
                continue

            if rec.get("level") != 1:
                continue
            c_fac = (rec.get("faculty") or "").strip()

            if not allow_cross_faculty and (c_fac and c_fac != d_fac.strip()):
                continue

            edges.append(
                {
                    "from_key": deg.item_key,
                    "to_key": rec.get("code") or c.item_key,
                    "edge_type": "belongs_to",
                    "rationale": "rule:degree->level1(same faculty)",
                    "confidence": 0.9,
                    "metadata": {},
                }
            )
            added += 1

    return edges

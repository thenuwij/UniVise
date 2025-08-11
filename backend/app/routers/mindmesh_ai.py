# app/routers/mindmesh_ai.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.utils.mindmesh_rules import degree_to_level1_edges
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import re

from dependencies import get_current_user
from app.utils.database import supabase
from app.utils.openai_client import ask_openai  # async helper

router = APIRouter(tags=["MindMesh"])

# =========================
# Models
# =========================
class Item(BaseModel):
    item_key: str
    item_type: str
    title: str
    metadata: Dict[str, Any] = {}
    # Important: include source fields so we can pull catalogue descriptions
    source_table: Optional[str] = None  # 'unsw_courses' | 'unsw_degrees'
    source_id: Optional[str] = None

class InferReq(BaseModel):
    mesh_id: str
    items: List[Item]
    mode: Optional[str] = "full"  # "fast" (regex prereqs only) or "full" (regex + LLM non-prereq)
    max_edges_per_new: Optional[int] = 3
    allow_cross_faculty: Optional[bool] = False  # guardrail; can be flipped if you want

# =========================
# Helpers
# =========================
def _now_iso() -> str:
    # Use Z to mark UTC
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"

def _trim(s: Optional[str], n: int = 700) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()[:n]

def course_code_tokens(text: str) -> List[str]:
    """Match UNSW style ABCD1234; de-duplicate while preserving order."""
    codes = re.findall(r"\b[A-Z]{4}\d{4}\b", text or "")
    seen, out = set(), []
    for c in codes:
        if c not in seen:
            seen.add(c)
            out.append(c)
    return out

def _tokset(s: str) -> set:
    return set(w.lower() for w in re.findall(r"[a-zA-Z]{3,}", s or ""))

def _unrelated(a: Dict[str, Any], b: Dict[str, Any]) -> bool:
    """Return True if clearly unrelated across faculties with tiny keyword overlap."""
    if a.get("faculty") and b.get("faculty") and a["faculty"] != b["faculty"]:
        return len(_tokset(a.get("title", "") + " " + a.get("desc", "")) &
                   _tokset(b.get("title", "") + " " + b.get("desc", ""))) < 3
    return False

async def upsert_edges(user_id: str, mesh_id: str, edges: List[Dict[str, Any]]) -> int:
    """De-dup in-memory, then upsert (user_id, mesh_id, from_key, to_key, edge_type) uniqueness."""
    if not edges:
        return 0

    best: Dict[tuple, Dict[str, Any]] = {}
    for e in edges:
        # Normalize confidence to float in 0..1
        conf = e.get("confidence")
        try:
            conf = float(conf)
        except Exception:
            conf = 0.7
        conf = max(0.0, min(1.0, conf))
        e["confidence"] = conf

        key = (e["from_key"], e["to_key"], e["edge_type"])
        if key not in best or conf > best[key].get("confidence", 0):
            best[key] = e

    rows = [
        {
            "user_id": user_id,
            "mesh_id": mesh_id,
            "from_key": e["from_key"],
            "to_key": e["to_key"],
            "edge_type": e["edge_type"],
            # store as string to match your sample rows; change to number if column is numeric
            "confidence": str(round(e["confidence"], 3)),
            "rationale": (e.get("rationale") or "")[:800],
            "metadata": e.get("metadata") or {},
            "created_at": _now_iso(),
        }
        for e in best.values()
    ]
    res = supabase.table("mindmesh_edges").upsert(
        rows, on_conflict="user_id,mesh_id,from_key,to_key,edge_type"
    ).execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=f"edge upsert failed: {res.error}")
    return len(rows)

async def _load_existing_items(uid: str, mesh_id: str) -> List[Item]:
    q = (
        supabase.from_("mindmesh_items")
        .select("item_type,item_key,title,metadata,source_table,source_id")
        .eq("user_id", uid)
        .eq("mesh_id", mesh_id)
        .limit(400)
        .execute()
    )
    data = q.data or []
    out: List[Item] = []
    for r in data:
        out.append(
            Item(
                item_type=r.get("item_type", ""),
                item_key=r.get("item_key", ""),
                title=r.get("title") or r.get("item_key", ""),
                metadata=r.get("metadata") or {},
                source_table=r.get("source_table"),
                source_id=r.get("source_id"),
            )
        )
    return out

async def enrich_items_with_catalogue(items: List[Item]) -> List[Dict[str, Any]]:
    """Return compact, LLM-friendly records with faculty/desc pulled from UNSW tables."""
    if not items:
        return []

    course_ids = [it.source_id for it in items if it.source_table == "unsw_courses" and it.source_id]
    degree_ids = [it.source_id for it in items if it.source_table == "unsw_degrees" and it.source_id]

    courses_by_id: Dict[str, Dict[str, Any]] = {}
    degrees_by_id: Dict[str, Dict[str, Any]] = {}

    def _infer_level_from_code(code: Optional[str]) -> Optional[int]:
        m = re.search(r"\d{4}", code or "")
        return int(m.group(0)[0]) if m else None

    def _parse_uoc(uoc: Optional[str]) -> Optional[int]:
        # "6 Units of Credit" -> 6
        m = re.search(r"\d+", str(uoc or ""))
        return int(m.group(0)) if m else None

    if course_ids:
        cr = (
            supabase.table("unsw_courses")
            .select("id,code,title,uoc,overview,conditions_for_enrolment,school,faculty")
            .in_("id", course_ids)
            .execute()
        )
        for r in (cr.data or []):
            courses_by_id[r["id"]] = {
                "faculty": r.get("faculty"),
                "school": r.get("school"),
                "level": _infer_level_from_code(r.get("code")),  # e.g. COMP2511 -> 2
                "uoc": _parse_uoc(r.get("uoc")),                 # int or None
                "desc": _trim(r.get("overview") or ""),          # use 'overview' as description
            }

    if degree_ids:
        dr = (
            supabase.table("unsw_degrees")
            .select("*")
            .in_("id", degree_ids)
            .execute()
        )
        for r in (dr.data or []):
            degrees_by_id[r["id"]] = {
                "faculty": r.get("faculty") or r.get("faculty_name"),
                "desc": _trim(r.get("overview") or r.get("description") or r.get("summary") or ""),
            }

    enriched = []
    for it in items:
        rec = {
            "key": it.item_key,
            "type": it.item_type,  # 'course' | 'degree'
            "title": it.title or it.item_key,
            "faculty": None,
            "level": None,
            "uoc": None,
            # fallback to any frontend-provided text
            "desc": _trim(
                (it.metadata.get("summary") or "")
                + " "
                + (it.metadata.get("description") or "")
            ),
        }
        if it.source_table == "unsw_courses" and it.source_id and it.source_id in courses_by_id:
            rec.update(courses_by_id[it.source_id])
        elif it.source_table == "unsw_degrees" and it.source_id and it.source_id in degrees_by_id:
            rec.update(degrees_by_id[it.source_id])
        enriched.append(rec)
    return enriched

def _items_to_llm_lines(rows: List[Dict[str, Any]]) -> str:
    """Compact, readable list lines for the prompt."""
    lines = []
    for r in rows:
        bits = []
        if r.get("faculty"): bits.append(f"faculty={r['faculty']}")
        if r.get("level"):   bits.append(f"level={r['level']}")
        if r.get("uoc"):     bits.append(f"uoc={r['uoc']}")
        meta = f" ({', '.join(bits)})" if bits else ""
        desc = f" | {r['desc']}" if r.get("desc") else ""
        lines.append(f"- {r['type'].upper()} key={r['key']} title={r['title']}{meta}{desc}")
    return "\n".join(lines)

def _safe_parse_edges(s: str) -> List[Dict[str, Any]]:
    """Try parsing JSON; fallback to extracting largest JSON object."""
    try:
        obj = json.loads(s)
        if isinstance(obj, dict):
            return obj.get("edges", []) or []
    except Exception:
        pass
    try:
        start, end = s.find("{"), s.rfind("}")
        if start != -1 and end != -1 and end > start:
            obj = json.loads(s[start : end + 1])
            return obj.get("edges", []) or []
    except Exception:
        pass
    return []

# =========================
# Deterministic prereq pass
# =========================
async def deterministic_edges_for_items(user_id: str, mesh_id: str, items: List[Item]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []

    # 1) Course prereqs via regex on conditions_for_enrolment
    #    (prereq_course_code) --> (this course)
    for it in items:
        if it.item_type != "course":
            continue
        res = (
            supabase.from_("unsw_courses")
            .select("code,conditions_for_enrolment")
            .eq("code", it.item_key)
            .limit(1)
            .execute()
        )
        row = res.data[0] if (res.data and len(res.data)) else None
        if not row:
            continue

        codes = course_code_tokens(row.get("conditions_for_enrolment") or "")
        if not codes:
            continue

        # Confirm these codes exist in catalogue
        known = (
            supabase.from_("unsw_courses")
            .select("code")
            .in_("code", codes)
            .execute()
        )
        known_set = {r["code"] for r in (known.data or [])}

        for c in known_set:
            if c == it.item_key:
                continue
            out.append(
                {
                    "from_key": c,
                    "to_key": it.item_key,
                    "edge_type": "prereq",
                    "rationale": "regex:conditions_for_enrolment",
                    "confidence": 1.0,
                    "metadata": {},
                }
            )

    # 2) (Optionally add other deterministic rules here)
    return out

# =========================
# LLM (Non-prereq) pass
# =========================
NON_PREREQ_SYSTEM = """You infer ONLY NON-PREREQUISITE academic edges for a user graph.
Return STRICT JSON: {"edges":[{"source_key":str,"target_key":str,"relation":"co_req"|"belongs_to"|"theme"|"recommended"|"ai_inferred","reason":str,"confidence":0..1}]}.
Rules:
- Never output 'prereq'. That is handled elsewhere.
- Use keys EXACTLY as listed (key=...).
- Direction is source -> target.
- Prefer edges within the same faculty unless a cross-faculty link is clearly justified in your reason.
- Cap at 3 edges per source item. Omit low-confidence ideas.
- Output JSON only, no commentary.
"""

async def llm_edges_scoped(
    uid: str,
    mesh_id: str,
    new_items: List[Item],
    existing_items: List[Item],
    max_edges_per_new: int = 3,
    allow_cross_faculty: bool = False,
) -> List[Dict[str, Any]]:
    if not new_items:
        return []

    # Enrich with catalogue data
    new_rows = await enrich_items_with_catalogue(new_items)
    exist_rows = await enrich_items_with_catalogue(existing_items)

    user_msg = (
        "Infer helpful NON-PREREQUISITE edges only from NEW items (as source) to items in NEW or EXISTING (as target).\n"
        "Use the provided 'key' values exactly.\n\n"
        "NEW:\n" + _items_to_llm_lines(new_rows) +
        "\n\nEXISTING:\n" + (_items_to_llm_lines(exist_rows) if exist_rows else "(none)")
    )

    # ---- Call OpenAI via helper; tolerate signature differences; never raise ----
    try:
        # common signature in your codebase
        raw = await ask_openai(
            prompt=user_msg,
            system_prompt=NON_PREREQ_SYSTEM,
            temperature=0.2,
            max_tokens=1000,
        )
    except TypeError:
        # fallback: single-arg helper or messages-less variant
        try:
            raw = await ask_openai(user_msg)
        except Exception:
            raw = ""
    except Exception:
        raw = ""

    if isinstance(raw, dict):
        raw = (
            raw.get("text")
            or raw.get("content")
            or (raw.get("choices", [{}])[0].get("message", {}) or {}).get("content")
            or json.dumps(raw)
        )
    raw = (raw or "").strip()

    try:
        parsed = json.loads(raw).get("edges", [])
    except Exception:
        parsed = _safe_parse_edges(raw)

    by_key = {r["key"]: r for r in [*new_rows, *exist_rows]}
    allowed = {"co_req", "belongs_to", "theme", "recommended", "ai_inferred"}
    per_src: Dict[str, int] = {}
    out: List[Dict[str, Any]] = []

    for e in parsed or []:
        rel = str(e.get("relation") or "")
        if rel not in allowed:
            continue
        src = str(e.get("source_key") or "")
        tgt = str(e.get("target_key") or "")
        if not src or not tgt or src == tgt:
            continue

        # Only allow edges where endpoints exist
        if src not in by_key or tgt not in by_key:
            continue

        # Source must be one of the NEW items (as requested)
        if not any(it.item_key == src for it in new_items):
            continue

        a, b = by_key[src], by_key[tgt]
        if not allow_cross_faculty and _unrelated(a, b):
            continue

        per_src[src] = per_src.get(src, 0) + 1
        if per_src[src] > (max_edges_per_new or 3):
            continue

        try:
            conf = float(e.get("confidence") or 0.7)
        except Exception:
            conf = 0.7

        out.append(
            {
                "from_key": src,
                "to_key": tgt,
                "edge_type": rel,  # co_req | belongs_to | theme | recommended | ai_inferred
                "rationale": f"llm:{rel}:{str(e.get('reason',''))[:300]}",
                "confidence": max(0.0, min(1.0, conf)),
                "metadata": {},
            }
        )

    return out

# =========================
# Route
# =========================
@router.post("/infer")
async def infer_edges(req: InferReq, user=Depends(get_current_user)):
    # Resolve uid from whatever shape your auth has
    uid = getattr(user, "id", None) or getattr(user, "user", {}).get("id")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    if not req.items:
        return {"added": 0}

    # Treat request items as NEW (sources)
    new_items: List[Item] = [Item(**it.dict()) for it in req.items]
    existing_items = await _load_existing_items(uid, req.mesh_id)

    # 1) Deterministic prereqs
    edges: List[Dict[str, Any]] = await deterministic_edges_for_items(uid, req.mesh_id, new_items)

    # 1b) Deterministic degree -> level-1 course links (with auto-add)
    edges_degree_level1 = await degree_to_level1_edges(
        user_id=uid,
        mesh_id=req.mesh_id,
        new_items=new_items,
        existing_items=existing_items,
        max_edges_per_degree=(req.max_edges_per_new or 30),
        allow_cross_faculty=bool(req.allow_cross_faculty),
        auto_add_missing_level1=False,   # <--- ensures you see edges immediately
    )
    edges.extend(edges_degree_level1)


    # 2) LLM pass for NON-PREREQ edges (optional via mode)
    if req.mode == "full":
        edges_llm = await llm_edges_scoped(
            uid=uid,
            mesh_id=req.mesh_id,
            new_items=new_items,
            existing_items=existing_items,
            max_edges_per_new=req.max_edges_per_new or 3,
            allow_cross_faculty=bool(req.allow_cross_faculty),
        )
        edges.extend(edges_llm)


    # 3) Respect ignored edges
    if edges:
        ign = (
            supabase.table("mindmesh_ignored_edges")
            .select("from_key,to_key,edge_type")
            .eq("user_id", uid)
            .eq("mesh_id", req.mesh_id)
            .execute()
        )
        ignored = {(r["from_key"], r["to_key"], r["edge_type"]) for r in (ign.data or [])}
        edges = [e for e in edges if (e["from_key"], e["to_key"], e["edge_type"]) not in ignored]

    # 4) Upsert
    added = await upsert_edges(uid, req.mesh_id, edges)
    return {"added": added}

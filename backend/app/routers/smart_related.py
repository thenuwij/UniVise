# app/routers/smart_related.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import re

from dependencies import get_current_user
from app.utils.database import supabase
from app.utils.openai_client import ask_openai  # your existing helper

router = APIRouter(prefix="/smart-related", tags=["Smart Related"])

class CourseToDegreesReq(BaseModel):
    course_id: Optional[str] = None           # prefer UUID
    course_code: Optional[str] = None         # fallback
    top_k: int = 4
    restrict_faculty: bool = True             # choose within same faculty if possible

class DegreeOut(BaseModel):
    id: str
    program_name: str
    uac_code: Optional[str] = None
    faculty: Optional[str] = None
    reason: Optional[str] = None              # why AI picked this
    score: Optional[float] = None

SYSTEM_PROMPT = """You are selecting the most relevant university degrees for a single course.
Pick ONLY from the provided DEGREE CANDIDATES.
Return STRICT JSON:
{"choices":[{"degree_id":str,"score":0..1,"reason":str}, ...]}

Guidelines:
- Relevance: primary fit by curriculum alignment, prerequisites pipeline, and faculty match.
- Penalize degrees outside the course's faculty unless clearly justified.
- Prefer generalist 'home' degrees for foundational courses; specialized degrees for niche courses.
- Cap choices at the requested top_k.
- Output JSON only; no extra text.
"""

def _safe_json_choices(text: str) -> List[Dict[str, Any]]:
    try:
        obj = json.loads(text)
        if isinstance(obj, dict) and isinstance(obj.get("choices"), list):
            return obj["choices"]
    except Exception:
        pass
    # try largest JSON object fallback
    try:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            obj = json.loads(text[start:end+1])
            if isinstance(obj, dict) and isinstance(obj.get("choices"), list):
                return obj["choices"]
    except Exception:
        pass
    return []

@router.post("/degrees-for-course", response_model=List[DegreeOut])
async def degrees_for_course(req: CourseToDegreesReq, user=Depends(get_current_user)):
    # --- 1) load course ---
    if not req.course_id and not req.course_code:
        raise HTTPException(status_code=400, detail="course_id or course_code required")

    cq = supabase.table("unsw_courses").select(
        "id,code,title,overview,faculty,field_of_education"
    )
    if req.course_id:
        cq = cq.eq("id", req.course_id).limit(1)
    else:
        cq = cq.eq("code", req.course_code).limit(1)
    cr = cq.execute()
    c = (cr.data or [None])[0]
    if not c:
        raise HTTPException(status_code=404, detail="course not found")

    course_blob = {
        "id": c["id"],
        "code": c.get("code"),
        "title": c.get("title"),
        "faculty": c.get("faculty"),
        "overview": (c.get("overview") or "")[:1200],
        "foe": c.get("field_of_education"),
    }

    # --- 2) fetch candidate degrees (from unsw_degrees ONLY) ---
    dq = supabase.table("unsw_degrees").select(
        "id,program_name,uac_code,faculty,description"
    )
    if req.restrict_faculty and c.get("faculty"):
        dq = dq.eq("faculty", c["faculty"])
    # Hard cap to keep prompt reasonable
    dr = dq.limit(80).execute()
    candidates = dr.data or []
    if not candidates:
        # fallback: try without faculty restriction
        dr = supabase.table("unsw_degrees").select(
            "id,program_name,uac_code,faculty,description,overview"
        ).limit(80).execute()
        candidates = dr.data or []
    if not candidates:
        return []

    # Pre-trim long text
    for d in candidates:
        d["desc"] = ((d.get("overview") or d.get("description") or "")[:600]).strip()

    # --- 3) short heuristic prefilter (keyword overlap) to shrink list for LLM ---
    def toks(s: str) -> set:
        return set(w.lower() for w in re.findall(r"[a-zA-Z]{3,}", s or ""))
    c_toks = toks((course_blob["title"] or "") + " " + (course_blob["overview"] or ""))

    scored = []
    for d in candidates:
        overlap = len(c_toks & toks(d["program_name"] + " " + d["desc"]))
        same_fac = 1 if (c.get("faculty") and d.get("faculty") == c.get("faculty")) else 0
        scored.append((overlap + 2*same_fac, d))
    # keep top 30 for the LLM
    scored.sort(key=lambda x: x[0], reverse=True)
    shortlist = [d for _, d in scored[:30]]

    # --- 4) LLM selection ---
    new_lines = [
        f'- DEGREE id={d["id"]} name="{d["program_name"]}" faculty="{d.get("faculty") or ""}" uac="{d.get("uac_code") or ""}" | {d.get("desc") or ""}'
        for d in shortlist
    ]
    user_prompt = (
        "COURSE:\n"
        f'- code={course_blob["code"]} title="{course_blob["title"]}" faculty="{course_blob.get("faculty") or ""}" '
        f'foe="{course_blob.get("foe") or ""}" | {course_blob.get("overview") or ""}\n\n'
        f"DEGREE CANDIDATES ({len(shortlist)}):\n" + "\n".join(new_lines) + "\n\n"
        f"Select the top {req.top_k} most relevant degrees."
    )

    try:
        raw = await ask_openai(
            prompt=user_prompt,
            system_prompt=SYSTEM_PROMPT,
            temperature=0.1,
            max_tokens=800,
        )
    except Exception:
        raw = ""

    if isinstance(raw, dict):
        raw = raw.get("text") or raw.get("content") or json.dumps(raw)
    choices = _safe_json_choices(raw or "")

    # --- 5) validate outputs and map back to real rows ---
    cand_by_id = {d["id"]: d for d in shortlist}
    out: List[DegreeOut] = []
    seen = set()
    for ch in choices:
        did = str(ch.get("degree_id") or "").strip()
        if not did or did in seen or did not in cand_by_id:
            continue
        seen.add(did)
        r = cand_by_id[did]
        out.append(DegreeOut(
            id=r["id"],
            program_name=r["program_name"],
            uac_code=r.get("uac_code"),
            faculty=r.get("faculty"),
            reason=(str(ch.get("reason") or "")[:300] or None),
            score=float(ch.get("score") or 0.7),
        ))
        if len(out) >= max(1, req.top_k):
            break

    # If LLM failed, fallback to top heuristic
    if not out:
        for _, r in scored[:req.top_k]:
            out.append(DegreeOut(
                id=r["id"],
                program_name=r["program_name"],
                uac_code=r.get("uac_code"),
                faculty=r.get("faculty"),
                reason="heuristic: keyword/faculty match",
                score=0.5,
            ))

    return out

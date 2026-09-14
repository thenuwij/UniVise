# app/routers/smart_related.py
from fastapi import APIRouter, Depends, HTTPException
from app.models.smart_related import CourseToDegreesReq, DegreeOut
from typing import List
import json
import re

from app.core.auth import get_current_user
from app.core.database import supabase
from app.llm.openai_client import ask_gpt_async
from app.services.smart_related import SYSTEM_PROMPT, safe_json_choices

router = APIRouter(prefix="/smart-related", tags=["Smart Related"])

# Find top matching degrees for a given course using keyword prefiltering and AI ranking
@router.post("/degrees-for-course", response_model=List[DegreeOut])
async def degrees_for_course(req: CourseToDegreesReq, user=Depends(get_current_user)):

    # load course 
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
    
    # fetch candidate degrees (from unsw_degrees_final table)
    dq = supabase.table("unsw_degrees_final").select(
        "id,program_name,uac_code,faculty,overview_description,other_faculty,duration"
    )

    if req.restrict_faculty and c.get("faculty"):
        dq = dq.eq("faculty", c["faculty"])

    # Hard cap to keep prompt reasonable
    dr = dq.limit(80).execute()
    candidates = dr.data or []
    if not candidates:

        # fallback: try without faculty restriction
        dr = supabase.table("unsw_degrees_final").select(
            "id,program_name,uac_code,faculty,overview_description,other_faculty,duration"
        ).limit(80).execute()
        candidates = dr.data or []
    if not candidates:
        return []

    # Pre-trim long text
    for d in candidates:
        d["desc"] = ((d.get("overview_description") or "")[:600]).strip()

    # short prefilter (keyword overlap) to reduce list for LLM 
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

    # LLM selection
    new_lines = [
        f'- DEGREE id={d["id"]} name="{d["program_name"]}" '
        f'faculty="{d.get("faculty") or ""}" '
        f'other_faculty="{d.get("other_faculty") or ""}" '
        f'duration="{d.get("duration") or ""}" '
        f'uac="{d.get("uac_code") or ""}" | {d.get("desc") or ""}'
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
        raw = await ask_gpt_async(
            prompt=user_prompt,
            temperature=0.1,
            max_tokens=800,
            system_prompt=SYSTEM_PROMPT,
        )
    except Exception:
        raw = ""

    if isinstance(raw, dict):
        raw = raw.get("text") or raw.get("content") or json.dumps(raw)
    choices = safe_json_choices(raw or "")

    # validate outputs and map back to real rows 
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

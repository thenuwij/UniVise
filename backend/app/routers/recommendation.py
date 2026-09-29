import datetime
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
from app.core.auth import get_current_user
from app.core.database import supabase
from app.llm.openai_client import ask_gpt_async, ask_gpt_structured
from app.llm.json_parsing import extract_json
from app.models.recommendation import CareerRecommendations
from app.services.user_profile import get_user_info, get_student_type
from app.services.recommendation import (
    claim_recommendation_run,
    explain_recommendation,
    release_recommendation_run,
    replace_career_recommendations,
)

router = APIRouter()


# ── routes ───────────────────────────────────────────────────────────────────

@router.post("/prompt")
async def get_recommendation_prompts(user=Depends(get_current_user)):
    if not claim_recommendation_run(user.id):
        return JSONResponse(status_code=202, content={"status": "in_progress"})

    try:
        student_type = await get_student_type(user)
        user_info    = await get_user_info(user, student_type)

        if not student_type or not user_info:
            raise HTTPException(status_code=401, detail="Invalid User")

        if student_type == "university":
            prompt = (
                "You are a university career advisor for UNSW students. Based on this student's profile:\n\n"
                f"• Field / Stage / Year: {user_info['degree_field']} / {user_info['degree_stage']} / {user_info['academic_year']}\n"
                f"• Interests: {', '.join(user_info.get('interest_areas') or []) or 'not provided'}\n"
                f"• Hobbies: {', '.join(user_info.get('hobbies') or []) or 'not provided'}\n"
                f"• Priorities: {', '.join(user_info.get('priorities') or []) or 'not provided'}\n"
                f"• Work style: {', '.join(user_info.get('work_style') or []) or 'not provided'}\n\n"
                "Recommend exactly 4 career roles. For each, give a suitability_score from 0 to 100, "
                "a reason in plain sentences, the education required, the key skills needed, "
                "and a link and source for further reading.\n\n"
                "avg_salary_range is a single realistic AUD range in the form \"$X,XXX - $Y,YYY\", "
                "for example \"$75,000 - $110,000\". If genuinely unknown, use \"$60,000 - $90,000\".\n\n"
                "Do not use em dashes anywhere."
            )
            generated = await ask_gpt_structured(
                prompt, CareerRecommendations, max_tokens=2000, model="gpt-5.4-mini"
            )
            rows = replace_career_recommendations(user.id, generated.recommendations)
            return {"status": "success", "recommendations": rows}
        elif student_type == "high_school":
            prompt = (
                "You are a high school academic advisor. Based on this student's profile:\n\n"
                f"• Year: {user_info['year']}\n"
                f"• Academic strengths: {', '.join(user_info.get('academic_strengths') or []) or 'not provided'}\n"
                f"• ATAR: {user_info['atar']}\n"
                f"• Hobbies: {', '.join(user_info.get('hobbies') or []) or 'not provided'}\n"
                f"• Career interests: {', '.join(user_info.get('career_interests') or []) or 'not provided'}\n"
                f"• Degree interests: {', '.join(user_info.get('degree_interest') or []) or 'not provided'}\n"
                f"• Confidence: {user_info['confidence']}\n\n"
                "Return EXACTLY 4 recommended degrees, no more, no less, as a JSON array. Each object must have:\n"
                "degree_name (string), university_name (string, NSW universities only), "
                "atar_requirement (int), suitability_score (int 0-100), "
                "estimated_completion_time (number), reason (string), "
                "link (string), source (string).\n\n"
                "Respond with only a raw JSON array — no markdown, no explanation."
            )
        else:
            raise HTTPException(status_code=400, detail="Unknown student type")

        recommendation_raw = await ask_gpt_async(prompt, max_tokens=2000)

        try:
            parsed = extract_json(recommendation_raw)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error parsing recommendation JSON: {e}\nRaw: {recommendation_raw[:500]}",
            ) from e

        # ── Wipe existing data so this endpoint is fully idempotent ──────────────
        existing = supabase.table("degree_recommendations").select("id").eq("user_id", user.id).execute()
        if existing.data:
            old_ids = [r["id"] for r in existing.data]
            supabase.table("degree_rec_details").delete().in_("id", old_ids).execute()
        supabase.table("degree_recommendations").delete().eq("user_id", user.id).execute()

        rows = []
        now  = datetime.datetime.now().isoformat()

        for rec in parsed:
            rows.append({
                "id":                   str(uuid.uuid4()),
                "user_id":              user.id,
                "degree_name":          rec["degree_name"],
                "university_name":      rec["university_name"],
                "atar_requirement":     int(float(rec["atar_requirement"])),
                "suitability_score":    int(float(rec["suitability_score"])),
                "est_completion_years": rec.get("estimated_completion_time", 3.0),
                "reason":               rec.get("reason"),
                "sources":              rec.get("source"),
                "link":                 rec.get("link"),
                "created_at":           now,
            })
        supabase.table("degree_recommendations").insert(rows).execute()

        return {"status": "success", "recommendations": rows}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[get_recommendation_prompts] Failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")
    finally:
        release_recommendation_run(user.id)


@router.post("/{rec_id}/explain")
async def explain_rec(rec_id: str, user=Depends(get_current_user)):
    """Manual retry endpoint for a single recommendation's explain step."""
    await explain_recommendation(rec_id, user)
    return {"status": "ok"}

import datetime
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
from app.core.auth import get_current_user
from app.core.database import supabase
from app.llm.openai_client import ask_gpt_async
from app.llm.json_parsing import extract_json
from app.services.user_profile import get_user_info, get_student_type
from app.services.recommendation import (
    claim_recommendation_run,
    explain_recommendation,
    release_recommendation_run,
    run_all_explains,
)

router = APIRouter()


# ── routes ───────────────────────────────────────────────────────────────────

@router.post("/prompt")
async def get_recommendation_prompts(
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
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
                "Return EXACTLY 4 recommended career roles, no more, no less, as a JSON array. Each object must have:\n"
                "career_title (string), industry (string), suitability_score (int 0-100), "
                "reason (string, plain sentences only, no em dashes), avg_salary_range (string), education_required (string), "
                "skills_needed (array of strings), link (string), source (string).\n\n"
                "STRICT FORMAT for avg_salary_range: MUST be exactly \"$X,XXX - $Y,YYY\" in AUD. "
                "No qualifiers, no plus signs, no parentheticals, no ranges within ranges, no words like "
                "\"varies\", \"up to\", \"approx\", \"depending on\". Pick a single realistic AUD range and commit to it, "
                "even if the actual salary varies widely in practice. If genuinely unknown, use \"$60,000 - $90,000\". "
                "Valid: \"$75,000 - $110,000\". Invalid: \"$50,000 - $150,000+ (varies widely)\", \"$80k - $120k\", \"$90,000+\".\n\n"
                "Respond with only a raw JSON array — no markdown, no explanation, no em dashes anywhere."
            )
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

        # Both university and high_school use GPT-4o mini
        recommendation_raw = await ask_gpt_async(prompt, max_tokens=2000)

        try:
            parsed = extract_json(recommendation_raw)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error parsing recommendation JSON: {e}\nRaw: {recommendation_raw[:500]}",
            ) from e

        # ── Wipe existing data so this endpoint is fully idempotent ──────────────
        # Deleting rec rows cascades the detail rows too (or we delete both explicitly).
        if student_type == "high_school":
            existing = supabase.table("degree_recommendations").select("id").eq("user_id", user.id).execute()
            if existing.data:
                old_ids = [r["id"] for r in existing.data]
                supabase.table("degree_rec_details").delete().in_("id", old_ids).execute()
            supabase.table("degree_recommendations").delete().eq("user_id", user.id).execute()
        else:
            existing = supabase.table("career_recommendations").select("id").eq("user_id", user.id).execute()
            if existing.data:
                old_ids = [r["id"] for r in existing.data]
                supabase.table("career_rec_details").delete().in_("id", old_ids).execute()
            supabase.table("career_recommendations").delete().eq("user_id", user.id).execute()

        rows = []
        now  = datetime.datetime.now().isoformat()

        if student_type == "high_school":
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

        elif student_type == "university":
            for rec in parsed:
                rows.append({
                    "id":                 str(uuid.uuid4()),
                    "user_id":            user.id,
                    "career_title":       rec["career_title"],
                    "industry":           rec["industry"],
                    "suitability_score":  rec["suitability_score"],
                    "reason":             rec.get("reason"),
                    "avg_salary_range":   rec["avg_salary_range"],
                    "education_required": rec["education_required"],
                    "skills_needed":      rec["skills_needed"],
                    "link":               rec.get("link"),
                    "source":             rec.get("source"),
                    "created_at":         now,
                })
            supabase.table("career_recommendations").insert(rows).execute()

        # One background task runs ALL explains concurrently via asyncio.gather
        background_tasks.add_task(run_all_explains, rows, user)

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

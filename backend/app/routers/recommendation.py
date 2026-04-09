import asyncio
import datetime
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

logger = logging.getLogger(__name__)
from dependencies import get_current_user
from app.utils.database import supabase
from app.utils.openai_client import ask_gpt_async
from app.utils.parse_llm import extract_json
from .user import get_user_info, get_student_type

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────

def _fetch_report_safe(report_table: str, user_id: str) -> str:
    """Fetch report analysis without crashing when no report exists."""
    try:
        resp = (
            supabase.table(report_table)
            .select("analysis")
            .eq("user_id", user_id)
            .maybe_single()   # returns None instead of throwing when no row
            .execute()
        )
        if resp and resp.data:
            return str(resp.data)
    except Exception as e:
        print(f"[explain_rec] report fetch error (non-fatal): {e}")
    return "Student did not provide a report. Ignore this part for now."


async def _explain_rec_inner(rec_id: str, user) -> None:
    """
    Core explain logic — called concurrently for all recs in a single
    background task. Uses async Claude client so it never blocks the loop.
    """
    try:
        print(f"[explain_rec] ── START {rec_id} ──────────────────────────")
        student_type = await get_student_type(user)
        user_info    = await get_user_info(user, student_type)
        print(f"[explain_rec] student_type={student_type}")
        print(f"[explain_rec] user_info keys: {list(user_info.keys()) if isinstance(user_info, dict) else type(user_info)}")

        if student_type == "high_school":
            table          = "degree_recommendations"
            report_table   = "school_report_analysis"
            response_table = "degree_rec_details"
        else:
            table          = "career_recommendations"
            report_table   = "transcript_analysis"
            response_table = "career_rec_details"

        # ── Cache check: skip Claude if details already exist ────────────
        cached = (
            supabase.table(response_table)
            .select("id")
            .eq("id", rec_id)
            .maybe_single()
            .execute()
        )
        if cached and cached.data:
            print(f"[explain_rec] cache hit — {rec_id} already in {response_table}, skipping.")
            return

        # Fetch the recommendation row
        rec_resp = (
            supabase.table(table)
            .select("*")
            .eq("id", rec_id)
            .maybe_single()
            .execute()
        )
        if not rec_resp or not rec_resp.data:
            print(f"[explain_rec] ✗ rec {rec_id} not found in {table}, skipping.")
            return

        recommendation = rec_resp.data
        print(f"[explain_rec] recommendation fetched: {list(recommendation.keys())}")

        # ── Slim down inputs to only what the prompt needs ───────────────
        if student_type == "high_school":
            profile = {
                "year":             user_info.get("year"),
                "atar":             user_info.get("atar"),
                "academic_strengths": user_info.get("academic_strengths"),
                "hobbies":          user_info.get("hobbies"),
                "career_interests": user_info.get("career_interests"),
                "degree_interests": user_info.get("degree_interest"),
                "confidence":       user_info.get("confidence"),
            }
            rec = {
                "degree_name":      recommendation.get("degree_name"),
                "university_name":  recommendation.get("university_name"),
                "atar_requirement": recommendation.get("atar_requirement"),
                "suitability_score": recommendation.get("suitability_score"),
                "reason":           recommendation.get("reason"),
            }
        else:
            profile = {
                "degree_field":  user_info.get("degree_field"),
                "degree_stage":  user_info.get("degree_stage"),
                "academic_year": user_info.get("academic_year"),
                "wam":           user_info.get("wam"),
                "interests":     user_info.get("interest_areas"),
                "hobbies":       user_info.get("hobbies"),
                "confidence":    user_info.get("confidence"),
            }
            rec = {
                "career_title":       recommendation.get("career_title"),
                "industry":           recommendation.get("industry"),
                "suitability_score":  recommendation.get("suitability_score"),
                "reason":             recommendation.get("reason"),
                "avg_salary_range":   recommendation.get("avg_salary_range"),
                "education_required": recommendation.get("education_required"),
                "skills_needed":      recommendation.get("skills_needed"),
            }

        # ── Fetch report and conditionally include it ────────────────────
        report_raw = _fetch_report_safe(report_table, user.id)
        has_report = "did not provide" not in report_raw
        print(f"[explain_rec] report fetched (len={len(report_raw)}, has_report={has_report})")

        report_section = f"\n2. Report Analysis:\n{report_raw}\n" if has_report else ""
        rec_section_num = "3" if has_report else "2"

        if student_type == "high_school":
            prompt = f"""
You are an expert academic advisor. You have the following inputs:

1. Student Profile:
{profile}
{report_section}
{rec_section_num}. Recommendation Record:
{rec}

Task: Produce only a single valid JSON object (no markdown fences, no commentary) with these keys:
- explanation (string): 3 sentences max. Warm narrative tying the student profile to the recommendation. Do not repeat information already in the recommendation record (e.g. do not restate the ATAR or university name). Do not use phrases like "With a suitability score of X/100" or "This degree is an excellent match". Write in plain, friendly sentences.
- insights (object): average_mark (number), top_subjects (array), career_interests (array), degree_interests (array), bottom_subjects (array)
- score_breakdown (object): academic_match (string), interest_fit (string), career_outlook (string). Each value is a percentage integer as a string e.g. "35%". All three must add to 100%. One sentence each, no padding.
- specialisations (array of strings)
- career_pathways (array of strings)
- entry_requirements (string): 2 sentences max.
- next_steps (array of strings): 5 items maximum. Consolidate related actions into one step where possible. Each step must be specific, actionable, and high-impact. No filler steps like "update LinkedIn" or "reach out to career centre" unless nothing more important exists.
- resources (array of URL strings): 6 max
- summary (string): 2 sentences max. Concise degree summary similar to a university handbook entry.

Style rules that apply to every string value in the response:
- Do not use em dashes (—), en dashes (–), or double hyphens (--) anywhere.
- Do not use phrases like "With a suitability score of X/100", "This is an excellent match", or any phrase that repeats data already shown in the recommendation record.

Output raw JSON only.
"""
        else:
            prompt = f"""
You are an expert university career advisor. You have the following inputs:

1. Student Profile:
{profile}
{report_section}
{rec_section_num}. Recommendation Record:
{rec}

Task: Produce only a single valid JSON object (no markdown fences, no commentary) with these keys:
- explanation (string): 3 sentences max. Warm narrative personalised to the student. Do not repeat information already in the recommendation record (e.g. do not restate the salary range or industry). Do not use phrases like "With a suitability score of X/100" or "This role is an excellent match". Write in plain, friendly sentences.
- companies (array of strings): 6 max
- insights (object): current_WAM (number), top_courses (array), bottom_courses (array), skills_matched (array), experience_matched (array)
- score_breakdown (object): academic_performance (string), skill_match (string), market_demand (string). Each value is a percentage integer as a string e.g. "35%". All three must add to 100%. One sentence each, no padding.
- job_opportunity (string): 2 sentences max. Brief description of the job market opportunity for this role.
- next_steps (array of strings): 5 items maximum. Consolidate related actions into one step where possible. Each step must be specific, actionable, and high-impact. No filler steps like "update LinkedIn" or "reach out to career centre" unless nothing more important exists.
- resources (array of URL strings): 6 max
- summary (string): 2 sentences max. Concise career role summary.

Style rules that apply to every string value in the response:
- Do not use em dashes (—), en dashes (–), or double hyphens (--) anywhere.
- Do not use phrases like "With a suitability score of X/100", "This is an excellent match", or any phrase that repeats data already shown in the recommendation record.

Output raw JSON only.
"""

        print(f"[explain_rec] prompt length (chars): {len(prompt)}")
        print(f"[explain_rec] calling Claude (max_tokens=1500, temperature=0.5)…")

        raw_response = await ask_gpt_async(prompt, max_tokens=1500, temperature=0.5)

        logger.debug("[explain_rec] raw_response length: %d chars", len(raw_response))

        try:
            parsed = extract_json(raw_response)
            print(f"[explain_rec] JSON parsed OK — keys: {list(parsed.keys())}")
        except Exception as parse_err:
            print(f"[explain_rec] ✗ JSON parse FAILED: {parse_err}")
            print(f"[explain_rec] FULL raw response:\n{raw_response}")
            print(f"[explain_rec] retrying with stricter prompt…")
            raw_response = await ask_gpt_async(
                prompt + "\n\nIMPORTANT: Your previous response could not be parsed. Output ONLY a raw JSON object — no text before or after, no markdown fences, no explanation.",
                max_tokens=1500,
                temperature=0.2,
            )
            print(f"[explain_rec] retry raw_response first 300:\n{raw_response[:300]}")
            parsed = extract_json(raw_response)
            print(f"[explain_rec] retry JSON parsed OK — keys: {list(parsed.keys())}")

        if student_type == "high_school":
            details = {
                "id":               rec_id,
                "explanation":      parsed["explanation"],
                "insights":         parsed["insights"],
                "score_breakdown":  parsed["score_breakdown"],
                "specialisations":  parsed.get("specialisations", []),
                "career_pathways":  parsed.get("career_pathways", []),
                "entry_requirements": parsed.get("entry_requirements", ""),
                "next_steps":       parsed.get("next_steps", []),
                "resources":        parsed.get("resources", []),
                "summary":          parsed.get("summary", ""),
            }
        else:
            details = {
                "id":              rec_id,
                "explanation":     parsed["explanation"],
                "companies":       parsed.get("companies", []),
                "insights":        parsed["insights"],
                "score_breakdown": parsed["score_breakdown"],
                "job_opportunity": parsed.get("job_opportunity", ""),
                "next_steps":      parsed.get("next_steps", []),
                "resources":       parsed.get("resources", []),
                "summary":         parsed.get("summary", ""),
            }

        print(f"[explain_rec] upserting to {response_table}…")
        upsert_resp = supabase.table(response_table).upsert(details).execute()
        print(f"[explain_rec] upsert response: {upsert_resp}")
        print(f"[explain_rec] ✓ {rec_id} written to {response_table}")

    except Exception as e:
        import traceback
        print(f"[explain_rec] ✗ {rec_id} EXCEPTION: {type(e).__name__}: {e}")
        print(traceback.format_exc())


async def _run_all_explains(rows: list, user) -> None:
    """Run all explain tasks concurrently — total time ≈ 1 Claude call, not N."""
    await asyncio.gather(*[_explain_rec_inner(row["id"], user) for row in rows])


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("/prompt")
async def get_recommendation_prompts(
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    try:
        student_type = await get_student_type(user)
        user_info    = await get_user_info(user, student_type)

        if not student_type or not user_info:
            raise HTTPException(status_code=401, detail="Invalid User")

        if student_type == "university":
            prompt = (
                "You are a university career advisor for UNSW students. Based on this student's profile:\n\n"
                f"• Field / Stage / Year: {user_info['degree_field']} / {user_info['degree_stage']} / {user_info['academic_year']}\n"
                f"• WAM: {user_info['wam']}\n"
                f"• Interests: {user_info['interest_areas']}\n"
                f"• Hobbies: {user_info['hobbies']}\n"
                f"• Confidence: {user_info['confidence']}\n\n"
                "Return EXACTLY 4 recommended career roles, no more, no less, as a JSON array. Each object must have:\n"
                "career_title (string), industry (string), suitability_score (int 0-100), "
                "reason (string, plain sentences only, no em dashes), avg_salary_range (string), education_required (string), "
                "skills_needed (array of strings), link (string), source (string).\n\n"
                "Respond with only a raw JSON array — no markdown, no explanation, no em dashes anywhere."
            )
        elif student_type == "high_school":
            prompt = (
                "You are a high school academic advisor. Based on this student's profile:\n\n"
                f"• Year: {user_info['year']}\n"
                f"• Academic strengths: {user_info['academic_strengths']}\n"
                f"• ATAR: {user_info['atar']}\n"
                f"• Hobbies: {user_info['hobbies']}\n"
                f"• Career interests: {user_info['career_interests']}\n"
                f"• Degree interests: {user_info['degree_interest']}\n"
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
        background_tasks.add_task(_run_all_explains, rows, user)

        return {"status": "success", "recommendations": rows}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[get_recommendation_prompts] Failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")


@router.post("/{rec_id}/explain")
async def explain_rec(rec_id: str, user=Depends(get_current_user)):
    """Manual retry endpoint for a single recommendation's explain step."""
    await _explain_rec_inner(rec_id, user)
    return {"status": "ok"}

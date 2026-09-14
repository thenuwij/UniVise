import asyncio
import logging

from app.core.database import supabase
from app.llm.openai_client import ask_gpt_async
from app.llm.json_parsing import extract_json
from app.services.user_profile import get_user_info, get_student_type

logger = logging.getLogger(__name__)


async def explain_recommendation(rec_id: str, user) -> None:
    """
    Core explain logic — called concurrently for all recs in a single
    background task. Uses async Claude client so it never blocks the loop.
    """
    try:
        logger.info(f"[explain_rec] ── START {rec_id} ──────────────────────────")
        student_type = await get_student_type(user)
        user_info    = await get_user_info(user, student_type)
        logger.info(f"[explain_rec] student_type={student_type}")
        logger.info(f"[explain_rec] user_info keys: {list(user_info.keys()) if isinstance(user_info, dict) else type(user_info)}")

        if student_type == "high_school":
            table          = "degree_recommendations"
            response_table = "degree_rec_details"
        else:
            table          = "career_recommendations"
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
            logger.info(f"[explain_rec] cache hit — {rec_id} already in {response_table}, skipping.")
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
            logger.warning(f"[explain_rec] ✗ rec {rec_id} not found in {table}, skipping.")
            return

        recommendation = rec_resp.data
        logger.info(f"[explain_rec] recommendation fetched: {list(recommendation.keys())}")

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
                "interests":     user_info.get("interest_areas"),
                "hobbies":       user_info.get("hobbies"),
                "priorities":    user_info.get("priorities"),
                "work_style":    user_info.get("work_style"),
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

        if student_type == "high_school":
            prompt = f"""
You are an expert academic advisor. You have the following inputs:

1. Student Profile:
{profile}

2. Recommendation Record:
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

2. Recommendation Record:
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

        logger.info(f"[explain_rec] prompt length (chars): {len(prompt)}")
        logger.info("[explain_rec] calling Claude (max_tokens=1500, temperature=0.5)…")

        raw_response = await ask_gpt_async(prompt, max_tokens=1500, temperature=0.5)

        logger.debug("[explain_rec] raw_response length: %d chars", len(raw_response))

        try:
            parsed = extract_json(raw_response)
            logger.info(f"[explain_rec] JSON parsed OK — keys: {list(parsed.keys())}")
        except Exception as parse_err:
            logger.error(f"[explain_rec] ✗ JSON parse FAILED: {parse_err}")
            logger.debug(f"[explain_rec] FULL raw response:\n{raw_response}")
            logger.warning("[explain_rec] retrying with stricter prompt…")
            raw_response = await ask_gpt_async(
                prompt + "\n\nIMPORTANT: Your previous response could not be parsed. Output ONLY a raw JSON object — no text before or after, no markdown fences, no explanation.",
                max_tokens=1500,
                temperature=0.2,
            )
            logger.debug(f"[explain_rec] retry raw_response first 300:\n{raw_response[:300]}")
            parsed = extract_json(raw_response)
            logger.debug(f"[explain_rec] retry JSON parsed OK — keys: {list(parsed.keys())}")

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

        logger.info(f"[explain_rec] upserting to {response_table}…")
        upsert_resp = supabase.table(response_table).upsert(details).execute()
        logger.info(f"[explain_rec] upsert response: {upsert_resp}")
        logger.info(f"[explain_rec] ✓ {rec_id} written to {response_table}")

    except Exception as e:
        logger.exception(f"[explain_rec] {rec_id} failed: {type(e).__name__}: {e}")


async def run_all_explains(rows: list, user) -> None:
    """Run all explain tasks concurrently — total time ≈ 1 Claude call, not N."""
    await asyncio.gather(*[explain_recommendation(row["id"], user) for row in rows])

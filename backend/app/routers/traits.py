from fastapi import APIRouter, Depends, HTTPException, status
from dependencies import get_current_user
from app.utils.database import supabase
from app.utils.openai_client import ask_openai
from postgrest.exceptions import APIError  # catch DB errors

router = APIRouter()


@router.get("/results")
def result_description(user=Depends(get_current_user)):
    try:
        # 1) Fetch existing results for this user
        resp = (
            supabase.table("personality_results")
            .select("*")
            .eq("user_id", user.id)
            .execute()
        )
    except APIError as e:
        raise HTTPException(status_code=500, detail=str(e))

    rows = resp.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No personality results found for this user.",
        )

    row = rows[0]
    top_types = row.get("top_types")
    trait_scores = row.get("trait_scores")
    result_summary = row.get("result_summary")

    # 2) Build prompt
    prompt = f"""
    You are UniVise's Personality Trait Advisor.
    A student has completed a RIASEC Holland Code personality quiz and received the following results:
    - Top Personality Types: {top_types}
    - Trait_Scores: {trait_scores}
    - Result_Summary: {result_summary}

    Based on these results, provide a concise and clear explanation of what the result_summary (e.g artistic-investigate, realistic-social) means for the student's career and study choices.
    Highlight the student's strengths and suggest suitable career paths and fields of study that align with their personality traits.
    Keep the response under 300 words and use a friendly, encouraging tone.
    Format the response in a string without markdown or code blocks.
    
    Example Output:
    This means you have a blend of Artistic and Investigative traits, making you well-suited for careers that involve creativity and analytical thinking. You likely enjoy exploring new ideas, expressing yourself through various art forms, and solving complex problems.
    Suitable career paths include graphic design, architecture, writing, research, and roles in the tech industry that require innovative thinking.
    Consider studying subjects like fine arts, computer science, psychology, or engineering to further develop your skills and interests.
    """

    resp_text = ask_openai(prompt)

    # 3) Update description for this row
    try:
        supabase.table("personality_results").update({"description": resp_text}).eq(
            "user_id", user.id
        ).execute()
    except APIError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update description: {str(e)}"
        )

    return {"status": "success", "description": resp_text}

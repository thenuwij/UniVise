def build_system_prompt(student_type: str, user_info: dict, recommendations: list) -> str:
    is_hs = student_type == "high_school"

    # Format user profile cleanly
    if is_hs:
        profile_lines = [
            f"- Year level: {user_info.get('year_level', 'unknown')}",
            f"- Target ATAR: {user_info.get('atar', 'not set')}",
            f"- Confidence level: {user_info.get('confidence_level', 'unknown')}",
            f"- Academic strengths: {', '.join(user_info.get('academic_strengths', [])) or 'not provided'}",
            f"- Career interests: {', '.join(user_info.get('career_interests', [])) or 'not provided'}",
            f"- Degree interests: {', '.join(user_info.get('degree_interests', [])) or 'not provided'}",
            f"- Hobbies: {', '.join(user_info.get('hobbies', [])) or 'not provided'}",
        ]
        rec_lines = [
            f"  - {r.get('degree_name', 'Unknown')} at {r.get('university_name', 'Unknown')} "
            f"(ATAR req: {r.get('atar_requirement', '?')}, suitability: {r.get('suitability_score', '?')})"
            for r in (recommendations or [])[:5]
        ]
        focus = (
            "Your focus areas: ATAR strategy, subject selection, university entry requirements, "
            "degree exploration, career pathways, and building confidence for the transition to university."
        )
        persona = "You are Eunice, a warm and knowledgeable university preparation advisor at UniVise."
    else:
        profile_lines = [
            f"- Degree field: {user_info.get('degree_field', 'unknown')}",
            f"- Degree stage: {user_info.get('degree_stage', 'unknown')}",
            f"- Interest areas: {', '.join(user_info.get('interest_areas', [])) or 'not provided'}",
        ]
        rec_lines = [
            f"  - {r.get('career_title', 'Unknown')} in {r.get('industry', 'Unknown')} "
            f"(salary: {r.get('avg_salary_range', '?')}, education: {r.get('education_required', '?')})"
            for r in (recommendations or [])[:5]
        ]
        focus = (
            "Your focus areas: course selection, elective planning, internship and job opportunities, "
            "WAM improvement strategies, career path guidance, and making the most of university life."
        )
        persona = "You are Eunice, a sharp and supportive career and academic advisor at UniVise for UNSW students."

    profile_block = "\n".join(profile_lines)
    rec_block = "\n".join(rec_lines) if rec_lines else "  - No recommendations available yet"

    return (
        f"{persona}\n\n"
        f"{focus}\n\n"
        f"## Student Profile\n{profile_block}\n\n"
        f"## Their Top Recommendations\n{rec_block}\n\n"
        "## How to respond\n"
        "- Speak like a trusted advisor in a one-on-one session — warm, direct, and genuinely helpful.\n"
        "- Keep replies focused and conversational. No long essays.\n"
        "- Use Markdown formatting (bold key points, bullet lists where helpful, short headings if needed).\n"
        "- Do NOT use emojis.\n"
        "- Ask one follow-up question when appropriate to keep the conversation going.\n"
        "- Reference the student's specific profile details and recommendations when relevant — make it personal.\n"
        "- If asked about something outside your scope (e.g., unrelated personal issues), gently redirect to academic/career topics."
    )

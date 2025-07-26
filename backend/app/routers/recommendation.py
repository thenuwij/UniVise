import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from dependencies import get_current_user
from app.utils.database import supabase
from .user import get_user_info, get_student_type
from app.utils.openai_client import ask_openai
from app.models.schemas import ExplainRequest

import json
import uuid
import re

router = APIRouter()


@router.get("/prompt")
async def get_recommendation_prompts(
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    student_type = await get_student_type(user)
    user_info = await get_user_info(user, student_type)

    if not student_type or not user_info:
        raise HTTPException(status_code=401, detail="Invalid User")

    if student_type == "university":
        prompt = (
            "You are a university career advisor for UNSW students helping a student explore future job and career options. Based on their profile:\n\n"
            f"• Current field: {user_info['degree_field']} / {user_info['degree_stage']} / {user_info['academic_year']}\n"
            f"• Current WAM: {user_info['wam']}\n"
            f"• Opinion on Studying current degree: {user_info['study_feelings']}\n"
            f"• Study & Career interests: {user_info['interest_areas']} / {user_info['interest_areas_other']}\n"
            f"• Hobbies: {user_info['hobbies']} / {user_info['hobbies_other']}\n"
            f"• Confidence in career direction: {user_info['confidence']}\n\n"
            f"• Needs help with career direction: {user_info['want_help']}\n\n"
            "Using this information, return 4-5 recommended career roles as a JSON array."
            " For each recommendation, return a JSON object with:\n"
            "career_title: string — The name of the job role (e.g. Software Engineer"
            "industry: string — The industry this job is in (e.g. Technology)"
            "suitability_score: int — A score from 0 to 100 indicating how well this matches the student\n"
            "reason: string — A detailed explanation of why this job is a good fit for the student\n"
            "avg_salary_range: number — Estimated starting salary for this role (e.g. 80000)\n"
            "education_required: string — The education level required for this role (e.g. Bachelor's degree in Computer Science)\n"
            "skills_needed: array — A list of key skills needed for this role (e.g"
            "reason: string — A detailed explanation of why this job is a good fit for the student\n\n"
            "link: string — A link to a job description or career page for this role\n\n"
            "source: string — The source of the recommendation (e.g. UNSW Career Services)\n\n"
            "Respond only with valid JSON in this format, no explanation or extra text:\n"
            "[\n"
            "  {\n"
            '    "career_title": "Software Engineer",\n'
            '    "industry": "Technology",\n'
            '    "suitability_score": 95,\n'
            '    "reason": "This role aligns with your interests in software development and your current studies.",\n'
            '    "avg_salary_range": 80000-120000,\n'
            '    "education_required": "Bachelor\'s degree in Computer Science or related field",\n'
            '    "skills_needed": ["Python", "Java", "Problem Solving"],\n'
            '    "link": "https://www.unsw.edu.au/careers/jobs/software-engineer",\n'
            '    "source": "UNSW Career Services"\n'
            "  }\n"
            "]"
        )

    elif student_type == "high_school":
        prompt = (
            "You are a highschool advisor for university major selection. A high school student has shared the following profile:\n\n"
            f"• Year level: {user_info['year']}\n"
            f"• Academic strengths: {user_info['academic_strengths']}\n"
            f"• ATAR goal or estimate: {user_info['atar']}\n"
            f"• Hobbies: {user_info['hobbies']}\n"
            f"• Career interests: {user_info['career_interests']}\n"
            f"• Degree interests: {user_info['degree_interest']}\n"
            f"• Confidence in future direction: {user_info['confidence']}\n\n"
            "Using this information, return 4–5 recommended degrees as a JSON array. "
            "For each recommendation, return a JSON object with:\n"
            "degree_name: string — The name of the degree (e.g. Bachelor of Computer Science)"
            "university_name: string — The full university name (e.g. University of Sydney)"
            "atar_requirement: int — The ATAR requirement for this degree (e.g. 90.00)\n"
            "suitability_score: int — A score from 0 to 100 indicating how well this matches the student\n"
            "estimated_completion_time: number — Estimated time to complete this degree (e.g. 3 years full-time)\n"
            "reason: string — A detailed explanation of why this degree is a good fit for the student\n\n"
            "link: string — A link to the degree page on the university website\n\n"
            "source: string — The source of the recommendation (e.g. UNSW Career Services)\n\n"
            "Respond only with valid JSON in this format, no explanation or extra text:\n"
            "[\n"
            "  {\n"
            '    "degree_name": "Bachelor of Commerce",\n'
            '    "university_name": "University of Sydney",\n'
            '    "atar_requirement": 85,\n'
            '    "suitability_score": 92,\n'
            '    "estimated_completion_time": 3.0,\n'
            '    "reason": "This degree aligns with your interests in business and finance.",\n'
            '    "link": "https://www.sydney.edu.au/courses/courses/uc/bachelor-of-commerce.html",\n'
            '    "source": "University of Sydney Handbook"\n'
            "  }\n"
            "]"
        )
    else:
        raise HTTPException(status_code=400, detail="Unknown student type")
    recommendation = ask_openai(prompt)

    if student_type == "high_school":
        cleaned = recommendation.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(
                r"^```json|^```|```$", "", cleaned, flags=re.MULTILINE
            ).strip()

        try:
            parsed = json.loads(cleaned)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error parsing recommendation: {str(e)}\nRaw output: {recommendation}",
            ) from e

        rows = []
        for rec in parsed:
            row = {
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "degree_name": rec["degree_name"],
                "university_name": rec["university_name"],
                "atar_requirement": rec["atar_requirement"],
                "suitability_score": rec["suitability_score"],
                "est_completion_years": rec.get("estimated_completion_time", 3.0),
                "reason": rec.get("reason"),
                "sources": rec.get("source"),
                "link": rec.get("link"),
                "created_at": datetime.datetime.now().isoformat(),
            }
            rows.append(row)

        response = supabase.table("degree_recommendations").insert(rows).execute()

        for row in rows:
            background_tasks.add_task(explain_rec, row["id"], user)

        if not response:
            raise HTTPException(
                status_code=500,
                detail=f"Error saving recommendations: {response.error.message}",
            )

        return {"status": "success", "recommendations": rows}
    elif student_type == "university":
        cleaned = recommendation.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(
                r"^```json|^```|```$", "", cleaned, flags=re.MULTILINE
            ).strip()

        try:
            parsed = json.loads(cleaned)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error parsing recommendation: {str(e)}\nRaw output: {recommendation}",
            ) from e
        rows = []
        for rec in parsed:
            row = {
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "career_title": rec["career_title"],
                "industry": rec["industry"],
                "suitability_score": rec["suitability_score"],
                "reason": rec.get("reason"),
                "avg_salary_range": rec["avg_salary_range"],
                "education_required": rec["education_required"],
                "skills_needed": rec["skills_needed"],
                "link": rec.get("link"),
                "source": rec.get("source"),
                "created_at": datetime.datetime.now().isoformat(),
            }
            rows.append(row)

        response = supabase.table("career_recommendations").insert(rows).execute()

        for row in rows:
            background_tasks.add_task(explain_rec, row["id"], user)

        if not response:
            raise HTTPException(
                status_code=500,
                detail=f"Error saving recommendations: {response.error.message}",
            )
        recommendation = {
            "status": "success",
            "recommendations": rows,
        }

    return recommendation


@router.post("/{rec_id}/explain")
async def explain_rec(rec_id: str, user=Depends(get_current_user)):
    student_type = await get_student_type(user)
    user_info = await get_user_info(user, student_type)

    if not student_type or not user_info:
        raise HTTPException(status_code=401, detail="Invalid User")

    if student_type == "high_school":
        table = "degree_recommendations"
        report_table = "school_report_analysis"
        response_table = "degree_rec_details"
    else:
        table = "career_recommendations"
        report_table = "transcript_analysis"
        response_table = "career_rec_details"

    recommendation = (
        supabase.table(table).select("*").eq("id", rec_id).single().execute()
    )

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not Found")

    report = (
        supabase.table(report_table)
        .select("analysis")
        .eq("user_id", user.id)
        .single()
        .execute
    )

    if not report:
        report = "Student did not provide a report. Ignore this part for now"

    if student_type == "high_school":
        prompt = f"""
            You are an expert academic advisor. You have three inputs:

            1. User Profile & Survey:
            {user_info}

            2. Report Analysis – a JSON object with:
            {report}

            3. Recommendation Record:
            {recommendation}

            Task: Produce only a single valid JSON object (no markdown, no commentary) with these keys:

            - `explanation` (string): a warm narrative that ties profile + report analysis to the recommendation (balance career and degree interests as much as report marks).  
            - `insights` (object):
                - `average_mark` (number)  
                - `top_subjects` (array of strings)  
                - `career_interests` (array of strings)  
                - `degree_interests` (array of strings)  
                - `bottom_subjects` (array of strings)  
            - `score_breakdown` (object):
                - `academic_match` (string)  
                - `interest_fit` (string)  
                - `career_outlook` (string)  
            - `specialisations` (array of strings)  
            - `career_pathways` (array of strings)  
            - `entry_requirements` (string)  
            - `next_steps` (array of strings)  
            - `resources` (array of strings: URLs)  

            Example Format:
            {{
            "explanation": "With an outstanding average mark of 92.5 and top scores in Maths Advanced, Physics, and Chemistry, you demonstrate the analytical rigor this Engineering program demands. Your strengths in quantitative reasoning and lab work align perfectly with hands-on projects in UNSW’s Engineering faculty. While your English and History marks lag slightly, targeted essay practice and structured study sessions will close that gap. Overall, your profile and report show you’re ideally positioned to excel in a Bachelor of Engineering (Honours).",
            "insights": {{
                "average_mark": 92.5,
                "top_subjects": ["Maths Advanced", "Physics", "Chemistry"],
                "career_interests": ["Robotics", "AI"],
                "degree_interests": ["Engineering"],
                "bottom_subjects": ["English", "History"]
            }},
            "score_breakdown": {{
                "academic_match": "50% — your marks exceed the 96 ATAR requirement and show mastery of core STEM subjects",
                "interest_fit": "30% — your passion for problem-solving and robotics maps to Mechatronics & Autonomous Systems",
                "career_outlook": "20% — engineering graduates enjoy >95% employment within six months and strong starting salaries"
            }},
            "specialisations": [
                "Robotics & Autonomous Systems",
                "Mechatronics & Intelligent Machines",
                "AI & Data Engineering"
            ],
            "career_pathways": [
                "Mechatronics Engineer at a manufacturing R&D lab",
                "Autonomous Systems Designer in automotive or aerospace",
                "Control Systems Analyst in renewable energy"
            ],
            "entry_requirements": "ATAR ≥ 96; Maths Advanced and Physics prerequisites; 4 years full-time",
            "next_steps": [
                "Book an Engineering faculty info session",
                "Apply for the UNSW Dean’s Scholarship by Sept 15",
                "Join the campus robotics club for hands-on experience"
            ],
            "resources": [
                "https://www.sydney.edu.au/engineering-handbook",
                "https://www.sydney.edu.au/scholarships/deans-scholarship"
            ]
            }}
            """

    elif student_type == "university":
        prompt = f"""
            You are an expert university career advisor. You have three inputs:

            1. User Profile & Survey:
            {user_info}

            2. Report Analysis – a JSON object:
            {report}

            3. Recommendation Record:
            {recommendation}

            Task: Produce only a single valid JSON object (no markdown, no commentary) with these keys:
            - explanation (string)
            - companies (array of strings)
            - insights (object with keys current_WAM, top_courses, bottom_courses, skills_matched, experience_matched)
            - score_breakdown (object with keys academic_performance, skill_match, market_demand)
            - job_opportunity (string)
            - next_steps (array of strings)
            - resources (array of URLs)

        Example output:
            {{
            "explanation": "Your strong WAM of 6.7 in your LLB, combined with high distinctions in Contract Law and Corporate Governance, shows you have the analytical rigor and commercial awareness needed for corporate law. Your summer clerkship at Smith & Partners and active role in the Commercial Law Society demonstrate both practical experience and genuine interest in this field. That blend of academic excellence and hands-on exposure makes Corporate Lawyer a natural recommendation for you.",
            "companies": [
                "MinterEllison",
                "Herbert Smith Freehills",
                "Clayton Utz",
                "King & Wood Mallesons",
                "JP Morgan (Legal Dept.)"
            ],
            "insights": {{
                "current_WAM": 6.7,
                "top_courses": [
                "Contract Law (High Distinction)",
                "Corporate Governance (Distinction)"
                ],
                "bottom_courses": [
                "Property Law (Credit)",
                "Criminal Law (Credit)"
                ],
                "skills_matched": [
                "Legal research & drafting",
                "Contract negotiation",
                "Analytical reasoning"
                ],
                "experience_matched": [
                "Summer clerkship at Smith & Partners",
                "Committee member, Commercial Law Society"
                ]
            }},
            "score_breakdown": {{
                "academic_performance": "40% — your WAM and core corporate unit results exceed benchmarks for graduate roles",
                "skill_match": "30% — your demonstrated research, writing and negotiation skills align precisely with the demands of corporate practice",
                "market_demand": "30% — demand for qualified corporate lawyers remains steady in major firms and in-house teams"
            }},
            "job_opportunity": "Highly competitive — roughly 8–10 applicants per grad role at top firms. Success depends on strong internships, networking and PLT completion.",
            "next_steps": [
                "Complete Practical Legal Training (PLT) to qualify for admission",
                "Apply for graduate programs at top corporate firms",
                "Network at Law Society corporate law events",
                "Publish a sample contract review or client memo in your portfolio"
            ],
            "resources": [
                "https://www.lawsociety.com.au/careers/corporate-law",
                "https://www.abs.gov.au/legal-services-statistics",
                "https://www.university.edu.au/law/handbook/corporate-law"
            ]
            }}
            """

    else:
        raise HTTPException(status_code=400, detail="Unknown student type")

    raw_response = ask_openai(prompt)

    cleaned_response = raw_response.strip()
    if cleaned_response.startswith("```"):
        cleaned_response = re.sub(
            r"^```json|^```|```$", "", cleaned_response, flags=re.MULTILINE
        ).strip()
    try:
        parsed = json.loads(cleaned_response)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing details: {str(e)}\nRaw output: {raw_response}",
        ) from e

    details = {}

    if student_type == "high_school":
        details = {
            "id": rec_id,
            "explanation": parsed["explanation"],
            "insights": parsed["insights"],
            "score_breakdown": parsed["score_breakdown"],
            "specialisations": parsed["specialisations"],
            "career_pathways": parsed["career_pathways"],
            "entry_requirements": parsed["entry_requirements"],
            "next_steps": parsed["next_steps"],
            "resources": parsed["resources"],
        }
    elif student_type == "university":
        details = {
            "id": rec_id,
            "explanation": parsed["explanation"],
            "companies": parsed["companies"],
            "insights": parsed["insights"],
            "score_breakdown": parsed["score_breakdown"],
            "job_opportunity": parsed["job_opportunity"],
            "next_steps": parsed["next_steps"],
            "resources": parsed["resources"],
        }

    response = supabase.table(response_table).upsert(details).execute()

    if not response:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving recommendations: {response.error.message}",
        )

    return details

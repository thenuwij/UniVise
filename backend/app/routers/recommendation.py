import datetime
from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from app.utils.database import supabase
from .user import get_user_info, get_student_type
from app.utils.openai_client import ask_openai
from app.models.schemas import ExplainResponse, ExplainRequest

import json
import uuid
import re

router = APIRouter()


@router.get("/prompt")
async def get_recommendation_prompts(user=Depends(get_current_user)):
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


@router.post("/explain", response_model=ExplainResponse)
async def explain_rec(req: ExplainRequest, user=Depends(get_current_user)):
    student_type = await get_student_type(user)
    user_info = await get_user_info(user, student_type)

    if not student_type or not user_info:
        raise HTTPException(status_code=401, detail="Invalid User")

    if student_type == "high_school":
        table = "degree_recommendations"
    else:
        table = "career_recommendations"

    recommendation = (
        supabase.table(table).select("*").eq("id", req.rec_id).single().execute()
    )

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not Found")

    if student_type == "high_school":
        prompt = f"""
       You are an empathetic, expert academic advisor whose mission is to give a high-school student all the clarity and confidence they need to choose the perfect university degree.
            **Inputs**  
            - The student’s profile from “student_school_data” (ATAR, subject strengths, career interests, extracurriculars, goals, etc.)  {user_info}
            - The degree recommendation record (degree name, university, ATAR requirement, suitability score, estimated completion years, etc.) {recommendation}

            **Task**  
            Write a warm, detailed multi-paragraph narrative that:
            1. **Matches profile → degree:** Point out exactly which pieces of the student’s ATAR, subject strengths, interests, or goals led you to this degree choice.  
            2. **Why this university is #1:** Highlight this school’s program reputation, entry standards, campus culture, support services, or any unique features.  
            3. **Suitability score breakdown:** Explain in plain English how you calculated the suitability score (e.g., 50% academic readiness, 30% interest alignment, 20% career outlook).  
            4. **Example majors or specialisations:** Suggest two or three specialised streams or majors within this degree that fit the student’s interests.  
            5. **Career pathways after graduation:** Describe two realistic job titles or industries the student could enter with this degree.  
            6. **Additional considerations:** Note scholarships, location factors, internship or industry links, or support programs they should explore.  
            7. **Source citations:** List the URLs (university handbook or official course page) you used to inform your recommendation.

            Use encouraging, confidence-building language so the student feels fully equipped to decide on their future degree.
            
            
            Follow the example Output:
                    > **Degree:** Bachelor of Engineering (Honours)  
                    > **University:** University of New South Wales  
                    > **Suitability Score:** 92/100  

                    **Congratulations!** Based on your outstanding ATAR of 95.2 and top-scoring results in Maths Advanced (94) and Physics (88), it’s clear you possess both the numerical aptitude and scientific curiosity that engineering demands. Your leadership as Robotics Club president and your success in the Maths Olympiad demonstrate not only technical skill but also a passion for solving real-world problems.

                    **Why UNSW?** UNSW’s Engineering faculty consistently ranks in the global top 50, offering world-class maker spaces, industry-linked capstone projects, and dedicated student support programs. Its well-established cooperative education (Co-op) scheme will place you with leading tech companies, ensuring you graduate with practical experience and a robust professional network.

                    **Suitability Score Breakdown:**  
                    - **50% Academic Readiness:** Your ATAR and subject scores comfortably exceed the program’s minimum of 98.  
                    - **30% Interest Alignment:** Your extracurriculars and goals map directly onto UNSW’s strong Robotics and Mechatronics streams.  
                    - **20% Career Outlook:** Engineering graduates from UNSW command some of the highest starting salaries in Australia and enjoy a 95% employment rate within six months.

                    **Potential Specialisations:**  
                    - Robotics & Autonomous Systems  
                    - Mechatronics & Intelligent Machines  
                    - AI & Data Engineering

                    **Post-Graduation Careers:**  
                    - Mechatronics Engineer at a manufacturing R&D lab  
                    - Autonomous Systems Designer for automotive or aerospace  
                    - Control Systems Analyst in renewable energy

                    **Additional Considerations:**  
                    Check out the Co-op scholarship options and UNSW’s maker-space workshops. The Kensington campus also offers vibrant student clubs like Formula SAE and AI Hackathons—perfect for building your portfolio.

                    **Sources:**  
                    - UNSW Engineering Handbook: https://www.unsw.edu.au/engineering-handbook  
                    - BE(Hons) course page: https://www.handbook.unsw.edu.au/undergraduate/courses/2025/3800
            """
    elif student_type == "university":
        prompt = f"""
            You are an empathetic, expert career advisor whose mission is to give a university student all the clarity and confidence they need to choose the perfect career path.
                **Inputs**  
                - The student’s profile from “student_uni_data” (current WAM, major, skills, extracurriculars, internships, career goals, etc.):  {user_info}
                - The career recommendation record (career title, industry, suitability score, education required, average salary range, etc.): {recommendation}

                **Task**  
                Write a detailed multi-paragraph explanation that:
                1. **Matches profile → career:** Show exactly which elements of the student’s WAM, skills, internship experience, or goals led you to this career recommendation.  
                2. **Why this field is #1:** Emphasise industry demand, growth outlook, cultural fit, or any standout opportunities in this sector.  
                3. **Suitability score breakdown:** Explain in plain English how you derived the suitability score (e.g., 40% academic performance, 30% skills match, 30% market demand).  
                4. **Career specialisations or roles:** List two or three sub-roles or specialisations within this career path they could pursue.  
                5. **Education or upskilling roadmap:** Outline any further certifications, courses, or postgraduate options that would enhance their prospects.  
                6. **Additional factors:** Mention networking opportunities, professional associations, location/remoteness considerations, or average starting salaries.  
                7. **Source citations:** Provide the URLs (industry reports, government labour data, professional body pages) you used to inform your recommendation.
                
                Respond in only valid JSON format:
                
                    > **Career:** Full-Stack Software Engineer  
                    > **Industry:** Tech / Web Development  
                    > **Suitability Score:** 88/100  

                    **Well done on your progress so far!** Your WAM of 6.8 in Computer Science, combined with hands-on experience as a Frontend Developer at TechCorp, shows you have both the theoretical foundation and practical chops to excel in full-stack roles. Your proficiency in JavaScript, React, and Python gives you a versatile toolkit for end-to-end development.

                    **Why Full-Stack?** The global demand for full-stack engineers continues to grow at over 15% annually, as startups and enterprises alike seek developers who can bridge front-end user experiences with robust back-end systems. Your knack for UI/UX (demonstrated by open-source contributions) and your backend problem-solving make this path an ideal match.

                    **Suitability Score Breakdown:**  
                    - **40% Academic Performance:** Your solid WAM reflects strong algorithmic and architectural understanding.  
                    - **30% Skill Match:** Mastery of React and Python covers the most in-demand front-end and back-end frameworks.  
                    - **30% Market Demand:** Full-stack roles remain among the highest-hiring and best-paid positions in tech.

                    **Specialisation Tracks:**  
                    - Front-End Architect (React, Vue, UX optimisations)  
                    - Back-End Engineer (Django, Flask, microservices)  
                    - DevOps & Cloud (CI/CD pipelines, AWS deployments)

                    **Upskilling Roadmap:**  
                    - AWS Certified Developer badge to deepen cloud expertise.  
                    - Advanced React Patterns course to master performance tuning.  
                    - Docker & Kubernetes workshop for containerisation skills.

                    **Additional Factors:**  
                    Attend local TechConnect meetups to network with hiring managers. Consider remote-friendly internships at companies like RemoteBase. Starting salaries for junior full-stack engineers average A$85K–A$100K in Sydney.

                    **Sources:**  
                    - ABS Labour Force Data: https://www.abs.gov.au/labour-force  
                    - SEEK Career Insights: https://www.seek.com.au/career-advice/software-engineer-salary
        """
    else:
        raise HTTPException(status_code=400, detail="Unknown student type")

    explanation = ask_openai(prompt)

    response = (
        supabase.table(table)
        .update({"explanation": explanation})
        .eq("id", req.rec_id)
        .execute()
    )

    if not response:
        raise HTTPException(
            status_code=400, detail="Could not store explanation in supabase table"
        )

    return ExplainResponse(explanation=explanation)

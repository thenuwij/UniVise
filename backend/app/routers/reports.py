from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from app.utils.database import supabase
from .user import get_user_info, get_student_type
from app.utils.openai_client import ask_openai, ask_gemini


from PyPDF2 import PdfReader
from docx import Document
from PIL import Image
import pytesseract
import io
import datetime
import json

router = APIRouter()


def extract_text_from_file(data: bytes, filename: str) -> str:
    fileName = filename.lower()

    if fileName.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)

    elif fileName.endswith(".docx"):
        doc = Document(io.BytesIO(data))
        texts = [p.text for p in doc.paragraphs]
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    texts.append(cell.text)
        return "\n".join(texts)

    elif (
        fileName.endswith(".png")
        or fileName.endswith(".jpeg")
        or fileName.endswith(".jpg")
        or fileName.endswith(".tiff")
    ):
        img = Image.open(io.BytesIO(data))
        # ensure RGB or grayscale:
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        return pytesseract.image_to_string(img)

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type; only PDF, DOCX, and JPEG/PNG/TIFF images are allowed.",
        )


@router.post("/analyse")
async def analyse_report(user=Depends(get_current_user)):
    student_type = await get_student_type(user)
    user_info = await get_user_info(user, student_type)

    if student_type == "high_school":
        table = "student_school_data"
        report_table = "school_report_analysis"
    else:
        table = "student_uni_data"
        report_table = "transcript_analysis"

    report_path = (
        supabase.table(table)
        .select("report_path")
        .eq("user_id", user.id)
        .single()
        .execute()
    )

    if not report_path:
        raise HTTPException(status_code=404, detail="Report Does Not Exist")

    path = report_path.data["report_path"]

    download = supabase.storage.from_("reports").download(path)

    if not download:
        raise HTTPException(status_code=400, detail="Could not Download")

    raw = download
    report_text = extract_text_from_file(raw, path)

    if student_type == "high_school":
        prompt = f"""
          You are an expert high‐school academic analyst. Analyze the following student report and return **only** a single valid JSON object with these keys:

          - **average_mark** (number): the overall average of all subject marks.  
          - **top_subjects** (array of strings): the three subjects with the highest marks.  
          - **bottom_subjects** (array of strings): the three subjects with the lowest marks.  
          - **strengths** (array of strings): short phrases describing the student’s strongest areas.  
          - **weaknesses** (array of strings): short phrases describing areas needing improvement.  
          - **recommendations** (array of strings): actionable study tips or resources to address weaknesses.

          **High-School Report:**  
          {report_text}
        """
    else:
        prompt = f"""
        You are a seasoned university academic advisor. Analyze the following transcript and return **only** a single valid JSON object with these keys:

        - **current_WAM** (number): the student’s weighted average mark.  
        - **high_achievements** (array of strings): the course codes or names where the student excelled.  
        - **low_performance** (array of strings): the course codes or names with the lowest grades.  
        - **skill_gaps** (array of strings): areas or subjects where additional study would be beneficial.  
        - **recommended_courses** (array of strings): two or three electives or advanced courses to strengthen those gaps.  
        - **academic_summary** (string): a concise paragraph summarizing their overall academic standing and next steps.

        **University Transcript:**  
        {report_text}
      """
    ai_output_str = ask_gemini(prompt)
    text = ai_output_str.strip()
    if text.startswith("```"):
        # remove ```json or ``` at top/bottom
        text = text.strip("```json").strip("```").strip()

    # 1. Parse it into a native dict
    try:
        ai_output = json.loads(text)
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"Could not parse LLM output as JSON: {e}")

    # 2. Upsert in one go (avoids having to check update vs insert yourself)
    upsert_payload = {
        "user_id": user.id,
        "analysis": ai_output,  # dict → JSONB
        "report_path": user_info["report_path"],
        "analysed_at": datetime.datetime.now().isoformat(),
    }

    resp = supabase.table(report_table).upsert(upsert_payload).execute()
    if not resp:
        raise HTTPException(500, f"DB upsert failed: {resp.error.message}")

    return {"analysis": ai_output}

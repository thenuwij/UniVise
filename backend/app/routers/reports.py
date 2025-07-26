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
          You are an expert high‐school academic analyst. Analyse the following student school report and return a detailed analysis on the report. 
          This report will later be used for openAI to read again so return in markdown:

          - **top_subjects** (array of strings): Subjects with the highest marks (2-3 subjects including the results/marks/rank if available).  
          - **bottom_subjects** (array of strings): Subjects with the lowest marks (1-2 subjects).  
          - **strengths** (array of strings): short phrases describing the student’s strongest areas.  
          - **weaknesses** (array of strings): short phrases describing areas needing improvement.  
          - **Evaluation** (string): A strong detailed explanation to what you analysed and can determine based on the results.
          - **Recommendation (string): Recommend Study Habits, which areas to focus on or prioritise and what to do heading forward.

          **High-School Report:**  
          {report_text}
          
          Return  **only** a single valid JSON object.
        """
    else:
        prompt = f"""
        You are a seasoned university academic advisor. Analyse the following transcript and return a detailed analysis on the report.
        This reort will later be used for openAI to read again so return in markdown:

        - **current_WAM** (number): the student’s weighted average mark.  
        - **high_achievements** (array of strings): the course codes or names where the student excelled.  
        - **low_performance** (array of strings): the course codes or names with the lowest grades.    
        - **strengths** (array of strings): short phrases describing the student’s strongest areas.  
        - **weaknesses** (array of strings): short phrases describing areas needing improvement.  
        - **Evaluation** (string): a concise paragraph summarizing their overall academic standing and next steps.
        - **Recommendation (string): Recommend which areas to focus on or prioritise and what to do heading forward.

        **University Transcript:**  
        {report_text}
      
        Return  **only** a single valid JSON object.

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

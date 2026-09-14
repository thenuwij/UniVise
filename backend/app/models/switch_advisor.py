from pydantic import BaseModel


class SwitchAdvisorRequest(BaseModel):
    user_id: str
    base_program_code: str
    base_specialisation_codes: list[str] = []
    target_program_code: str
    target_specialisation_codes: list[str] = []
    comparison_data: dict  # The full response from /compare endpoint


class SwitchAdvisorResponse(BaseModel):
    verdict: str            # "recommended" | "conditional" | "not_recommended"
    verdict_label: str      # Human-friendly label
    summary: str            # 2-3 sentence overview
    key_insights: list[str] # 3-5 bullet points
    pros: list[str]         # Reasons to switch
    cons: list[str]         # Reasons to stay
    action_steps: list[str] # Recommended next steps
    detailed_analysis: str  # 2-3 paragraph deep dive
    # Timeline data passed through from context
    additional_terms: float = 0
    estimated_completion: str = ""
    transfer_rate: float = 0
    courses_transferred: int = 0
    courses_lost: int = 0

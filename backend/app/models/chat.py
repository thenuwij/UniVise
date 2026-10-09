from pydantic import BaseModel, Field


class ReplyRequest(BaseModel):
    page: str | None = Field(default=None, max_length=300)

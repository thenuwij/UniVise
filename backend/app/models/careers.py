from typing import Literal

from pydantic import BaseModel

CareersSource = Literal["adzuna", "ai_jobs", "ai_internships", "ai_networking"]


class WebListing(BaseModel):
    title: str
    organisation: str
    location: str
    url: str
    source_site: str
    date_label: str
    category: str
    summary: str


class WebListings(BaseModel):
    listings: list[WebListing]


class CareersRefreshReq(BaseModel):
    roadmap_id: str
    source: CareersSource


class CareersSourceState(BaseModel):
    source: CareersSource
    status: Literal["done", "running", "failed", "never"]
    stale: bool
    refreshed_at: str | None = None
    items: list[dict] = []


class CareersFeedResponse(BaseModel):
    degree_key: str
    sources: list[CareersSourceState]

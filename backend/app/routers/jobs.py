from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
from app.utils.serpapi_client import get_company_careers_url, get_multiple_company_urls

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class CompanyURLRequest(BaseModel):
    company_name: str


class CompanyURLResponse(BaseModel):
    company_name: str
    careers_url: Optional[str]


class MultipleCompanyURLRequest(BaseModel):
    company_names: List[str]


class MultipleCompanyURLResponse(BaseModel):
    urls: Dict[str, Optional[str]]


@router.post("/company-careers-url", response_model=CompanyURLResponse)
async def get_company_url(request: CompanyURLRequest):
    """
    Get the careers page URL for a specific company.
    
    Args:
        company_name: Name of the company
        
    Returns:
        Company name and careers URL
    """
    try:
        careers_url = get_company_careers_url(request.company_name)
        return CompanyURLResponse(
            company_name=request.company_name,
            careers_url=careers_url
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch company URL: {str(e)}")


@router.post("/multiple-company-urls", response_model=MultipleCompanyURLResponse)
async def get_multiple_urls(request: MultipleCompanyURLRequest):
    """
    Get careers page URLs for multiple companies in one request.
    
    Args:
        company_names: List of company names
        
    Returns:
        Dictionary mapping company names to careers URLs
    """
    try:
        urls = get_multiple_company_urls(request.company_names)
        return MultipleCompanyURLResponse(urls=urls)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch company URLs: {str(e)}")
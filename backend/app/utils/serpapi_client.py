"""
SerpAPI Client for fetching company careers page URLs.
Location: backend/app/utils/serpapi_client.py
"""

import os
import requests
from typing import Optional, Dict, List
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_API_KEY")
SERPAPI_BASE_URL = "https://serpapi.com/search"

# Manual overrides for companies where SerpAPI consistently returns wrong URLs
MANUAL_COMPANY_URLS = {
    "Google": "https://careers.google.com",
    "Microsoft": "https://careers.microsoft.com",
    "Amazon": "https://amazon.jobs",
    "Meta": "https://www.metacareers.com",
    "Apple": "https://www.apple.com/careers",
    "Atlassian": "https://www.atlassian.com/company/careers",
    "Canva": "https://www.canva.com/careers",
    "Commonwealth Bank": "https://www.commbank.com.au/about-us/careers.html",
    "Deloitte": "https://www2.deloitte.com/au/en/pages/careers/articles/join-deloitte.html",
    "PwC": "https://www.pwc.com.au/careers.html",
    "KPMG": "https://home.kpmg/au/en/home/careers.html",
    "EY": "https://www.ey.com/en_au/careers",
    # Add more as you discover issues
}


def get_company_careers_url(company_name: str) -> Optional[str]:
    """
    Fetch the careers/graduate programs page URL for a given company using SerpAPI.
    
    Args:
        company_name: Name of the company to search for
        
    Returns:
        URL to the company's careers page, or None if not found
    """
    # Check manual overrides first
    if company_name in MANUAL_COMPANY_URLS:
        print(f"✓ Using manual override for {company_name}")
        return MANUAL_COMPANY_URLS[company_name]
    
    if not SERPAPI_KEY:
        print("Warning: SERPAPI_API_KEY not configured")
        return None
    
    # Clean company name (remove "Pty Ltd", "Australia", etc.)
    clean_name = company_name.replace(" Pty Ltd", "").replace(" Australia", "").replace(" Group", "").strip()
    
    # Try multiple search queries to find the best careers page
    search_queries = [
        f"{clean_name} careers site:*.com.au OR site:*.com",
        f"{clean_name} graduate programs Australia",
        f"{clean_name} jobs opportunities",
        f"{company_name} careers"
    ]
    
    for query_idx, query in enumerate(search_queries):
        try:
            params = {
                "q": query,
                "api_key": SERPAPI_KEY,
                "num": 8,  # Get top 8 results for better coverage
                "gl": "au",  # Australia
                "hl": "en"   # English
            }
            
            response = requests.get(SERPAPI_BASE_URL, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            organic_results = data.get("organic_results", [])
            
            if not organic_results:
                continue
            
            # Priority 1: Look for URLs with strong career-related keywords
            strong_keywords = ["/careers", "/jobs", "/graduate", "/internship", "/join-us", "/work-with-us"]
            for result in organic_results:
                link = result.get("link", "").lower()
                if any(keyword in link for keyword in strong_keywords):
                    print(f"✓ Found careers URL for {company_name}: {link}")
                    return result.get("link")
            
            # Priority 2: Look for titles with career keywords
            title_keywords = ["career", "jobs", "graduate", "internship", "opportunities", "join", "work at", "work with"]
            for result in organic_results:
                title = result.get("title", "").lower()
                link = result.get("link", "").lower()
                
                if any(keyword in title or keyword in link for keyword in title_keywords):
                    print(f"✓ Found careers URL for {company_name}: {link}")
                    return result.get("link")
            
            # Priority 3: If first query and we have results, return first result (likely homepage)
            if query_idx == 0 and organic_results:
                homepage = organic_results[0].get("link")
                print(f"⚠ Using homepage for {company_name}: {homepage}")
                return homepage
                
        except requests.exceptions.Timeout:
            print(f"⏱ Timeout for '{query}' - trying next query")
            continue
        except requests.exceptions.RequestException as e:
            print(f"✗ SerpAPI request failed for query '{query}': {e}")
            continue
        except Exception as e:
            print(f"✗ Unexpected error in SerpAPI search: {e}")
            continue
    
    print(f"✗ No URL found for {company_name}")
    return None


def get_multiple_company_urls(company_names: List[str]) -> Dict[str, Optional[str]]:
    """
    Fetch careers URLs for multiple companies.
    
    Args:
        company_names: List of company names
        
    Returns:
        Dictionary mapping company names to their careers URLs
    """
    results = {}
    for company in company_names:
        results[company] = get_company_careers_url(company)
    return results
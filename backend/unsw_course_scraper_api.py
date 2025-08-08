import requests
import json

API_URL = "https://api-ap-southeast-2.prod.courseloop.com/publisher/search-academic-items"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Origin": "https://www.handbook.unsw.edu.au",
    "Referer": "https://www.handbook.unsw.edu.au/",
    "User-Agent": "Mozilla/5.0"
}

payload = {
    "siteId": "unsw-prod-pres",
    "query": "",
    "contenttype": "subject",
    "from": 0,
    "size": 20,
    "searchFilters": [
        {
            "filterField": "implementationYear",
            "filterValue": ["2025"],
            "isExactMatch": False
        },
        {
            "filterField": "studyLevelValue",
            "filterValue": ["ugrd"],
            "isExactMatch": False
        },
        {
            "filterField": "active",
            "filterValue": ["1"],
            "isExactMatch": False
        }
    ]
}




response = requests.post(API_URL, headers=HEADERS, json=payload)

if response.status_code == 200:
    data = response.json()
    courses = data.get("items", [])
    print(f"✅ Retrieved {len(courses)} courses\n")
    for course in courses[:5]:
        print(f"{course['academicItemCode']} - {course['title']}")
else:
    print(f"❌ Request failed: {response.status_code}")
    print(response.text)

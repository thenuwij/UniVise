import re
from typing import Dict, List

PROFESSIONAL_BODIES = [
    ("IEEE", "https://www.ieee.org", ["ieee", "institute of electrical and electronics engineers"]),
    ("ACM", "https://www.acm.org", ["acm", "association for computing machinery"]),
    ("Engineers Australia", "https://www.engineersaustralia.org.au", ["engineers australia"]),
    ("Australian Computer Society", "https://www.acs.org.au", ["australian computer society", "acs"]),
    ("Institution of Civil Engineers", "https://www.ice.org.uk", ["institution of civil engineers"]),
    ("IChemE", "https://www.icheme.org", ["icheme", "institution of chemical engineers"]),
    ("IMechE", "https://www.imeche.org", ["imeche", "institution of mechanical engineers"]),
    ("Engineering New Zealand", "https://www.engineeringnz.org", ["engineering new zealand"]),
    ("ASBMB", "https://www.asbmb.org.au", ["asbmb", "australian society for biochemistry and molecular biology"]),
    ("Genetics Society of AustralAsia", "https://genetics.org.au", ["genetics society of australasia"]),
    ("IFST", "https://www.ifst.org", ["ifst", "institute of food science and technology"]),
    ("Dietitians Australia", "https://dietitiansaustralia.org.au", ["dietitians australia"]),
    ("CPA Australia", "https://www.cpaaustralia.com.au", ["cpa australia"]),
    ("Chartered Accountants ANZ", "https://www.charteredaccountantsanz.com", ["chartered accountants anz", "chartered accountants australia and new zealand", "ca anz"]),
    ("Law Society of NSW", "https://www.lawsociety.com.au", ["law society of nsw", "law society of new south wales"]),
    ("Planning Institute of Australia", "https://www.planning.org.au", ["planning institute of australia"]),
    ("Royal Australian Chemical Institute", "https://www.raci.org.au", ["royal australian chemical institute", "raci"]),
]


def professional_body_names() -> str:
    return ", ".join(name for name, _, _ in PROFESSIONAL_BODIES)


def link_professional_bodies(names: List[str]) -> List[Dict[str, str | None]]:
    linked: List[Dict[str, str | None]] = []
    seen = set()
    for raw in names or []:
        text = (raw or "").strip()
        if not text:
            continue
        lowered = text.lower()
        match = next(
            (
                (name, url)
                for name, url, aliases in PROFESSIONAL_BODIES
                if any(re.search(rf"\b{re.escape(alias)}\b", lowered) for alias in aliases)
            ),
            None,
        )
        name, url = match if match else (text, None)
        if name.lower() in seen:
            continue
        seen.add(name.lower())
        linked.append({"name": name, "url": url})
    return linked

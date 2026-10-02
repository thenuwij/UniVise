"""Tests for linking professional bodies to their official sites.

Names the AI writes in many spellings map to one checked body and URL;
anything not on the list stays as plain text with no link.
"""
from app.services.roadmap.professional_bodies import link_professional_bodies


def test_common_spellings_map_to_one_linked_body():
    linked = link_professional_bodies([
        "IEEE (Institute of Electrical and Electronics Engineers)",
        "IEEE Student Branch",
        "ACM Student Chapter",
        "Engineers Australia",
    ])

    assert linked == [
        {"name": "IEEE", "url": "https://www.ieee.org"},
        {"name": "ACM", "url": "https://www.acm.org"},
        {"name": "Engineers Australia", "url": "https://www.engineersaustralia.org.au"},
    ]


def test_unknown_names_stay_plain_text():
    assert link_professional_bodies(["Australian Marketing Institute", " ", None]) == [
        {"name": "Australian Marketing Institute", "url": None},
    ]


def test_genetics_society_links_to_the_genetics_site():
    assert link_professional_bodies(["Genetics Society of Australasia"]) == [
        {"name": "Genetics Society of AustralAsia", "url": "https://genetics.org.au"},
    ]

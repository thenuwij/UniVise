"""Tests for reading Handbook enrolment rules into CourseMesh links.

No database is touched; each rule becomes groups that must all be met, each
met by any one of its courses.
"""
from scripts.requisites import requisite_edges, requisite_groups

KNOWN = {
    "COMP1511", "COMP1521", "COMP2521", "COMP3121", "COMP3821", "MATH1131", "MATH1141", "MATH2801", "MATH2901",
    "MATH2831", "MATH2931", "CHEM1011", "CHEM1031", "CHEM1021", "CHEM1041", "COMM1140", "COMM1180", "ECON1102",
    "ACCT2511", "LAND2102", "LAND2152", "EDST6760", "EDST6726", "GEOS1111", "GEOS1211", "DESN1000", "SOMS1912",
}


def groups(text):
    return sorted((kind, sorted(codes)) for kind, codes in requisite_groups(text, KNOWN))


def test_simple_or_list_and_unknown_old_codes():
    assert groups("Prerequisite: COMP1511 or DPST1091 or COMP1917 or COMP1921") == [("prereq", ["COMP1511"])]


def test_and_with_brackets():
    assert groups("Prerequisite: ACCT2511 AND (COMM1180 or ECON1102)") == [("prereq", ["ACCT2511"]), ("prereq", ["COMM1180", "ECON1102"])]


def test_or_groups_more_tightly_than_and_without_brackets():
    assert groups("Prerequisite: CHEM1011 or CHEM1031 and CHEM1021 or CHEM1041") == [
        ("prereq", ["CHEM1011", "CHEM1031"]), ("prereq", ["CHEM1021", "CHEM1041"]),
    ]


def test_or_of_ands_is_expanded():
    assert groups("Prerequisite: (COMM1180) or (COMM1140 and ECON1102)") == [
        ("prereq", ["COMM1140", "COMM1180"]), ("prereq", ["COMM1180", "ECON1102"]),
    ]


def test_conditions_a_course_cannot_meet_never_lock_a_course():
    assert groups("Prerequisite: COMP3821, or (COMP3121 and a 75 WAM)") == [("prereq", ["COMP3121", "COMP3821"])]
    assert groups("Pre-requisite: LAND2102 and LAND2152, or completion of the UNSW College Diploma of Architecture") == []
    assert groups("Prerequisite: COMP2521 or language placement approval") == []
    assert groups("SOMS1912 Human Systems 1 and enrolment in 3894 Nutrition or 3895 Pharmacy") == [("prereq", ["SOMS1912"])]


def test_commas_take_the_following_operator():
    assert groups("Prerequisite: COMP1511, COMP1521 and COMP2521") == [("prereq", ["COMP1511"]), ("prereq", ["COMP1521"]), ("prereq", ["COMP2521"])]
    assert groups("Prerequisite: MATH1131, MATH1141 or COMP1511") == [("prereq", ["COMP1511", "MATH1131", "MATH1141"])]
    assert groups("Prerequisite: One of the following courses, MATH2801, MATH2901 and one of the following courses, MATH2831, or MATH2931") == [
        ("prereq", ["MATH2801", "MATH2901"]), ("prereq", ["MATH2831", "MATH2931"]),
    ]


def test_slashes_corequisites_exclusions_and_advice():
    assert groups("Pre-requisite: GEOL1111/GEOS1111 or GEOS1211") == [("prereq", ["GEOS1111", "GEOS1211"])]
    assert groups("Prerequisite: EDST6726. Corerequisite: EDST6760") == [("coreq", ["EDST6760"]), ("prereq", ["EDST6726"])]
    assert groups("Exclusion Courses: DESN1000 - Introduction to Engineering Design") == []
    assert groups("Prerequisite: MATH2801 or MATH2901. A recommended prerequisite is MATH2831 or MATH2931.") == [("prereq", ["MATH2801", "MATH2901"])]


def test_edges_use_the_stored_format():
    edges = requisite_edges("COMP3121", "Prerequisite: COMP2521 and (MATH1131 or MATH1141)", KNOWN)

    assert edges == [
        {"from_key": "COMP2521", "to_key": "COMP3121", "edge_type": "prereq", "logic_type": "and", "group_id": None, "confidence": 1.0},
        {"from_key": "MATH1131", "to_key": "COMP3121", "edge_type": "prereq", "logic_type": "or", "group_id": "COMP3121_g1", "confidence": 1.0},
        {"from_key": "MATH1141", "to_key": "COMP3121", "edge_type": "prereq", "logic_type": "or", "group_id": "COMP3121_g1", "confidence": 1.0},
    ]


def test_a_course_never_requires_itself():
    assert requisite_edges("COMP2521", "Prerequisite: COMP2521 or COMP1511", KNOWN)[0]["from_key"] == "COMP1511"

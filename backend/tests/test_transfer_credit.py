"""Tests for Compare programs: crediting completed courses against a target
program, what is still to do, and the time impact.

Pure functions, no database. Each test covers one accuracy rule or edge case
from the Compare programs audit, with the expected numbers worked out by hand.
"""
from app.services.program_comparison import courses_left, credit_completed_courses, still_to_do, time_impact


def rows(*codes, uoc=6):
    return [{"course_code": c, "course_name": c, "uoc": uoc, "is_completed": True} for c in codes]


def credit(sections, done, label=None):
    return credit_completed_courses([(label, sections)], done)


def listed(*codes, uoc=6):
    return [{"code": c, "uoc": uoc} for c in codes]


# ---- crediting --------------------------------------------------------------

def test_elective_credit_stops_at_the_section_limit():
    result = credit([{"title": "Discipline Electives", "kind": "elective", "uoc": 12, "courses": listed("A1", "A2", "A3")}], rows("A1", "A2", "A3"))

    assert result["credited_uoc"] == 12
    assert [c["code"] for c in result["lost"]] == ["A3"]


def test_elective_overflow_can_still_go_to_free_electives():
    sections = [
        {"title": "Discipline Electives", "kind": "elective", "uoc": 6, "courses": listed("A1", "A2")},
        {"title": "Free Electives", "kind": "free_elective", "uoc": 6, "courses": []},
    ]
    result = credit(sections, rows("A1", "A2"))

    assert result["credited_uoc"] == 12
    assert result["lost"] == []


def test_one_of_group_credits_only_one_course():
    sections = [{"title": "One of", "kind": "choice", "courses": [{"code": "MATH1131", "uoc": 6, "choice": "a"}, {"code": "MATH1141", "uoc": 6, "choice": "a"}]}]
    result = credit(sections, rows("MATH1131", "MATH1141"))

    assert result["credited_uoc"] == 6
    assert [c["code"] for c in result["lost"]] == ["MATH1141"]


def test_recommended_lists_do_not_count():
    result = credit([{"title": "Recommended Electives", "kind": "info", "courses": listed("ARTS1000")}], rows("ARTS1000"))

    assert result["credited"] == []
    assert result["credited_uoc"] == 0


def test_zero_uoc_course_counts_as_zero_and_never_fills_free_electives():
    sections = [
        {"title": "Industrial Training", "kind": "core", "uoc": 0, "courses": listed("ENGG4999", uoc=0)},
        {"title": "Free Electives", "kind": "free_elective", "uoc": 12, "courses": []},
    ]
    in_list = credit(sections, rows("ENGG4999", uoc=0))
    not_in_list = credit(sections[1:], rows("ENGG4999", uoc=0))

    assert in_list["credited_uoc"] == 0 and in_list["credited"][0]["code"] == "ENGG4999"
    assert not_in_list["free_pool"]["candidates"] == []
    assert [c["code"] for c in not_in_list["lost"]] == ["ENGG4999"]


def test_free_elective_pool_says_how_many_fit_without_picking_winners():
    sections = [
        {"title": "Free Electives", "kind": "free_elective", "uoc": 12, "courses": []},
        {"title": "Free Elective", "kind": "elective", "uoc": 6, "courses": []},
    ]
    result = credit(sections, rows("ELEC1111", "PHYS1121", "PHYS1221", "COMP9517", "COMP3511"))
    pool = result["free_pool"]

    assert (pool["uoc"], pool["used_uoc"], pool["fits_count"], len(pool["candidates"])) == (18, 18, 3, 5)
    assert result["lost"] == []
    assert result["credited_uoc"] == 18
    assert result["counted_courses"] == 3


def test_no_free_electives_means_leftovers_are_lost():
    result = credit([{"title": "Core", "kind": "core", "uoc": 6, "courses": listed("COMP1511")}], rows("COMP1511", "ARTS1000"))

    assert result["free_pool"]["uoc"] == 0
    assert [c["code"] for c in result["lost"]] == ["ARTS1000"]


def test_core_takes_priority_over_electives():
    sections = [
        {"title": "Electives", "kind": "elective", "uoc": 6, "courses": listed("COMP2521")},
        {"title": "Core", "kind": "core", "uoc": 6, "courses": listed("COMP2521")},
    ]
    assert credit(sections, rows("COMP2521"))["credited"][0]["section"] == "Core"


def test_equivalent_course_counts_for_the_listed_one():
    result = credit([{"title": "Core", "kind": "core", "uoc": 6, "courses": listed("MATH1131")}], rows("MATH1141"))

    assert [(c["code"], c["match_type"]) for c in result["credited"]] == [("MATH1141", "equivalent")]
    assert result["credited_uoc"] == 6


def test_elective_rule_credits_matching_courses_within_the_limit():
    sections = [{"title": "Discipline Electives", "kind": "elective", "uoc": 6, "description": "Any COMP9*** course.", "courses": []}]
    result = credit(sections, rows("COMP9517", "COMP9417", "ARTS1000"))

    assert [(c["code"], c["match_type"]) for c in result["credited"]] == [("COMP9517", "rule")]
    assert {c["code"] for c in result["lost"]} == {"COMP9417", "ARTS1000"}


def test_specialisation_sections_are_labelled():
    result = credit([{"title": "Free Elective", "kind": "elective", "uoc": 6, "courses": []}], rows("COMP9517"), label="Software Engineering")

    assert result["free_pool"]["sections"] == ["Software Engineering: Free Elective"]


def test_no_completed_courses():
    result = credit([{"title": "Core", "kind": "core", "uoc": 6, "courses": listed("COMP1511")}], [])

    assert (result["credited_uoc"], result["counted_courses"], result["lost"]) == (0, 0, [])


def test_free_elective_room_read_from_text_when_uoc_missing():
    sections = [{"title": "Free Electives", "kind": "free_elective", "uoc": None, "description": "Students can take up to a maximum of 36 UOC of the following courses.", "courses": []}]
    result = credit(sections, rows("COMP1511", "COMP1521"))

    assert (result["free_pool"]["uoc"], result["free_pool"]["fits_count"]) == (36, 2)
    assert result["lost"] == []


# ---- still to do --------------------------------------------------------------

def test_still_to_do_lists_only_what_is_really_left():
    lists = [(None, [
        {"title": "Level 3 Core", "kind": "core", "uoc": 24, "courses": listed("ELEC3115", "ELEC3117", "COMP3211", "COMP3222")},
        {"title": "One of", "kind": "choice", "courses": [{"code": "MATH1131", "uoc": 6, "choice": "a"}, {"code": "MATH1141", "uoc": 6, "choice": "a"}]},
        {"title": "Discipline Electives", "kind": "elective", "uoc": 24, "courses": listed("ELEC4122", "ELEC4123", "TELE3113")},
        {"title": "Free Electives", "kind": "free_elective", "uoc": 12, "courses": []},
        {"title": "General Education", "kind": "general_education", "uoc": 12, "courses": []},
    ])]
    done = rows("COMP3211", "COMP3222", "MATH1141", "ELEC4122", "ARTS1000")
    items = still_to_do(lists, credit_completed_courses(lists, done))

    assert items == [
        {"title": "Level 3 Core", "type": "core", "left": ["ELEC3115", "ELEC3117"], "choices": []},
        {"title": "Discipline Electives", "type": "elective", "uoc_left": 18, "options": 3},
        {"title": "General Education", "type": "open", "uoc_left": 12, "note": "courses outside your faculty"},
        {"title": "Free electives", "type": "open", "uoc_left": 6, "note": "any approved courses"},
    ]
    assert courses_left(items) == 2 + 3 + 2 + 1


def test_container_with_only_zero_uoc_courses_lists_them_without_uoc():
    lists = [(None, [{"title": "Disciplinary Component", "kind": "elective", "uoc": 96, "courses": listed("COMM1999", "COMM3999", uoc=0)}])]
    items = still_to_do(lists, credit_completed_courses(lists, rows("COMM1999", uoc=0)))

    assert items == [{"title": "Disciplinary Component", "type": "core", "left": ["COMM3999"], "choices": []}]


# ---- time impact --------------------------------------------------------------

def test_extra_uoc_shows_even_when_terms_round_to_the_same():
    timing = time_impact(target_min_uoc=192, credited_uoc=66, base_min_uoc=192, completed_uoc=78)

    assert (timing["uoc_needed"], timing["base_uoc_left"], timing["extra_uoc"]) == (126, 114, 12)
    assert (timing["estimated_terms"], timing["base_terms_remaining"], timing["extra_terms"]) == (7, 7, 0)


def test_switch_can_save_time():
    timing = time_impact(target_min_uoc=144, credited_uoc=96, base_min_uoc=192, completed_uoc=96)

    assert timing["extra_uoc"] == -48
    assert timing["extra_terms"] == -3


def test_student_who_has_finished():
    timing = time_impact(target_min_uoc=144, credited_uoc=150, base_min_uoc=192, completed_uoc=192)

    assert (timing["uoc_needed"], timing["estimated_terms"], timing["base_uoc_left"]) == (0, 0, 0)


# ---- Handbook rules ---------------------------------------------------------

def test_structured_prefix_rules_credit_within_the_limit_and_respect_exceptions():
    sections = [{"title": "Prescribed Electives", "kind": "elective", "uoc": 12, "courses": listed("MATH3411"),
                 "rules": [{"prefix": "MATH3", "except": ["MATH3599"]}]}]
    result = credit(sections, rows("MATH3599", "MATH3711", "MATH3811", "MATH3911"))

    assert [(c["code"], c["match_type"]) for c in result["credited"]] == [("MATH3711", "rule"), ("MATH3811", "rule")]
    assert {c["code"] for c in result["lost"]} == {"MATH3599", "MATH3911"}


def test_longer_and_whole_subject_patterns_in_text():
    sections = [
        {"title": "Art Theory", "kind": "elective", "uoc": 6, "description": "Also counts: any DART13** course.", "courses": []},
        {"title": "Law Electives", "kind": "elective", "uoc": 6, "description": "Also counts: any LAWS**** course.", "courses": []},
    ]
    result = credit(sections, rows("DART1300", "DART2300", "LAWS3001"))

    assert sorted(c["code"] for c in result["credited"]) == ["DART1300", "LAWS3001"]


def test_faculty_rule_uses_the_course_school_and_level():
    sections = [{"title": "Prescribed Electives List 3", "kind": "elective", "uoc": 12, "courses": [],
                 "rules": [{"orgs": ["School of Economics"], "levels": [3]}]}]
    done = [
        {"course_code": "ECON3101", "uoc": 6, "school": "School of Economics", "faculty": "UNSW Business School"},
        {"course_code": "ECON2101", "uoc": 6, "school": "School of Economics", "faculty": "UNSW Business School"},
        {"course_code": "FINS3616", "uoc": 6, "school": "School of Banking and Finance", "faculty": "UNSW Business School"},
    ]
    result = credit(sections, done)

    assert [c["code"] for c in result["credited"]] == ["ECON3101"]


def test_still_to_do_mentions_the_rule():
    lists = [(None, [{"title": "Computing Electives", "kind": "elective", "uoc": 30, "courses": listed("COMP3141"),
                      "rules": [{"prefix": "COMP3"}, {"prefix": "COMP4"}]}])]
    items = still_to_do(lists, credit_completed_courses(lists, rows("COMP3311")))

    assert items == [{"title": "Computing Electives", "type": "elective", "uoc_left": 24, "options": 1, "also": "any COMP3***, COMP4*** course"}]

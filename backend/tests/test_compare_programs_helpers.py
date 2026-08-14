"""Tests for the transfer-comparison logic.

These functions decide which completed courses carry across to a target program
and whether a student meets prerequisites, so they drive the advice shown on the
compare page.
"""
import pytest

from app.routers.compare_programs_helpers import (
    check_prerequisite_satisfied,
    extract_courses_from_sections,
    get_equivalent_codes,
    get_level_name,
    group_courses_by_level,
    infer_course_level,
    parse_prerequisites,
)


class TestInferCourseLevel:
    @pytest.mark.parametrize(
        "code,expected",
        [
            ("COMP1511", 1),
            ("COMP2521", 2),
            ("MATH3411", 3),
            ("ARTS9001", 9),
        ],
    )
    def test_reads_level_from_fifth_character(self, code, expected):
        assert infer_course_level(code) == expected

    @pytest.mark.parametrize("code", ["", "COMP", "COMPX511"])
    def test_returns_zero_when_level_is_not_a_digit(self, code):
        assert infer_course_level(code) == 0


class TestGetLevelName:
    def test_zero_is_uncategorized(self):
        assert get_level_name(0) == "Uncategorized"

    def test_other_levels_are_labelled(self):
        assert get_level_name(1) == "Level 1"
        assert get_level_name(4) == "Level 4"


class TestGetEquivalentCodes:
    def test_unknown_course_has_no_equivalents(self):
        assert get_equivalent_codes("ZZZZ9999") == []

    def test_equivalents_never_include_the_course_itself(self):
        for code in ("MATH1131", "MATH1231", "PHYS1121"):
            assert code not in get_equivalent_codes(code)

    def test_equivalence_is_symmetric(self):
        assert "MATH1141" in get_equivalent_codes("MATH1131")
        assert "MATH1131" in get_equivalent_codes("MATH1141")


class TestParsePrerequisites:
    def test_empty_text_requires_nothing(self):
        assert parse_prerequisites("")["type"] == "none"

    def test_text_without_course_codes_requires_nothing(self):
        assert parse_prerequisites("Enrolment in a Computer Science program")["type"] == "none"

    def test_single_course(self):
        result = parse_prerequisites("Prerequisite: COMP1511")
        assert result["type"] == "single"
        assert result["courses"] == ["COMP1511"]

    def test_pure_or(self):
        result = parse_prerequisites("COMP1511 or COMP1917")
        assert result["type"] == "or"
        assert set(result["courses"]) == {"COMP1511", "COMP1917"}

    def test_pure_and(self):
        result = parse_prerequisites("COMP1511 and COMP1521")
        assert result["type"] == "and"
        assert set(result["courses"]) == {"COMP1511", "COMP1521"}

    def test_duplicate_codes_are_collapsed(self):
        result = parse_prerequisites("COMP1511 and COMP1511")
        assert result["courses"] == ["COMP1511"]

    def test_parenthesised_or_group_is_kept_separate(self):
        result = parse_prerequisites("COMP1531 AND (COMP2521 OR COMP1927)")
        assert result["or_groups"], "expected the bracketed alternatives to form an or-group"
        group = result["or_groups"][0]
        assert set(group) == {"COMP2521", "COMP1927"}


class TestCheckPrerequisiteSatisfied:
    def test_no_requirement_is_always_satisfied(self):
        ok, missing = check_prerequisite_satisfied({"type": "none"}, set())
        assert ok is True
        assert missing == []

    def test_single_requirement_met(self):
        ok, missing = check_prerequisite_satisfied(
            {"type": "single", "courses": ["COMP1511"]}, {"COMP1511"}
        )
        assert ok is True
        assert missing == []

    def test_single_requirement_unmet_reports_the_gap(self):
        ok, missing = check_prerequisite_satisfied(
            {"type": "single", "courses": ["COMP1511"]}, set()
        )
        assert ok is False
        assert missing == ["COMP1511"]

    def test_or_requirement_needs_only_one(self):
        ok, _ = check_prerequisite_satisfied(
            {"type": "or", "courses": ["COMP1511", "COMP1917"]}, {"COMP1917"}
        )
        assert ok is True

    def test_or_requirement_unmet_when_none_completed(self):
        ok, missing = check_prerequisite_satisfied(
            {"type": "or", "courses": ["COMP1511", "COMP1917"]}, {"MATH1131"}
        )
        assert ok is False
        assert set(missing) == {"COMP1511", "COMP1917"}

    def test_equivalent_course_counts_as_completed(self):
        # A student who took MATH1141 has met a MATH1131 prerequisite.
        ok, _ = check_prerequisite_satisfied(
            {"type": "single", "courses": ["MATH1131"]}, {"MATH1141"}
        )
        assert ok is True, "an equivalent course should satisfy the prerequisite"


class TestExtractCoursesFromSections:
    def test_empty_input_yields_no_courses(self):
        assert extract_courses_from_sections(None) == []
        assert extract_courses_from_sections([]) == []

    def test_malformed_json_string_yields_no_courses(self):
        assert extract_courses_from_sections("{not json") == []

    def test_accepts_a_json_string(self):
        raw = '[{"title": "Core", "courses": [{"code": "COMP1511", "name": "Programming", "uoc": 6}]}]'
        courses = extract_courses_from_sections(raw)
        assert len(courses) == 1
        assert courses[0]["code"] == "COMP1511"
        assert courses[0]["uoc"] == 6

    def test_derives_level_and_category(self):
        sections = [{"title": "Core Courses", "courses": [{"code": "COMP2521", "uoc": 6}]}]
        course = extract_courses_from_sections(sections)[0]
        assert course["level"] == 2
        assert course["category"] == "Core Courses"

    def test_uses_default_category_when_section_has_no_title(self):
        sections = [{"courses": [{"code": "COMP1511", "uoc": 6}]}]
        course = extract_courses_from_sections(sections, default_category="Elective")[0]
        assert course["category"] == "Elective"

    def test_duplicate_codes_are_deduplicated(self):
        sections = [
            {"title": "A", "courses": [{"code": "COMP1511", "uoc": 6}]},
            {"title": "B", "courses": [{"code": "COMP1511", "uoc": 6}]},
        ]
        assert len(extract_courses_from_sections(sections)) == 1

    def test_courses_without_a_code_are_skipped(self):
        sections = [{"title": "A", "courses": [{"name": "No code here", "uoc": 6}]}]
        assert extract_courses_from_sections(sections) == []

    def test_non_numeric_uoc_falls_back_to_zero(self):
        sections = [{"title": "A", "courses": [{"code": "COMP1511", "uoc": "six"}]}]
        assert extract_courses_from_sections(sections)[0]["uoc"] == 0

    def test_non_dict_sections_are_ignored(self):
        sections = ["not a section", {"title": "A", "courses": [{"code": "COMP1511", "uoc": 6}]}]
        assert len(extract_courses_from_sections(sections)) == 1


class TestGroupCoursesByLevel:
    """The result is keyed by course level; each entry carries the courses,
    their combined UOC, and whether any prerequisite is unmet."""

    def _course(self, code, level, uoc=6, conditions=""):
        return {
            "code": code,
            "title": f"Course {code}",
            "uoc": uoc,
            "level": level,
            "conditions_for_enrolment": conditions,
        }

    def test_groups_courses_under_their_level(self):
        grouped = group_courses_by_level(
            [self._course("COMP1511", 1), self._course("COMP2521", 2)], set()
        )
        assert set(grouped.keys()) == {1, 2}
        assert grouped[1]["courses"][0]["code"] == "COMP1511"
        assert grouped[2]["courses"][0]["code"] == "COMP2521"

    def test_totals_reflect_the_courses_in_each_level(self):
        grouped = group_courses_by_level(
            [self._course("COMP1511", 1), self._course("MATH1131", 1)], set()
        )
        assert len(grouped[1]["courses"]) == 2
        assert grouped[1]["total_uoc"] == 12

    def test_levels_are_returned_in_ascending_order(self):
        grouped = group_courses_by_level(
            [self._course("COMP3231", 3), self._course("COMP1511", 1), self._course("COMP2521", 2)],
            set(),
        )
        assert list(grouped.keys()) == [1, 2, 3]

    def test_unmet_prerequisite_is_flagged_on_the_level(self):
        grouped = group_courses_by_level(
            [self._course("COMP2521", 2, conditions="Prerequisite: COMP1511")], set()
        )
        assert grouped[2]["has_prereq_issues"] is True
        course = grouped[2]["courses"][0]
        assert course["has_prereq_issue"] is True
        assert course["missing_prerequisites"] == ["COMP1511"]

    def test_met_prerequisite_is_not_flagged(self):
        grouped = group_courses_by_level(
            [self._course("COMP2521", 2, conditions="Prerequisite: COMP1511")], {"COMP1511"}
        )
        assert grouped[2]["has_prereq_issues"] is False
        assert grouped[2]["courses"][0]["has_prereq_issue"] is False

    def test_empty_input_yields_no_groups(self):
        assert group_courses_by_level([], set()) == {}

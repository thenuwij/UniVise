"""Tests for the allowed occupations per study area.

No database is touched; these check that the reviewed file only names real
study areas and occupation groups, has no duplicates, and covers every area a
program or major uses.
"""
import pytest

from scripts.career_data_import import jsa_record, read_csv
from scripts.study_area_mapping import STUDY_AREAS
from scripts.study_area_mapping import read_mapping as read_area_mapping
from scripts.study_area_occupations import read_mapping

MAPPING = "data/career/study_area_occupations.csv"
KNOWN_CODES = {jsa_record(row)["anzsco_code"] for row in read_csv("data/career/jsa_occupations.csv")}


def test_committed_file_loads():
    rows = read_mapping(MAPPING, KNOWN_CODES, set(STUDY_AREAS))
    assert len(rows) > 150


def test_every_used_study_area_has_occupations():
    program_rows, major_rows = read_area_mapping("data/career/study_areas.csv")
    used = {row["study_area"] for row in program_rows + major_rows}
    covered = {row["study_area"] for row in read_mapping(MAPPING, KNOWN_CODES, set(STUDY_AREAS))}
    assert used <= covered


def test_unknown_occupation_is_rejected(tmp_path):
    path = tmp_path / "mapping.csv"
    path.write_text("study_area,anzsco_code,title\nEngineering,9999,Not real\n")
    with pytest.raises(ValueError):
        read_mapping(path, KNOWN_CODES, set(STUDY_AREAS))

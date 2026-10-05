import pytest

from app.llm.json_parsing import clean_openai_response, extract_json, sanitize_and_parse_json

BOTH_PARSE = [
    ('{"a": 1}', {"a": 1}),
    ("[1, 2]", [1, 2]),
    ('  \n{"a": 1}\n ', {"a": 1}),
    ('Sure:\n```json\n{"a": 1}\n```\nThanks', {"a": 1}),
    ('```\n{"a": 1}\n```', {"a": 1}),
    ('Here you go: {"a": {"b": 2}} hope it helps', {"a": {"b": 2}}),
]

ONLY_SANITIZE_PARSES = [
    ('{"a": [1, 2,],}', {"a": [1, 2]}),
    ("{'a': 'x'}", {"a": "x"}),
    ('{a: 1, b: "x"}', {"a": 1, "b": "x"}),
    ('{"a": 1 // one\n}', {"a": 1}),
    ('{"x": "{"a": 1}"}', {"x": {"a": 1}}),
    ('[note] {"a": 1}', {"a": 1}),
]

NEITHER_PARSES = ["no json here", ""]


class TestExtractJson:
    @pytest.mark.parametrize("text,expected", BOTH_PARSE)
    def test_parses_common_llm_output(self, text, expected):
        assert extract_json(text) == expected

    def test_keeps_array_wrapped_in_prose(self):
        assert extract_json('Result: [{"a": 1}] done') == [{"a": 1}]

    @pytest.mark.parametrize("text", [t for t, _ in ONLY_SANITIZE_PARSES] + NEITHER_PARSES)
    def test_rejects_malformed_json(self, text):
        with pytest.raises(ValueError):
            extract_json(text)


class TestSanitizeAndParseJson:
    @pytest.mark.parametrize("text,expected", BOTH_PARSE + ONLY_SANITIZE_PARSES)
    def test_parses_and_repairs_llm_output(self, text, expected):
        assert sanitize_and_parse_json(text) == expected

    def test_unwraps_array_wrapped_in_prose_to_first_object(self):
        assert sanitize_and_parse_json('Result: [{"a": 1}] done') == {"a": 1}

    @pytest.mark.parametrize("text", NEITHER_PARSES)
    def test_raises_when_nothing_parses(self, text):
        with pytest.raises(ValueError):
            sanitize_and_parse_json(text)


class TestCleanOpenaiResponse:
    @pytest.mark.parametrize(
        "text,expected",
        [
            ('```json\n{"a": 1}\n```', '{"a": 1}'),
            ('```\n{"a": 1}\n```', '{"a": 1}'),
            ('  {"a": 1}  ', '{"a": 1}'),
            ('```JSON\n{"a": 1}\n```', 'JSON\n{"a": 1}'),
            ('text ```json\n{}\n```', 'text ```json\n{}\n```'),
        ],
    )
    def test_strips_leading_code_fence_only(self, text, expected):
        assert clean_openai_response(text) == expected

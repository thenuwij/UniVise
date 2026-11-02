import re

LEVEL_WORDS = {
    "graduate", "grad", "junior", "entry", "level", "trainee", "intern", "internship",
    "program", "programme", "early", "career", "cadet", "and", "of", "the", "in", "for", "a",
}
EARLY_CAREER = re.compile(r"\b(graduate|grad|junior|jnr|entry|trainee|intern|internship|cadet|associate|assistant)\b", re.I)
SENIOR = re.compile(r"\b(senior|snr|sr|lead|principal|manager|head|director|chief|experienced|executive|partner|research associate|lecturer|professor|postdoctoral)\b", re.I)


def ad_search_words(title: str) -> str:
    words = [w for w in re.findall(r"[a-z]+", (title or "").lower()) if w not in LEVEL_WORDS]
    return " ".join(words[:2])


def is_early_career(title: str) -> bool:
    return bool(EARLY_CAREER.search(title or "")) and not SENIOR.search(title or "")

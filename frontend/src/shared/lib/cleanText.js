const LINE_BREAKS = /[\p{Cc}\u2028\u2029]/gu;
const INVISIBLE = /\p{Cf}/gu;
const NOT_ALLOWED = /[^\p{L}\p{M}\p{N} &,.'\u2019\-\u2013()/+#:!?%]/gu;

export function cleanText(value, maxLength) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(LINE_BREAKS, " ")
    .replace(INVISIBLE, "")
    .replace(NOT_ALLOWED, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .trim();
}

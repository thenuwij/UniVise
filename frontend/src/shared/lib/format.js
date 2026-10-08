const PLACEHOLDER =
  /^\s*(not specified|n\/?a|none|null|tbc|-|information temporarily unavailable|data not available|data unavailable)\.?\s*$/i;
const SENTENCE_END = /(?<=[.!?])\s+(?=[A-Z0-9(])/;
const PARAGRAPH_CHARS = 420;
const MIN_LIST_ITEMS = 8;
const MAX_LIST_ITEM_CHARS = 90;
const MIN_COURSE_ITEMS = 4;
const COURSE_CODE = /\b[A-Z]{4}\d{4}\b/g;

export function hasContent(value) {
  if (value == null) return false;
  if (typeof value !== "string") return true;
  return value.trim() !== "" && !PLACEHOLDER.test(value);
}

const trimNumber = (n) => String(Number(n.toFixed(2)));
const years = (n) => `${trimNumber(n)} ${n === 1 ? "year" : "years"}`;

export function formatDuration(durationYears, durationText) {
  const n = Number(durationYears);
  if (durationYears != null && Number.isFinite(n) && n > 0) return years(n);
  if (!hasContent(durationText)) return null;
  const range = durationText.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) return `${trimNumber(Number(range[1]))} to ${trimNumber(Number(range[2]))} years`;
  const single = durationText.match(/\d+(?:\.\d+)?/);
  return single ? years(Number(single[0])) : durationText.trim();
}

function inlineNumbered(text) {
  const marks = [...text.matchAll(/(^|[\s:])(\d{1,2})\.\s+/g)];
  const starts = [];
  let expected = 1;
  for (const m of marks) {
    if (Number(m[2]) === expected) {
      starts.push(m.index + m[1].length);
      expected += 1;
    }
  }
  if (starts.length < 2) return null;
  const intro = text.slice(0, starts[0]).trim();
  const items = starts.map((start, i) =>
    text.slice(start, starts[i + 1] ?? text.length).replace(/^\d{1,2}\.\s+/, "").trim()
  );
  const [lastItem, ...after] = items[items.length - 1].split(SENTENCE_END);
  items[items.length - 1] = lastItem.replace(/\.$/, "");
  return { intro, items, outro: after.join(" ") };
}

function courseList(body) {
  if (new Set(body.match(COURSE_CODE) || []).size < MIN_COURSE_ITEMS) return null;
  if (/[()]|requisite|exclu/i.test(body)) return null;
  const [intro, ...items] = body.split(/(?=\b[A-Z]{4}\d{4}\b)/);
  return {
    intro: intro.replace(/[\s,]+$/, "").trim(),
    items: items.map((item) => item.replace(/[\s,;]+(?:and|or)?\s*$/i, "").trim()),
  };
}

function runOnList(sentence) {
  const body = sentence.replace(/\.$/, "");
  const courses = courseList(body);
  if (courses) return courses;
  const colon = body.indexOf(":");
  const intro = colon > -1 ? body.slice(0, colon + 1).trim() : "";
  const items = (colon > -1 ? body.slice(colon + 1) : body)
    .split(/,\s*(?:(?:and|or)\s+)?/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length < MIN_LIST_ITEMS) return null;
  if (items.some((item) => item.length > MAX_LIST_ITEM_CHARS)) return null;
  if (!items.every((item) => /^[A-Z0-9(]/.test(item))) return null;
  return { intro, items };
}

function paragraphs(text, lists = true) {
  const out = [];
  let current = "";
  for (const sentence of text.split(SENTENCE_END)) {
    const list = lists && runOnList(sentence);
    if (list) {
      if (current) out.push({ type: "p", text: current });
      if (list.intro) out.push({ type: "p", text: list.intro });
      out.push({ type: "ul", items: list.items });
      current = "";
      continue;
    }
    if (current && current.length + sentence.length > PARAGRAPH_CHARS) {
      out.push({ type: "p", text: current });
      current = "";
    }
    current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) out.push({ type: "p", text: current });
  return out;
}

function lineBlocks(lines, lists) {
  const out = [];
  for (const line of lines) {
    const numbered = line.match(/^(\d{1,2})[.)]\s+(.+)/);
    const bullet = line.match(/^[•\-*]\s*(.+)/);
    const last = out[out.length - 1];
    if (numbered) {
      if (last?.type === "ol") last.items.push(numbered[2]);
      else out.push({ type: "ol", items: [numbered[2]] });
    } else if (bullet) {
      if (last?.type === "ul") last.items.push(bullet[1]);
      else out.push({ type: "ul", items: [bullet[1]] });
    } else {
      out.push(...paragraphs(line, lists));
    }
  }
  return out;
}

export function toBlocks(text, { lists = true } = {}) {
  if (!hasContent(text)) return [];
  const clean = text.replace(/[ \t]+/g, " ").trim();
  const lines = clean.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) return lineBlocks(lines, lists);
  const numbered = lists && inlineNumbered(clean);
  if (numbered) {
    return [
      ...(numbered.intro ? paragraphs(numbered.intro) : []),
      { type: "ol", items: numbered.items },
      ...(numbered.outro ? paragraphs(numbered.outro) : []),
    ];
  }
  return paragraphs(clean, lists);
}

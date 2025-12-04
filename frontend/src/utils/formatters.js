
export function courseToText(c) {
  if (typeof c === "string") return c;
  if (c && (c.code || c.title)) {
    return [c.code, c.title].filter(Boolean).join(" — ");
  }
  return "";
}

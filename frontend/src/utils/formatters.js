/** @file formatters.js
 *  Small format helpers shared across roadmap pages.
 */

/**
 * Converts a course object/string into human-readable "CODE — Title".
 * @param {string | {code?: string, title?: string}} c
 * @returns {string}
 */
export function courseToText(c) {
  if (typeof c === "string") return c;
  if (c && (c.code || c.title)) {
    return [c.code, c.title].filter(Boolean).join(" — ");
  }
  return "";
}

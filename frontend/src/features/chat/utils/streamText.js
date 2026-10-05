export const STREAM_ERROR_MARKER = "[STREAM_ERROR]";
const CUT_OFF_NOTE = "The reply was cut off. Please try again.";

export function readStreamText(raw, finished = false) {
  if (raw.endsWith(STREAM_ERROR_MARKER)) {
    return { text: raw.slice(0, -STREAM_ERROR_MARKER.length), cutOff: true };
  }
  if (!finished) {
    for (let n = STREAM_ERROR_MARKER.length - 1; n > 0; n--) {
      if (raw.endsWith(STREAM_ERROR_MARKER.slice(0, n))) {
        return { text: raw.slice(0, -n), cutOff: false };
      }
    }
  }
  return { text: raw, cutOff: false };
}

export function withCutOffNote(text) {
  return text.trim() ? `${text}\n\n*${CUT_OFF_NOTE}*` : CUT_OFF_NOTE;
}

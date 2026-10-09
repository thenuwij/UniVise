export function hasSeenGuide(key) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return true;
  }
}

export function markGuideSeen(key) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    return;
  }
}

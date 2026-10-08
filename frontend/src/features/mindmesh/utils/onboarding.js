const SEEN_KEY = "univise-coursemesh-guide-seen";

export function hasSeenGuide() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markGuideSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    return;
  }
}

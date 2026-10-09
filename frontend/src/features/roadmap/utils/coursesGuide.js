const SEEN_KEY = "univise-courses-guide-seen";

export function hasSeenCoursesGuide() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markCoursesGuideSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    return;
  }
}

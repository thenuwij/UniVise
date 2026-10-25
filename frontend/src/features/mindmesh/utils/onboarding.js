const SEEN_KEY = "univise-coursemesh-guide-seen";

const seenKey = (userId) => `${SEEN_KEY}-${userId || "guest"}`;

export function hasSeenGuide(userId) {
  try {
    return localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function markGuideSeen(userId) {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    return;
  }
}

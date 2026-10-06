const ADS_PER_ROLE = 2;

export function assignAds(roles, ads) {
  const used = new Set();
  return roles.map((role) => {
    const picks = [];
    for (const ad of ads) {
      if (picks.length >= ADS_PER_ROLE) break;
      if (role.ad_search && ad.search_words === role.ad_search && !used.has(ad.ad_id)) {
        used.add(ad.ad_id);
        picks.push(ad);
      }
    }
    return picks;
  });
}

export function postedAgo(postedAt, now = Date.now()) {
  const days = Math.floor((now - new Date(postedAt).getTime()) / 86400000);
  if (Number.isNaN(days)) return "";
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

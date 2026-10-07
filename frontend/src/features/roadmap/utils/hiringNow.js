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

const INTERNSHIP_TITLE = /\b(intern|internship|vacation|vacationer|cadet|cadetship|graduate program)\b/i;
const COMPANY_FILLER = new Set(["pty", "ltd", "limited", "australia", "australian", "group", "inc", "the", "and", "co", "company", "corporation", "corp", "holdings", "services", "plc", "llp", "nsw", "of"]);

export function pickOpenNow(ads, limit = 5) {
  const seen = new Set();
  const unique = ads.filter((ad) => !seen.has(ad.ad_id) && seen.add(ad.ad_id));
  const internships = unique.filter((ad) => INTERNSHIP_TITLE.test(ad.title || ""));
  const others = unique.filter((ad) => !INTERNSHIP_TITLE.test(ad.title || ""));
  return [...internships, ...others].slice(0, limit);
}

function companyKey(name) {
  return (name || "").toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => !COMPANY_FILLER.has(w)).join(" ") || "";
}

export function sameCompany(a, b) {
  const x = companyKey(a);
  const y = companyKey(b);
  return !!x && !!y && (x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `));
}

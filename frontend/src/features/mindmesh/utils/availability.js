export const STATUS = {
  completed: { label: "Completed", color: "#16A34A" },
  available: { label: "Can take next", color: "#2563EB" },
  locked: { label: "Not yet", color: "#64748B" },
  not_needed: { label: "Not needed (you chose another)", color: "#94A3B8" },
};

export function prereqGroups(edges) {
  const byCourse = new Map();
  for (const e of edges || []) {
    if (e.edge_type !== "prereq") continue;
    const groups = byCourse.get(e.to_key) || new Map();
    const key = e.group_id || e.from_key;
    const group = groups.get(key) || { logic: e.logic_type === "and" ? "and" : "or", codes: [] };
    if (!group.codes.includes(e.from_key)) group.codes.push(e.from_key);
    groups.set(key, group);
    byCourse.set(e.to_key, groups);
  }
  return new Map([...byCourse].map(([code, groups]) => [code, [...groups.values()]]));
}

export function unmetGroups(code, completed, groups) {
  return (groups.get(code) || [])
    .filter((g) => (g.logic === "and" ? !g.codes.every((c) => completed.has(c)) : !g.codes.some((c) => completed.has(c))))
    .map((g) => (g.logic === "and" ? { ...g, codes: g.codes.filter((c) => !completed.has(c)) } : g));
}

export function courseStatus(code, completed, groups) {
  if (completed.has(code)) return "completed";
  return unmetGroups(code, completed, groups).length ? "locked" : "available";
}

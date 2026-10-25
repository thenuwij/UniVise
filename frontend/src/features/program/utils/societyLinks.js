import { supabase } from "@/shared/lib/supabase";

const BRACKETS = /\(([^)]*)\)/g;

const normaliseName = (name) =>
  (name || "")
    .toLowerCase()
    .replace(BRACKETS, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(unsw|the|society|soc|club|association|inc)\b/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

const shortForms = (name) => [...(name || "").matchAll(BRACKETS)].map((m) => m[1].trim().toLowerCase()).filter(Boolean);

export function buildLinkIndex(rows) {
  const byName = new Map();
  const byShort = new Map();
  for (const row of rows || []) {
    const link = row.website_url || row.rubric_url;
    if (!link) continue;
    const entry = { url: link, isWebsite: !!row.website_url };
    byName.set(normaliseName(row.name), entry);
    for (const short of [row.short_name, ...shortForms(row.name)]) {
      if (short) byShort.set(short.trim().toLowerCase(), entry);
    }
  }
  return { byName, byShort };
}

export function findLink(index, name) {
  if (!index || !name) return null;
  return index.byName.get(normaliseName(name)) || shortForms(name).map((s) => index.byShort.get(s)).find(Boolean) || null;
}

export async function fetchSocietyLinks() {
  const { data, error } = await supabase.from("unsw_societies").select("name, short_name, website_url, rubric_url");
  if (error) throw error;
  return buildLinkIndex(data);
}

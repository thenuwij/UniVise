import { useEffect, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";
import { fetchMatchingRoadmap } from "@/features/roadmap/utils/roadmapEntry";
import { fetchSpecialisationIds } from "@/features/roadmap/utils/programCourses";
import { mergeListings } from "@/features/careers/utils/careersListings";
import { groupJobs } from "@/features/careers/utils/jobFamilies";

function summariseFeed(feed) {
  const sources = Object.fromEntries((feed?.sources || []).map((s) => [s.source, s]));
  const items = (key, kind) => (sources[key]?.items || []).filter((item) => !kind || item.kind === kind);
  const jobs = mergeListings(items("ai_jobs"), items("adzuna", "job"));
  return {
    jobs: jobs.length,
    internships: mergeListings(items("ai_internships"), items("adzuna", "internship")).length,
    events: items("ai_networking").filter((item) => item.kind !== "calendar").length,
    families: groupJobs(jobs).slice(0, 2).map((g) => ({ title: g.title, count: g.ads.length })),
  };
}

function summariseRoadmap(payload, completedCodes) {
  const societies = [...(payload?.industry_societies?.faculty_specific || []), ...(payload?.industry_societies?.cross_faculty || [])];
  const placements = payload?.industry_experience?.mandatory_placements;
  const code = placements?.required ? placements.course_codes?.[0] : null;
  return {
    societies: societies.map((s) => s.name.replace(/\s*\(.*\)\s*$/, "")),
    placement: code ? { code, done: completedCodes.includes(code) } : null,
  };
}

export function useDashboardPreview(facts) {
  const { session } = UserAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const program = facts?.program;
  const [picks, setPicks] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [career, setCareer] = useState(null);

  useEffect(() => {
    if (!program || facts?.failed || !token) return;
    let active = true;
    apiJson("/course-picks", { token })
      .then((data) => active && setPicks({ picks: data.picks || [], available: (data.available || []).length, failed: !!data.failed }))
      .catch(() => active && setPicks({ picks: [], available: 0, failed: true }));
    return () => { active = false; };
  }, [program, facts?.failed, token]);

  useEffect(() => {
    if (!program || facts?.failed || !userId || !token) return;
    let active = true;
    (async () => {
      const ids = await fetchSpecialisationIds(program.degree_code, userId);
      const found = await fetchMatchingRoadmap(userId, program.degree_code, ids);
      if (!active) return;
      setRoadmap(found ? summariseRoadmap(found.payload, facts.completedCodes || []) : { societies: [], placement: null });
      if (!found) return setCareer({ missing: true });
      const feed = await apiJson(`/careers/feed?roadmap_id=${encodeURIComponent(found.id)}`, { token });
      if (active) setCareer(summariseFeed(feed));
    })().catch((err) => {
      console.error("Dashboard preview failed:", err);
      if (active) setCareer((c) => c || { failed: true });
    });
    return () => { active = false; };
  }, [program, facts?.failed, facts?.completedCodes, userId, token]);

  return { picks, roadmap, career };
}

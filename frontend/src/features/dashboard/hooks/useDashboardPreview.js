import { useEffect, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";
import { fetchMatchingRoadmap } from "@/features/roadmap/utils/roadmapEntry";
import { fetchSpecialisationIds } from "@/features/roadmap/utils/programCourses";
import { mergeListings } from "@/features/careers/utils/careersListings";
import { groupJobs } from "@/features/careers/utils/jobFamilies";
import { fetchSocietyLinks, findLink } from "@/features/roadmap/utils/societyLinks";

function summariseFeed(feed) {
  const sources = Object.fromEntries((feed?.sources || []).map((s) => [s.source, s]));
  const items = (key, kind) => (sources[key]?.items || []).filter((item) => !kind || item.kind === kind);
  const jobs = mergeListings(items("ai_jobs"), items("adzuna", "job"));
  const events = items("ai_networking").filter((item) => item.kind !== "calendar");
  const family = groupJobs(jobs)[0];
  return {
    jobs: jobs.length,
    internships: mergeListings(items("ai_internships"), items("adzuna", "internship")).length,
    events: events.length,
    family: family && {
      title: family.title,
      count: family.ads.length,
      companies: [...new Set(family.ads.map((ad) => ad.organisation).filter(Boolean))].slice(0, 3),
    },
    nextEvent: events[0] || null,
  };
}

function summariseRoadmap(payload, completedCodes, links) {
  const societies = [...(payload?.industry_societies?.faculty_specific || []), ...(payload?.industry_societies?.cross_faculty || [])];
  const placements = payload?.industry_experience?.mandatory_placements;
  const code = placements?.required ? placements.course_codes?.[0] : null;
  return {
    societies: societies.map((s) => {
      const short = s.name.match(/\(([^)]+)\)\s*$/)?.[1];
      return { name: short || s.name, faculty: payload.industry_societies.faculty_specific?.includes(s), link: findLink(links, s.name) };
    }),
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
  const [cert, setCert] = useState(undefined);

  useEffect(() => {
    if (!program || facts?.failed || !token) return;
    let active = true;
    apiJson("/course-picks", { token })
      .then((data) => {
        const available = data.available || [];
        if (active) setPicks({ picks: data.picks || [], available: available.length, core: available.filter((c) => c.core).length, failed: !!data.failed });
      })
      .catch(() => active && setPicks({ picks: [], available: 0, core: 0, failed: true }));
    return () => { active = false; };
  }, [program, facts?.failed, token]);

  useEffect(() => {
    if (!program || facts?.failed || !userId || !token) return;
    let active = true;
    (async () => {
      const ids = await fetchSpecialisationIds(program.degree_code, userId);
      const [found, links] = await Promise.all([
        fetchMatchingRoadmap(userId, program.degree_code, ids),
        fetchSocietyLinks().catch(() => null),
      ]);
      if (!active) return;
      setRoadmap(found ? summariseRoadmap(found.payload, facts.completedCodes || [], links) : { societies: [], placement: null });
      if (!found) {
        setCert(null);
        return setCareer({ missing: true });
      }
      apiJson(`/careers/certifications?roadmap_id=${encodeURIComponent(found.id)}`, { token })
        .then((data) => {
          const group = (data.groups || [])[0];
          const start = group?.certifications?.find((c) => c.start_here) || group?.certifications?.[0];
          if (active) setCert(start ? { ...start, career: group.career } : null);
        })
        .catch(() => active && setCert(null));
      const feed = await apiJson(`/careers/feed?roadmap_id=${encodeURIComponent(found.id)}`, { token });
      if (active) setCareer(summariseFeed(feed));
    })().catch((err) => {
      console.error("Dashboard preview failed:", err);
      if (active) setCareer((c) => c || { failed: true });
    });
    return () => { active = false; };
  }, [program, facts?.failed, facts?.completedCodes, userId, token]);

  return { picks, roadmap, career, cert };
}

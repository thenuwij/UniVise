import { useEffect, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";
import { useCareersFeed } from "@/features/career/hooks/useCareersFeed";
import { fetchMatchingRoadmap } from "@/features/program/utils/roadmapEntry";
import { fetchSpecialisationIds } from "@/features/program/utils/programCourses";
import { fetchSocietyLinks, findLink } from "@/features/program/utils/societyLinks";
import { summariseSources } from "../utils/careerSummary";

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

export function useHomePreview(facts) {
  const { session } = UserAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const program = facts?.program;
  const [picks, setPicks] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapId, setRoadmapId] = useState(null);
  const [careerProblem, setCareerProblem] = useState(null);
  const [cert, setCert] = useState(undefined);
  const { sources, loadFailed, retryLoad } = useCareersFeed(roadmapId);

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
        return setCareerProblem("missing");
      }
      setRoadmapId(found.id);
      apiJson(`/careers/certifications?roadmap_id=${encodeURIComponent(found.id)}`, { token })
        .then((data) => {
          const count = (data.groups || []).reduce((sum, g) => sum + g.certifications.length, 0);
          if (active) setCert({ count });
        })
        .catch(() => active && setCert(null));
    })().catch((err) => {
      console.error("Dashboard preview failed:", err);
      if (active) setCareerProblem("failed");
    });
    return () => { active = false; };
  }, [program, facts?.failed, facts?.completedCodes, userId, token]);

  let career = sources ? summariseSources(sources) : null;
  if (careerProblem === "missing") career = { missing: true };
  else if (careerProblem === "failed" || loadFailed) career = { failed: true };

  return { picks, roadmap, career, cert, retryCareer: retryLoad };
}

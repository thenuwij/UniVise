import { useEffect, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";
import { useCareersFeed } from "@/features/career/hooks/useCareersFeed";
import { fetchMatchingRoadmap, finishRoadmap } from "@/features/program/utils/roadmapEntry";
import { fetchSpecialisationIds } from "@/features/program/utils/programCourses";
import { summariseSources } from "../utils/careerSummary";

export function useHomePreview(facts) {
  const { session } = UserAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const program = facts?.program;
  const [picks, setPicks] = useState(null);
  const [roadmapId, setRoadmapId] = useState(null);
  const [careerProblem, setCareerProblem] = useState(null);
  const [placement, setPlacement] = useState(null);
  const { sources, loadFailed, retryLoad } = useCareersFeed(roadmapId);

  useEffect(() => {
    if (!program || facts?.failed || !token) return;
    let active = true;
    apiJson("/course-picks", { token })
      .then((data) => {
        if (active) setPicks({ picks: data.picks || [], available: (data.available || []).length });
      })
      .catch(() => active && setPicks({ picks: [], available: 0 }));
    return () => { active = false; };
  }, [program, facts?.failed, token]);

  useEffect(() => {
    if (!program || facts?.failed || !userId) return;
    let active = true;
    (async () => {
      const ids = await fetchSpecialisationIds(program.degree_code, userId);
      const matching = await fetchMatchingRoadmap(userId, program.degree_code, ids);
      const found = await finishRoadmap({ roadmap: matching, accessToken: token, isActive: () => active });
      if (!active) return;
      if (!found?.payload?.career_pathways) return setCareerProblem("missing");
      setRoadmapId(found.id);
      const placements = found.payload?.industry_experience?.mandatory_placements;
      const code = placements?.required ? placements.course_codes?.[0] : null;
      setPlacement(code ? { code, done: (facts.completedCodes || []).includes(code) } : null);
    })().catch((err) => {
      console.error("Dashboard preview failed:", err);
      if (active) setCareerProblem("failed");
    });
    return () => { active = false; };
  }, [program, facts?.failed, facts?.completedCodes, userId, token]);

  let career = sources ? summariseSources(sources) : null;
  if (careerProblem === "missing") career = { missing: true };
  else if (careerProblem === "failed" || loadFailed) career = { failed: true };

  return { picks, career, placement, retryCareer: retryLoad };
}

import { useEffect, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { useEnrolledProgram } from "@/features/roadmap/hooks/useEnrolledProgram";
import { fetchMyCourses, fetchSavedChoices, fetchSpecialisationOptions } from "@/features/roadmap/utils/programCourses";
import { fetchCompletedCourses } from "@/features/transfer/utils/completedCourses";
import { courseStatus, prereqGroups } from "@/features/mindmesh/utils/availability";

async function loadFacts(program, userId) {
  const code = program.degree_code;
  const [{ data: degree }, choices, options, mine, rows] = await Promise.all([
    supabase.from("unsw_degrees_final").select("minimum_uoc").eq("degree_code", code).maybeSingle(),
    fetchSavedChoices(code, userId),
    fetchSpecialisationOptions(code),
    fetchMyCourses(code, userId),
    fetchCompletedCourses(userId),
  ]);
  const done = rows.filter((r) => r.is_completed);
  const completed = new Set(done.map((r) => r.course_code));
  const { data: edges } = mine.codes.length
    ? await supabase
        .from("mindmesh_edges_global")
        .select("from_key,to_key,edge_type,logic_type,group_id")
        .eq("edge_type", "prereq")
        .in("to_key", mine.codes)
    : { data: [] };
  const groups = prereqGroups(edges);
  return {
    program,
    minimumUoc: degree?.minimum_uoc ?? null,
    uocDone: done.reduce((sum, r) => sum + (r.uoc || 0), 0),
    doneCount: done.length,
    specNames: Object.values(choices).filter(Boolean).map((s) => s.major_name),
    hasSpecOptions: options.length > 0,
    canTakeNext: mine.codes.filter((c) => courseStatus(c, completed, groups) === "available").length,
  };
}

export function useDashboardFacts() {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const { program, loading } = useEnrolledProgram();
  const [facts, setFacts] = useState(null);

  useEffect(() => {
    if (loading || !userId) return;
    if (!program) {
      setFacts({ program: null });
      return;
    }
    let active = true;
    loadFacts(program, userId)
      .then((loaded) => active && setFacts(loaded))
      .catch((err) => {
        console.error("Dashboard facts failed:", err);
        if (active) setFacts({ program, failed: true });
      });
    return () => { active = false; };
  }, [program, loading, userId]);

  return facts;
}

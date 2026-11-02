import { useEffect, useState } from "react";
import { fetchDegree } from "../api";
import { fetchCompletedCourses } from "../utils/completedCourses";

export function useUocProgress(degreeCode, userId, version = 0) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!degreeCode || !userId) return;
    let active = true;
    Promise.all([fetchDegree(degreeCode, "minimum_uoc"), fetchCompletedCourses(userId)])
      .then(([{ data }, rows]) => {
        if (!active) return;
        const done = rows.filter((row) => row.is_completed);
        const uoc = done.reduce((sum, row) => sum + (Number(row.uoc) || 0), 0);
        setProgress({ uoc, count: done.length, minimum: Number(data?.minimum_uoc) || null });
      })
      .catch(() => active && setProgress(null));
    return () => { active = false; };
  }, [degreeCode, userId, version]);

  return progress;
}

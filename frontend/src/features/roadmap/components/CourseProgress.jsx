import { useEffect, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { fetchCompletedCourses } from "@/features/transfer/utils/completedCourses";
import { fetchMyCourses } from "../utils/programCourses";
import { progressOf } from "../utils/myCourses";

export default function CourseProgress({ degreeCode }) {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!degreeCode || !userId) return;
    let active = true;
    Promise.all([fetchMyCourses(degreeCode, userId), fetchCompletedCourses(userId)]).then(([mine, rows]) => {
      const done = new Set(rows.filter((r) => r.is_completed).map((r) => r.course_code));
      const counts = progressOf(mine, done, mine.added);
      if (active && counts.total) setProgress(counts);
    });
    return () => { active = false; };
  }, [degreeCode, userId]);

  if (!progress) return null;
  const pct = Math.round((progress.done / progress.total) * 100);

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 ring-1 ring-white/20">
      <div className="h-2 w-24 rounded-full bg-white/25 overflow-hidden">
        <div className="h-full rounded-full bg-green-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-white">
        {progress.done} of {progress.total} courses done
      </span>
    </div>
  );
}

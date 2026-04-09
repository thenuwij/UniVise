// src/components/CourseRow.jsx
import { useState } from "react";
import { HiCheckCircle } from "react-icons/hi";
import { supabase } from "../../supabaseClient";

async function recalculateStats(userId) {
  const { data: courses } = await supabase
    .from("user_completed_courses")
    .select("*")
    .eq("user_id", userId);

  if (!courses) return;

  const uocCompleted = courses
    .filter((c) => c.is_completed)
    .reduce((sum, c) => sum + c.uoc, 0);

  const { data: currentStats } = await supabase
    .from("user_progress_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!currentStats) return;

  const coursesCompletedCount = courses.filter((c) => c.is_completed).length;
  const uocRemaining = currentStats.total_uoc_required - uocCompleted;

  await supabase
    .from("user_progress_stats")
    .update({
      uoc_completed: uocCompleted,
      uoc_remaining: uocRemaining,
      courses_completed_count: coursesCompletedCount,
      last_updated: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export default function CourseRow({
  course,
  completed,
  userId,
  category,
  courseSource,
  onUpdate
}) {
  const [isCompleted, setIsCompleted] = useState(!!completed?.is_completed);

  const handleToggleComplete = async () => {
    const newCompletedState = !isCompleted;
    setIsCompleted(newCompletedState);

    if (completed) {
      await supabase
        .from("user_completed_courses")
        .update({ is_completed: newCompletedState })
        .eq("id", completed.id);
    } else {
      await supabase.from("user_completed_courses").insert({
        user_id: userId,
        course_code: course.code,
        course_name: course.name,
        uoc: course.uoc,
        is_completed: newCompletedState,
        category: category,
        source_type: courseSource?.source_type || 'program',
        source_code: courseSource?.source_code || null,
      });
    }

    await recalculateStats(userId);
    onUpdate();
  };

  return (
    <div
      onClick={handleToggleComplete}
      className={`flex items-center p-2.5 rounded-lg border transition-all shadow-sm cursor-pointer ${
        isCompleted
          ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-600"
          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={handleToggleComplete}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            isCompleted
              ? "bg-green-500 border-green-500"
              : "border-slate-400 dark:border-slate-500 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
          }`}
        >
          {isCompleted && <HiCheckCircle className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white">
            {course.code} - {course.name}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
            {course.uoc} UOC
          </p>
        </div>
      </div>
    </div>
  );
}

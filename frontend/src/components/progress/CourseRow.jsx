// src/components/CourseRow.jsx
import { useState } from "react";
import { HiCheckCircle, HiPencil } from "react-icons/hi";
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

  const coursesWithMarks = courses.filter((c) => c.mark !== null && c.is_completed);
  let wam = null;
  if (coursesWithMarks.length > 0) {
    const totalWeightedMarks = coursesWithMarks.reduce((sum, c) => sum + c.mark * c.uoc, 0);
    const totalUOC = coursesWithMarks.reduce((sum, c) => sum + c.uoc, 0);
    wam = totalWeightedMarks / totalUOC;
  }

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
      current_wam: wam,
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
  const [mark, setMark] = useState(completed?.mark || "");
  const [editingMark, setEditingMark] = useState(false);

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

  const handleMarkSave = async () => {
    const markValue = parseFloat(mark);
    if (isNaN(markValue) || markValue < 0 || markValue > 100) {
      alert("Please enter a valid mark between 0 and 100");
      return;
    }

    // AUTO-COMPLETE: When entering a mark, automatically mark course as completed
    if (completed) {
      await supabase
        .from("user_completed_courses")
        .update({ 
          mark: markValue,
          is_completed: true  // AUTO-MARK AS COMPLETED
        })
        .eq("id", completed.id);
    } else {
      await supabase.from("user_completed_courses").insert({
        user_id: userId,
        course_code: course.code,
        course_name: course.name,
        uoc: course.uoc,
        mark: markValue,
        is_completed: true,  // AUTO-MARK AS COMPLETED
        category: category,
        source_type: courseSource?.source_type || 'program',
        source_code: courseSource?.source_code || null,
      });
    }

    // Update local state to reflect completion
    setIsCompleted(true);
    setEditingMark(false);
    
    await recalculateStats(userId);
    onUpdate();
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all shadow-sm ${
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
          <p className="font-bold text-sm text-slate-900 dark:text-white">
            {course.code} - {course.name}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
            {course.uoc} UOC
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {editingMark ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={mark}
              onChange={(e) => setMark(e.target.value)}
              placeholder="Mark"
              className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 outline-none"
            />
            <button
              onClick={handleMarkSave}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => setEditingMark(false)}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {completed?.mark ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {completed.mark}
                </span>
                <button
                  onClick={() => {
                    setMark(completed.mark);
                    setEditingMark(true);
                  }}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition"
                >
                  <HiPencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingMark(true)}
                className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Add Mark
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
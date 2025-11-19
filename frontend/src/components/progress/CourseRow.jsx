// src/components/CourseRow.jsx
import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { HiCheckCircle, HiPencil } from "react-icons/hi";

// Helper function to recalculate stats
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

export default function CourseRow({ course, completed, userId, category, onUpdate }) {
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

    if (completed) {
      await supabase
        .from("user_completed_courses")
        .update({ mark: markValue })
        .eq("id", completed.id);
    } else {
      await supabase.from("user_completed_courses").insert({
        user_id: userId,
        course_code: course.code,
        course_name: course.name,
        uoc: course.uoc,
        mark: markValue,
        category: category,
      });
    }

    setEditingMark(false);
    await recalculateStats(userId);
    onUpdate();
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border-2 transition ${
        isCompleted
          ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={handleToggleComplete}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
            isCompleted
              ? "bg-green-500 border-green-500"
              : "border-gray-300 dark:border-gray-600 hover:border-green-500"
          }`}
        >
          {isCompleted && <HiCheckCircle className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {course.code} - {course.name}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{course.uoc} UOC</p>
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
              className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm"
            />
            <button
              onClick={handleMarkSave}
              className="px-3 py-1 rounded bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
            >
              Save
            </button>
            <button
              onClick={() => setEditingMark(false)}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {completed?.mark ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Mark: {completed.mark}
                </span>
                <button
                  onClick={() => {
                    setMark(completed.mark);
                    setEditingMark(true);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition"
                >
                  <HiPencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingMark(true)}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition"
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
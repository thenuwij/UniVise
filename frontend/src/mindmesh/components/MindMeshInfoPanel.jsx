// src/mindmesh/components/MindMeshInfoPanel.jsx
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function MindMeshInfoPanel({ focusedNode, onDismiss }) {
  const navigate = useNavigate();

  if (!focusedNode) return null;

  const { id, label, metadata = {} } = focusedNode;
  const { uoc, faculty, school, level } = metadata;

  const handleViewCourse = async () => {
    if (!id) return;
    try {
      const { data: match } = await supabase
        .from("unsw_courses")
        .select("id")
        .eq("code", id)
        .maybeSingle();
      if (match?.id) navigate(`/course/${match.id}`);
    } catch (err) {
      console.error("Failed to navigate to course:", err);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50
                   bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
                   border-t border-slate-200 dark:border-slate-700 shadow-2xl">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-6">

        {/* Course info */}
        <div className="flex items-center gap-5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{id}</span>
              {uoc && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold
                                 bg-blue-50 dark:bg-blue-900/30
                                 text-blue-700 dark:text-blue-300
                                 border border-blue-200 dark:border-blue-700">
                  {uoc} UOC
                </span>
              )}
              {level && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold
                                 bg-slate-100 dark:bg-slate-800
                                 text-slate-600 dark:text-slate-300
                                 border border-slate-200 dark:border-slate-700">
                  Level {level}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {label}
            </p>
            {(faculty || school) && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {faculty || school}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="text-xs text-slate-400 dark:text-slate-500 hidden md:block">
            Double-click to expand prerequisites
          </p>
          <button
            onClick={handleViewCourse}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                       bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700
                       shadow-sm transition-all duration-200"
          >
            View Course Details
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-lg text-slate-400 dark:text-slate-500
                       hover:bg-slate-100 dark:hover:bg-slate-800
                       hover:text-slate-700 dark:hover:text-slate-200
                       transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

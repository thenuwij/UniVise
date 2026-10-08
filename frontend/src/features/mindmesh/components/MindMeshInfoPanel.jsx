// src/mindmesh/components/MindMeshInfoPanel.jsx
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase";
import { STATUS } from "../utils/availability";
import { otherConditions } from "../utils/conditions";

function RuleItem({ met, children }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full inline-flex items-center justify-center ${met ? "bg-green-500 text-white" : "border-2 border-slate-300 dark:border-slate-600"}`}>
        {met && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className={met ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-slate-100"}>{children}</span>
    </li>
  );
}

export default function MindMeshInfoPanel({ focusedNode, status, requirements = [], completed = new Set(), onToggleDone, saving, onDismiss }) {
  const navigate = useNavigate();
  const [conditions, setConditions] = useState([]);
  const focusedId = focusedNode?.id;

  useEffect(() => {
    let active = true;
    setConditions([]);
    if (!focusedId) return;
    supabase
      .from("unsw_courses")
      .select("conditions_for_enrolment")
      .eq("code", focusedId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setConditions(otherConditions(data?.conditions_for_enrolment));
      });
    return () => { active = false; };
  }, [focusedId]);

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
    <div data-tour="course-card" className="absolute bottom-4 right-4 z-20 w-[min(26rem,calc(100%-2rem))] max-h-[calc(100%-2rem)] overflow-y-auto
                   rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
                   border border-blue-200 dark:border-slate-700 shadow-2xl">
      <div className="relative p-5 flex flex-col gap-4">

        {/* Course info */}
        <div className="flex items-center gap-5 min-w-0 pr-8">
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
            {STATUS[status] && (
              <p className="text-xs font-semibold mt-1" style={{ color: STATUS[status].color }}>
                {STATUS[status].label}
              </p>
            )}
            {status !== "completed" && (
              requirements.length > 0 ? (
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">To take {id} you need</p>
                  <ul className="mt-1.5 space-y-1">
                    {requirements.flatMap((g, i) =>
                      g.logic === "and" || g.codes.length === 1
                        ? g.codes.map((code) => <RuleItem key={`${i}-${code}`} met={completed.has(code)}>{code}</RuleItem>)
                        : [
                            <RuleItem key={i} met={g.codes.some((code) => completed.has(code))}>
                              <span className="font-semibold">One of:</span> {g.codes.join(" · ")}
                            </RuleItem>,
                          ]
                    )}
                  </ul>
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No prerequisite courses.</p>
              )
            )}
            {conditions.length > 0 && (
              <p className="text-xs font-medium mt-1 text-amber-700 dark:text-amber-400">
                Other conditions apply: {conditions.join(", ")}. See the course details.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <p className="-mt-1 text-xs text-slate-400 dark:text-slate-500">Double-click a course to expand its prerequisites.</p>
        <div className="flex flex-wrap items-center gap-2">
          {onToggleDone && (
            <button
              onClick={() => onToggleDone(focusedNode)}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all disabled:opacity-60 ${
                status === "completed"
                  ? "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  : "border-green-500 bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {status === "completed" ? "Undo done" : "Mark as done"}
            </button>
          )}
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
            className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 dark:text-slate-500
                       hover:bg-slate-100 dark:hover:bg-slate-800
                       hover:text-slate-700 dark:hover:text-slate-200
                       transition-colors"
            title="Close"
            aria-label="Close course details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

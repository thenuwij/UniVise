// src/components/CourseRelatedDegrees.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import { courseTile } from "./DetailLayout";

const INITIAL_VISIBLE = 6;

export default function CourseRelatedDegrees({ courseId, courseCode }) {
  const { session } = UserAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!session || (!courseId && !courseCode)) return;

    (async () => {
      setLoading(true);
      setErr(null);
      setShowAll(false);
      try {
        const data = await apiJson("/smart-related/degrees-for-course", {
          method: "POST",
          retry: true,
          token: session.access_token,
          body: {
            course_id: courseId ?? null,
            course_code: courseCode ?? null,
          },
        });
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, courseId, courseCode]);

  if (loading) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
        Loading programs…
      </p>
    );
  }

  if (err) return null;

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No program structure lists this course yet. Check the UNSW Handbook for where it can be taken.
      </p>
    );
  }

  const visible = showAll ? items : items.slice(0, INITIAL_VISIBLE);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visible.map((deg) => (
          <Link key={deg.id} to={`/degrees/${deg.id}`}>
            <div className={courseTile}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{deg.program_name}</p>
                {deg.faculty && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{deg.faculty}</p>
                )}
              </div>
              {deg.program_code && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex-shrink-0">
                  {deg.program_code}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
      {items.length > INITIAL_VISIBLE && (
        <ExpandToggle wide open={showAll} onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show fewer" : `Show all ${items.length} programs`}
        </ExpandToggle>
      )}
    </div>
  );
}

// src/components/CourseRelatedDegrees.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

export default function CourseRelatedDegrees({ courseId, courseCode }) {
  const { session } = UserAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!session || (!courseId && !courseCode)) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/smart-related/degrees-for-course`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              course_id: courseId ?? null,
              course_code: courseCode ?? null,
              top_k: 6,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to fetch related degrees");
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
        Loading related programs…
      </p>
    );
  }

  if (err || items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((deg, i) => (
        <Link key={i} to={`/degrees/${deg.id}`}>
          <div className="flex items-center justify-between gap-3 py-3.5 px-4 rounded-xl bg-gradient-to-br from-white to-sky-50/60 dark:from-slate-800/70 dark:to-sky-900/20 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:from-sky-50 hover:to-sky-100/60 hover:shadow-sm dark:hover:from-slate-800 dark:hover:to-sky-900/30 transition-all cursor-pointer">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{deg.program_name}</p>
              {deg.faculty && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{deg.faculty}</p>
              )}
            </div>
            {deg.program_code && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 flex-shrink-0">
                {deg.program_code}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

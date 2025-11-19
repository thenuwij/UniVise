// src/components/CourseRelatedDegrees.jsx
import React, { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { HiAcademicCap } from "react-icons/hi";

export default function CourseRelatedDegrees({
  courseId,
  courseCode,
  title = "Programs Offering this Course",
  icon = <HiAcademicCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
}) {
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
          "http://localhost:8000/smart-related/degrees-for-course",
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
        if (!res.ok)
          throw new Error(data.detail || "Failed to fetch related degrees");

        // backend returns: id, program_name, program_code, faculty, minimum_uoc
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
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow">
        <p className="text-slate-600 dark:text-slate-300 italic">
          Loading programs offering this course…
        </p>
      </div>
    );
  }

  if (err || items.length === 0) return null;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        {icon}
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((deg, i) => {
          const link = `/degrees/${deg.id}`;

          return (
            <Link
              key={i}
              to={link}
              className="hover:-translate-y-1 hover:shadow-xl transition-all rounded-2xl"
            >
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md">

                {/* Program Name */}
                <p className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
                  {deg.program_name}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 
                                   text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                    Code: {deg.program_code}
                  </span>

                  {deg.faculty && (
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 
                                     text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {deg.faculty}
                    </span>
                  )}

                  {deg.minimum_uoc && (
                    <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/20 
                                     text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      {deg.minimum_uoc} UOC
                    </span>
                  )}
                </div>

                {/* Footer */}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  View full program structure →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

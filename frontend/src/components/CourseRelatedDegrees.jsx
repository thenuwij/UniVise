// src/components/CourseRelatedDegrees.jsx
import React, { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";

export default function CourseRelatedDegrees({ courseId, courseCode, onNavigateDegree }) {
  const { session } = UserAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!session || (!courseId && !courseCode)) return;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await fetch("http://localhost:8000/smart-related/degrees-for-course", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            course_id: courseId ?? null,
            course_code: courseCode ?? null,
            top_k: 4,
            restrict_faculty: true
          }),
        });
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
      <div className="bg-white p-6 rounded-3xl shadow border border-gray-200">
        <div className="text-slate-600 italic">Finding related degrees…</div>
      </div>
    );
  }
  if (err) {
    return null; // or show subtle error
  }
  if (!items.length) return null;

  return (
    <div className="bg-white p-6 rounded-3xl shadow border border-gray-200">
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Related Degrees</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((d) => (
          <button
            key={d.id}
            onClick={() => onNavigateDegree?.(d.id)}
            className="text-left p-4 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-lg font-semibold text-slate-900 group-hover:text-sky-700">
                {d.program_name}
              </div>
              {d.uac_code ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  UAC {d.uac_code}
                </span>
              ) : null}
            </div>
            <div className="text-sm text-slate-600">
              {d.faculty || "—"} {d.score != null ? <span className="ml-2 text-slate-400">• score {d.score.toFixed(2)}</span> : null}
            </div>
            {d.reason ? (
              <div className="text-xs text-slate-500 mt-2 line-clamp-2">{d.reason}</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

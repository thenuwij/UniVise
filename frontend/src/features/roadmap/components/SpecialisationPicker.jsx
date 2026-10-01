import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { fetchComponentDegrees } from "../utils/programCourses";

export default function SpecialisationPicker({ degreeCode, value, onChange }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const degrees = await fetchComponentDegrees(degreeCode);
      const loaded = await Promise.all(degrees.map(async (d) => {
        const { data } = await supabase
          .from("unsw_specialisations")
          .select("id, major_name, specialisation_type")
          .contains("sections_degrees", JSON.stringify([{ degree_code: d.degree_code }]))
          .in("specialisation_type", ["Major", "Honours"])
          .order("major_name");
        return { ...d, options: data || [] };
      }));
      if (active) setGroups(loaded.filter((g) => g.options.length));
    })();
    return () => { active = false; };
  }, [degreeCode]);

  if (!groups.length) return null;

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Your major or stream (optional)</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Your roadmap, course structure and CourseMesh will include its courses.</p>
      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <label key={g.degree_code} className="block">
            {groups.length > 1 && (
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{g.program_name}</span>
            )}
            <select
              value={value?.[g.degree_code]?.id || ""}
              onChange={(e) => {
                const spec = g.options.find((o) => o.id === e.target.value) || null;
                onChange({ ...value, [g.degree_code]: spec });
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Not sure yet</option>
              {g.options.map((o) => (
                <option key={o.id} value={o.id}>{o.major_name}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}

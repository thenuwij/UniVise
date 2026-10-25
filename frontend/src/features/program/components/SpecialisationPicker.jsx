import { useEffect, useState } from "react";
import { fetchSpecialisationOptions } from "../utils/programCourses";

export default function SpecialisationPicker({ degreeCode, value, onChange }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let active = true;
    fetchSpecialisationOptions(degreeCode).then((loaded) => {
      if (active) setGroups(loaded);
    });
    return () => { active = false; };
  }, [degreeCode]);

  if (!groups.length) return null;

  return (
    <div className="mt-6">
      <p className="text-lg font-semibold text-ink-strong">Choose your major or stream</p>
      <p className="mt-1 mb-3 text-[15px] text-ink-muted">Optional. You can change it later.</p>
      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <label key={g.degree_code} className="block">
            {groups.length > 1 && (
              <span className="block text-sm font-medium text-ink mb-1">{g.program_name}</span>
            )}
            <select
              value={value?.[g.degree_code]?.id || ""}
              onChange={(e) => {
                const spec = g.options.find((o) => o.id === e.target.value) || null;
                onChange({ ...value, [g.degree_code]: spec });
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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

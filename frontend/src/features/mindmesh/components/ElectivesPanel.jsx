import { useEffect, useMemo, useState } from "react";
import { Check, Info, MapPin, Plus, Search, X } from "lucide-react";
import { supabase } from "@/shared/lib/supabase";
import { ADDED_SECTION } from "@/features/roadmap/utils/myCourses";

const MIN_SEARCH = 2;
const YOURS = "Your added courses";

function useCourseSearch(query, exclude) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim().replace(/[^\w\s-]/g, "");
    if (q.length < MIN_SEARCH) {
      setResults([]);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(() => {
      supabase
        .from("unsw_courses")
        .select("code, title, uoc")
        .or(`code.ilike.%${q}%,title.ilike.%${q}%`)
        .order("code")
        .limit(25)
        .then(({ data }) => {
          if (!active) return;
          setResults((data || []).filter((c) => !exclude.has(c.code)).map((c) => ({ code: c.code, name: c.title, uoc: c.uoc, section: ADDED_SECTION })));
          setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, exclude]);

  return { results, searching };
}

export default function ElectivesPanel({ options, added, completed, saving, onToggle, onShow, onClose, target = null, suggestions = [], programCodes = null }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const listed = useMemo(
    () =>
      target && programCodes
        ? new Set([...programCodes, ...options.filter((o) => o.section === target && added.has(o.code)).map((o) => o.code)])
        : new Set(options.map((o) => o.code)),
    [options, target, programCodes, added]
  );
  const { results, searching } = useCourseSearch(query, listed);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (option) => !q || `${option.code} ${option.name || ""}`.toLowerCase().includes(q);
    if (target) {
      const here = options.filter((o) => o.section === target && added.has(o.code) && matches(o));
      const done = suggestions.filter((o) => !added.has(o.code) && matches(o));
      return [
        ...(here.length ? [[`In ${target}`, here]] : []),
        ...(done.length ? [["Courses you've done", done]] : []),
        ...(results.length ? [["Other UNSW courses", results]] : []),
      ];
    }
    const yours = [];
    const bySection = new Map();
    for (const option of options) {
      if (q && !`${option.code} ${option.name || ""}`.toLowerCase().includes(q)) continue;
      if (added.has(option.code)) yours.push(option);
      else if (option.section !== ADDED_SECTION) bySection.set(option.section, [...(bySection.get(option.section) || []), option]);
    }
    const ordered = [...(yours.length ? [[YOURS, yours]] : []), ...bySection];
    if (results.length) ordered.push(["Other UNSW courses", results]);
    return ordered;
  }, [options, added, query, results, target, suggestions]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-900/30 cursor-default" />
      <aside role="dialog" aria-label={target ? `Add to ${target}` : "Add courses"} className="relative h-full w-full sm:w-[440px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{target ? `Add to ${target}` : "Add courses"}</h2>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {target
              ? `Search any UNSW course to count it towards ${target}. Courses you've already done can be added too.`
              : "Pick from your program's electives below, or search any UNSW course. Courses you add show in your Courses step and in CourseMesh."}
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any course, e.g. COMP3 or machine learning"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {groups.length === 0 && (
            <p className="text-sm text-ink-muted">
              {searching ? "Searching UNSW courses..." : query.trim().length >= MIN_SEARCH ? "No courses match your search." : "Type at least 2 characters to search every UNSW course."}
            </p>
          )}
          {groups.map(([section, items]) => (
            <section key={section}>
              <h3 className={`text-sm font-bold ${section === YOURS || section === `In ${target}` ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>{section}</h3>
              <ul className="mt-2 space-y-2">
                {items.map((option) => {
                  const isAdded = target ? added.has(option.code) && option.section === target : added.has(option.code);
                  return (
                    <li key={option.code} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-blue-700 dark:text-blue-300">{option.code}</span>
                        {option.name && <span className="block text-sm text-slate-600 dark:text-slate-300 truncate">{option.name}</span>}
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3">
                          <a
                            href={`/course/${encodeURIComponent(option.code)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline"
                          >
                            <Info className="h-3.5 w-3.5" />
                            Details
                          </a>
                          {onShow && isAdded && (
                            <button onClick={() => onShow(option.code)} className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline">
                              <MapPin className="h-3.5 w-3.5" />
                              Show on map
                            </button>
                          )}
                        </span>
                      </span>
                      {completed.has(option.code) && !target ? (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => onToggle(option, !isAdded)}
                          disabled={saving}
                          aria-pressed={isAdded}
                          className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border-2 transition-colors disabled:opacity-50 ${
                            isAdded
                              ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                              : "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:border-blue-500"
                          }`}
                        >
                          {isAdded ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={3} />}
                          {isAdded ? "Added" : "Add"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

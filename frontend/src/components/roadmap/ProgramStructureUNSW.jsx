// src/pages/roadmap/ProgramStructureUNSW.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

// --- Helpers ---
function sumUoC(list = []) {
  return list.reduce((s, c) => s + (Number(c?.uoc) || 0), 0);
}

function getSectionStyle(title = "") {
  const t = title.toLowerCase();

  if (t.includes("core") || t.includes("level 1") || t.includes("level 2") || t.includes("level 3"))
    return {
      color: "blue",
      class:
        "bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100 dark:from-sky-950 dark:via-blue-950 dark:to-indigo-900 border-sky-300/50 dark:border-sky-800",
    };

  if (t.includes("free elective") || t.includes("general education"))
    return {
      color: "amber",
      class:
        "bg-gradient-to-br from-amber-50 via-orange-50 to-orange-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900 border-amber-300/50 dark:border-amber-800",
    };

  return {
    color: "neutral",
    class:
      "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 border-slate-300/50 dark:border-zinc-700",
  };
}

// ---------- Section Component ----------
function Section({ section, isOpen, onToggle, onCourseClick }) {
  const total = section.uoc ?? sumUoC(section.courses);
  const hasCourses = Array.isArray(section.courses) && section.courses.length > 0;
  const { color, class: colorClass } = getSectionStyle(section.title);

  return (
    <div
      className={`rounded-2xl border ${colorClass} shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-300 flex flex-col`}
    >
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 transition-colors duration-300"
      >
        <div className="flex items-center gap-2 text-left">
          <Layers className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm md:text-base">
              {section.title}
            </h3>
            {(color === "blue" || color === "amber") && section.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                {section.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {total ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/70 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border border-white/40 dark:border-slate-700/40">
              {total} UOC
            </span>
          ) : null}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-600 dark:text-slate-300 transition-transform" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-300 transition-transform" />
          )}
        </div>
      </button>

      {/* Section Body */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 text-sm text-slate-800 dark:text-slate-300 space-y-3 border-t border-white/50 dark:border-white/10">
          {color === "neutral" && section.description && (
            <div className="mt-2 text-slate-700 dark:text-slate-400 leading-relaxed">{section.description}</div>
          )}

          {hasCourses ? (
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              {section.courses.map((c, i) => (
                <div
                  key={c.code || i}
                  onClick={() => onCourseClick?.(c)}
                  className="group flex items-center justify-between border border-slate-200/70 dark:border-slate-700/60 rounded-lg px-3 py-2 cursor-pointer bg-white/90 dark:bg-white/5 hover:-translate-y-[1px] hover:shadow-md hover:bg-sky-50/70 dark:hover:bg-sky-900/30 transition-all duration-200"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-400 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                      {c.name}
                    </span>
                  </div>
                  {c.uoc ? (
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{c.uoc} UOC</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            !section.description && (
              <div className="italic text-slate-600 dark:text-slate-400">No courses listed.</div>
            )
          )}

          {section.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 border-t border-slate-200/40 dark:border-slate-700/40 pt-2">
              <span className="font-medium text-slate-800 dark:text-white/80">Note:</span> {section.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Main ----------
export default function ProgramStructureUNSW({ degreeCode, sections: propSections }) {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 🧠 Collect unique course codes for MindMesh preloading
  const allCourses = useMemo(() => {
    const codes = sections.flatMap((s) => s.courses || []).map((c) => c.code).filter(Boolean);
    return Array.from(new Set(codes));
  }, [sections]);

  // 🧭 Handle "Visualise Program Structure"
  const handleVisualise = () => {
    if (!degreeCode || !allCourses.length) return;
    console.log("🧩 Visualising MindMesh for:", degreeCode, allCourses);
    localStorage.setItem("programCourses", JSON.stringify(allCourses));
    navigate(`/planner/mindmesh?program=${degreeCode}`);
  };

  // --- Fetch program structure from Supabase ---
  useEffect(() => {
    const fetchStructure = async () => {
      if (propSections?.length > 0) {
        const filtered = propSections.filter((s) => !s?.title?.toLowerCase()?.includes("overview"));
        setSections(filtered);
        setOpenMap({});
        return;
      }
      if (!degreeCode) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("degree_versions_structure")
          .select("sections")
          .eq("degree_code", degreeCode)
          .maybeSingle();

        if (error) throw error;

        let parsed = [];
        try {
          parsed = typeof data.sections === "string" ? JSON.parse(data.sections) : data.sections;
          if (typeof parsed === "string") parsed = JSON.parse(parsed);
        } catch {
          parsed = [];
        }

        const ordered = parsed
          .filter((s) => s && s.title && !s.title.toLowerCase().includes("overview"))
          .sort((a, b) => {
            const getLevel = (t) =>
              /level\s*(\d+)/i.test(t) ? parseInt(t.match(/level\s*(\d+)/i)[1]) : 99;
            return getLevel(a.title) - getLevel(b.title);
          })
          .sort((a, b) => {
            const getColorRank = (t) => {
              const tt = t.toLowerCase();
              if (tt.includes("core") || tt.includes("level")) return 0;
              if (tt.includes("elective") || tt.includes("general")) return 1;
              return 2;
            };
            return getColorRank(a.title) - getColorRank(b.title);
          });

        setSections(ordered);
        setOpenMap({});
      } catch (e) {
        console.error(e);
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStructure();
  }, [degreeCode, propSections]);

  const toggleSection = (key) => setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  const expandAll = () => {
    const newMap = {};
    sections.forEach((s, i) => (newMap[`${s.title}-${i}`] = true));
    setOpenMap(newMap);
  };
  const collapseAll = () => {
    const newMap = {};
    sections.forEach((s, i) => (newMap[`${s.title}-${i}`] = false));
    setOpenMap(newMap);
  };

  const handleCourseClick = async (course) => {
    if (!course?.code) return;
    const { data: match } = await supabase
      .from("unsw_courses")
      .select("id")
      .eq("code", course.code)
      .maybeSingle();
    if (match?.id) navigate(`/course/${match.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl font-normal tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 dark:bg-clip-text dark:text-transparent">
            Program Structure
          </h2>
          <button
            onClick={handleVisualise}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-br from-blue-600 to-sky-500 hover:bg-gradient-to-bl shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-700"
          >
            <Layers className="w-5 h-5 text-white/90" />
            Visualise Program Structure
          </button>
        </div>

        {/* Expand / Collapse */}
        <div className="flex gap-2 mt-1 sm:mt-0">
          <button
            onClick={expandAll}
            className="text-xs px-3 py-1.5 rounded-md border border-sky-300/60 bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-800/60 transition-colors duration-200"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300/60 bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors duration-200"
          >
            Collapse All
          </button>
        </div>
      </div>

      <p className="mt-2 text-base text-slate-700 dark:text-slate-400">
        Explore the courses and components that make up your degree and click on the courses to explore them in more detail.
      </p>

      {/* Sections */}
      {loading ? (
        <div className="text-sm text-slate-600 italic">Loading program structure…</div>
      ) : err ? (
        <div className="text-sm text-red-500 italic">Failed to load structure: {err}</div>
      ) : sections.length > 0 ? (
        (() => {
          const interactiveSections = sections.filter((s) =>
            ["blue", "amber"].includes(getSectionStyle(s.title).color)
          );
          const neutralSections = sections.filter(
            (s) => getSectionStyle(s.title).color === "neutral"
          );

          return (
            <>
              <div className="flex flex-wrap gap-5">
                {interactiveSections.map((sec, i) => {
                  const key = `${sec.title}-${i}`;
                  return (
                    <div key={key} className="w-full md:w-[calc(50%-0.625rem)]">
                      <Section
                        section={sec}
                        isOpen={!!openMap[key]}
                        onToggle={() => toggleSection(key)}
                        onCourseClick={handleCourseClick}
                      />
                    </div>
                  );
                })}
              </div>

              {neutralSections.length > 0 && (
                <div className="mt-12 space-y-8">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Additional Program Information
                  </h3>
                  {neutralSections.map((s, i) => (
                    <div
                      key={`${s.title}-${i}`}
                      className="w-full rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white/90 to-slate-50/70 dark:from-slate-950/70 dark:to-slate-900/60 backdrop-blur-sm shadow-md hover:shadow-lg hover:-translate-y-[1px] transition-all duration-300 px-8 py-6"
                    >
                      <h4 className="font-semibold text-slate-900 dark:text-white text-lg mb-3 tracking-tight">
                        {s.title}
                      </h4>
                      {s.description ? (
                        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 max-w-5xl">
                          {s.description}
                        </p>
                      ) : (
                        <p className="italic text-sm text-slate-500 dark:text-slate-500">No details available.</p>
                      )}
                      {s.notes && (
                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
                          <span className="font-medium text-slate-800 dark:text-white/80">Note:</span> {s.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()
      ) : (
        <div className="text-sm text-slate-600 italic">No structure data available for this program.</div>
      )}
    </div>
  );
}

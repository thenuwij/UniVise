// src/pages/roadmap/ProgramStructureUNSW.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { ChevronDown, ChevronUp, Layers, BookOpen, Sparkles } from "lucide-react";

/**
 * Premium Program Structure Component
 *
 * Matches design style of CareerPathways / ProgramFlexibility / CapstoneHonours.
 * - Outer white/surface card container
 * - Inner gradient-tinted section cards
 * - Smooth expand/collapse transitions
 * - Polished buttons & typography
 */

function sumUoC(list = []) {
  return list.reduce((s, c) => s + (Number(c?.uoc) || 0), 0);
}

function getSectionStyle(title = "") {
  const t = title.toLowerCase();

  if (t.includes("core") || t.includes("level 1") || t.includes("level 2") || t.includes("level 3"))
    return {
      color: "blue",
      class:
        "bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-sky-950 dark:via-blue-950 dark:to-indigo-900 border-sky-300/50 dark:border-sky-800",
    };

  if (t.includes("free elective") || t.includes("general education"))
    return {
      color: "amber",
      class:
        "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900 border-amber-300/50 dark:border-amber-800",
    };

  return {
    color: "neutral",
    class:
      "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 border-slate-300/50 dark:border-zinc-700",
  };
}

// ---------- Section Card ----------
function Section({ section, isOpen, onToggle, onCourseClick }) {
  const total = section.uoc ?? sumUoC(section.courses);
  const hasCourses = Array.isArray(section.courses) && section.courses.length > 0;
  const { color, class: colorClass } = getSectionStyle(section.title);

  return (
    <div
      className={`rounded-2xl border ${colorClass} shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 backdrop-blur-sm`}
    >
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-colors duration-300 bg-gradient-to-r from-white/70 to-white/30 dark:from-white/5 dark:to-white/10"
      >
        <div className="flex items-center gap-3 text-left">
          <div
            className={`p-2 rounded-lg ${
              color === "amber"
                ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30"
                : "bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30"
            }`}
          >
            <BookOpen className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                {section.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {total ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-white/40 dark:border-slate-700/40 font-semibold">
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
        <div className="px-6 pb-5 pt-3 text-sm text-slate-800 dark:text-slate-300 space-y-3 border-t border-white/50 dark:border-white/10">
          {hasCourses ? (
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {section.courses.map((c, i) => (
                <div
                  key={c.code || i}
                  onClick={() => onCourseClick?.(c)}
                  className="group flex items-center justify-between border border-slate-200/70 dark:border-slate-700/60 rounded-lg px-3 py-2 cursor-pointer bg-white/80 dark:bg-white/5 hover:-translate-y-[1px] hover:shadow-md hover:bg-sky-50/80 dark:hover:bg-sky-900/40 transition-all duration-200"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-400 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                      {c.name}
                    </span>
                  </div>
                  {c.uoc ? (
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {c.uoc} UOC
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="italic text-slate-600 dark:text-slate-400">No courses listed.</p>
          )}

          {section.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 border-t border-slate-200/40 dark:border-slate-700/40 pt-2">
              <span className="font-medium text-slate-800 dark:text-white/80">Note:</span>{" "}
              {section.notes}
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

  const allCourses = useMemo(() => {
    const codes = sections.flatMap((s) => s.courses || []).map((c) => c.code).filter(Boolean);
    return Array.from(new Set(codes));
  }, [sections]);

  const handleVisualise = () => {
    if (!degreeCode || !allCourses.length) return;
    localStorage.setItem("programCourses", JSON.stringify(allCourses));
    navigate(`/planner/mindmesh?program=${degreeCode}`);
  };

  // --- Fetch program structure ---
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 p-8 shadow-xl space-y-8">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30 shadow-sm">
            <Layers className="h-6 w-6 text-sky-700 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Program Structure
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Explore each course and structural component of your degree
            </p>
          </div>
        </div>

        <button
          onClick={handleVisualise}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white 
                     bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 
                     hover:from-sky-600 hover:via-blue-600 hover:to-indigo-600
                     shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Layers className="w-5 h-5" />
          Visualise in MindMesh
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={expandAll}
          className="text-xs px-3 py-1.5 rounded-lg border border-sky-300/60 bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-800/60 transition-colors duration-200"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-300/60 bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors duration-200"
        >
          Collapse All
        </button>
      </div>

      <p className="text-base text-slate-700 dark:text-slate-400 leading-relaxed">
        Browse through your degree structure and click on any course to view details or explore it in MindMesh.
      </p>

      {/* ========== PROGRAM SECTIONS ========== */}
      <div className="pt-2 space-y-6">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 mt-4 p-4 
                          bg-gradient-to-r from-blue-50/50 to-indigo-50/50 
                          dark:from-blue-900/10 dark:to-indigo-900/10 
                          rounded-xl border border-blue-200/40 dark:border-blue-800/40 animate-pulse">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Loading program structure...</span>
          </div>
        ) : err ? (
          <div className="text-sm text-red-500 italic">Failed to load structure: {err}</div>
        ) : sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((sec, i) => {
              const key = `${sec.title}-${i}`;
              return (
                <Section
                  key={key}
                  section={sec}
                  isOpen={!!openMap[key]}
                  onToggle={() => toggleSection(key)}
                  onCourseClick={handleCourseClick}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-600 italic">
            No structure data available for this program.
          </div>
        )}
      </div>
    </div>
  );
}

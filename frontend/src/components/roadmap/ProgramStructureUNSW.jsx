// src/pages/roadmap/ProgramStructureUNSW.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { ChevronDown, ChevronUp, Layers, BookOpen, Sparkles, Info, AlertCircle } from "lucide-react";

/**
 * Redesigned Premium Program Structure Component
 * 
 * Key improvements:
 * - Unified color scheme (blue/indigo gradient)
 * - Smart section rendering (cards for info-only, expandable for courses)
 * - Better text formatting with proper list parsing
 * - Cleaner visual hierarchy
 */

function sumUoC(list = []) {
  return list.reduce((s, c) => s + (Number(c?.uoc) || 0), 0);
}

// ---------- Info-Only Section Card (no courses) ----------
function InfoSection({ section }) {
  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                    bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-800/50
                    p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 
                      dark:from-sky-900/30 dark:to-indigo-900/30 flex-shrink-0">
          <Info className="h-4 w-4 text-sky-700 dark:text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
            {section.title}
          </h3>
          {section.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {section.description}
            </p>
          )}
          {section.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 pt-2 
                        border-t border-slate-200/50 dark:border-slate-700/50">
              {section.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Expandable Section Card (with courses) ----------
function CourseSection({ section, isOpen, onToggle, onCourseClick }) {
  const total = section.uoc ?? sumUoC(section.courses);

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                    bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-800/50
                    shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 
                   hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 text-left flex-1">
          <div className="p-2 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 
                        dark:from-sky-900/30 dark:to-indigo-900/30 flex-shrink-0">
            <BookOpen className="h-4 w-4 text-sky-700 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                {section.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full 
                         bg-sky-50 dark:bg-sky-900/30 
                         text-sky-700 dark:text-sky-300 
                         border border-sky-200/50 dark:border-sky-700/50 font-semibold">
            {section.courses?.length || 0} courses • {total} UOC
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          )}
        </div>
      </button>

      {/* Section Body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
            {section.courses?.map((c, i) => (
              <div
                key={c.code || i}
                onClick={() => onCourseClick?.(c)}
                className="group flex items-center justify-between 
                          rounded-xl px-3.5 py-3 cursor-pointer
                          bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 
                          dark:from-sky-900/20 dark:via-blue-900/20 dark:to-indigo-900/20
                          border border-sky-100/60 dark:border-sky-800/60
                          hover:border-sky-400 dark:hover:border-sky-500
                          hover:shadow-md hover:-translate-y-0.5
                          transition-all duration-200"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold text-sky-800 dark:text-sky-300 
                                  group-hover:text-sky-700 dark:group-hover:text-sky-400">
                    {c.code}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 
                                  line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                    {c.name}
                  </span>
                </div>
                {c.uoc && (
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 
                                  bg-sky-100/70 dark:bg-sky-900/40 
                                  border border-sky-200/60 dark:border-sky-700/60
                                  rounded-full px-2.5 py-1 ml-3 flex-shrink-0">
                    {c.uoc} UOC
                  </span>
                )}
              </div>

            ))}
          </div>

          {section.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 pt-3 
                        border-t border-slate-200/40 dark:border-slate-700/40 leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Note: </span>
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
  const [structureDescription, setStructureDescription] = useState("");
  const [minimumUoc, setMinimumUoc] = useState(null);
  const [specialNotes, setSpecialNotes] = useState("");

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
        const filtered = propSections.filter(
          (s) => !s?.title?.toLowerCase()?.includes("overview")
        );
        setSections(filtered);
        setOpenMap({});
        return;
      }

      if (!degreeCode) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("unsw_degrees_final")
          .select("sections, program_structure, minimum_uoc, special_notes")
          .eq("degree_code", degreeCode)
          .maybeSingle();

        if (error) throw error;

        let parsed = [];
        try {
          parsed = typeof data.sections === "string" ? JSON.parse(data.sections) : data.sections;
          if (typeof parsed === "string") parsed = JSON.parse(parsed);
        } catch (err) {
          console.warn("JSON parse error for sections:", err);
          parsed = [];
        }

        const ordered = parsed
          .filter((s) => s && s.title && !s.title.toLowerCase().includes("overview"))
          .sort((a, b) => {
            const getLevel = (t) =>
              /level\s*(\d+)/i.test(t) ? parseInt(t.match(/level\s*(\d+)/i)[1]) : 99;
            return getLevel(a.title) - getLevel(b.title);
          });

        setSections(ordered);
        setStructureDescription(data?.program_structure || "");
        setMinimumUoc(data?.minimum_uoc || null);
        setSpecialNotes(data?.special_notes || "");
        setOpenMap({});
      } catch (e) {
        console.error("Error during fetchStructure:", e);
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
    sections.forEach((s, i) => {
      if (s.courses?.length > 0) {
        newMap[`${s.title}-${i}`] = true;
      }
    });
    setOpenMap(newMap);
  };
  
  const collapseAll = () => setOpenMap({});

  const handleCourseClick = async (course) => {
    if (!course?.code) return;
    const { data: match } = await supabase
      .from("unsw_courses")
      .select("id")
      .eq("code", course.code)
      .maybeSingle();
    if (match?.id) navigate(`/course/${match.id}`);
  };

  function formatStructureText(text = "") {
    if (!text) return "";

    let cleaned = text
      .replace(/\r?\n+/g, "\n")
      .replace(/\u2022/g, "•") // normalise bullet char
      .trim();

    const lines = cleaned
      .split(/\n|(?=\b\d+\.\s)|(?=•)/g)
      .map(l => l.trim())
      .filter(Boolean);

    let html = '<div class="space-y-1.5">';

    for (const line of lines) {
      // Numbered items (keep numbers, no bullets)
      if (/^\d+\.\s*/.test(line)) {
        html += `<p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          ${line}
        </p>`;
        continue;
      }

      // Bullets (•)
      if (line.startsWith("•")) {
        html += `<p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300 flex gap-2">
          <span class="text-sky-600 dark:text-sky-400 flex-shrink-0">•</span>
          <span>${line.replace(/^•\s*/, "")}</span>
        </p>`;
        continue;
      }

      // Dashes (–)
      if (/^[-–]\s*/.test(line)) {
        html += `<p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300 flex gap-2 pl-4">
          <span class="text-slate-500 dark:text-slate-500 flex-shrink-0">-</span>
          <span>${line.replace(/^[-–]\s*/, "")}</span>
        </p>`;
        continue;
      }

      // Regular text
      html += `<p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300">${line}</p>`;
    }

    html += "</div>";
    return html;
  }


  // Format special notes with better structure
  function formatSpecialNotes(text = "") {
    if (!text) return "";

    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    return sentences
      .map(s => `<p class="text-sm leading-relaxed">${s}</p>`)
      .join('');
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 p-8 shadow-xl space-y-6">
      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-t-2xl" />

     {/* ========== HEADER ========== */}
    <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                    px-8 py-6 -mx-8 -mt-8 mb-6 border-b-2 border-slate-200 dark:border-slate-700
                    rounded-t-2xl">
      
      {/* Very subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Layers className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Program Structure
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Complete course breakdown and degree requirements
            </p>
          </div>
        </div>

        <button
          onClick={handleVisualise}
          disabled={!allCourses.length}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white 
                    bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 
                    hover:from-sky-600 hover:via-blue-600 hover:to-indigo-600
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Layers className="w-4 h-4" />
          Visualise in MindMesh
        </button>
      </div>
    </div>

      {/* Controls & Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {minimumUoc && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold
                           bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300
                           border border-sky-200/50 dark:border-sky-700/50">
              {minimumUoc} UOC Required
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs px-3 py-1.5 rounded-lg 
                     bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300
                     hover:bg-slate-200 dark:hover:bg-slate-700
                     border border-slate-200 dark:border-slate-700
                     transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-3 py-1.5 rounded-lg
                     bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300
                     hover:bg-slate-200 dark:hover:bg-slate-700
                     border border-slate-200 dark:border-slate-700
                     transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Structure Description */}
      {structureDescription && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50/50 via-blue-50/50 to-indigo-50/50
                      dark:from-sky-900/10 dark:via-blue-900/10 dark:to-indigo-900/10
                      border border-sky-200/40 dark:border-sky-800/40">
          <div className="flex items-start gap-2 mb-2">
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Program Overview
            </h3>
          </div>
          <div
            className="text-slate-700 dark:text-slate-300 pl-6"
            dangerouslySetInnerHTML={{ __html: formatStructureText(structureDescription) }}
          />
        </div>
      )}

      {/* User Guidance Note */}
      <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400 
                      italic px-1">
        <Info className="h-4 w-4 text-sky-500 dark:text-sky-400 flex-shrink-0 mt-0.5" />
        <p>
          Expand sections to explore their courses, and click any course to view detailed
          information. You can also use <span className="font-semibold text-sky-600 dark:text-sky-400">
          Visualise in Mesh</span> above to see how courses connect across the degree.
          This page shows the overall program structure — Honours and specialisation options
          can be selected in the next section.
        </p>
      </div>



      {/* ========== PROGRAM SECTIONS ========== */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-3 p-5 rounded-xl
                        bg-slate-50 dark:bg-slate-800/50
                        border border-slate-200 dark:border-slate-700">
            <Sparkles className="h-5 w-5 text-sky-600 dark:text-sky-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Loading program structure...
            </span>
          </div>
        ) : err ? (
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-900/20 
                        border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{err}</p>
          </div>
        ) : sections.length > 0 ? (
          <>
            {sections.map((sec, i) => {
              const key = `${sec.title}-${i}`;
              const hasCourses = sec.courses && sec.courses.length > 0;

              return hasCourses ? (
                <CourseSection
                  key={key}
                  section={sec}
                  isOpen={!!openMap[key]}
                  onToggle={() => toggleSection(key)}
                  onCourseClick={handleCourseClick}
                />
              ) : (
                <InfoSection key={key} section={sec} />
              );
            })}
          </>
        ) : (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 italic">
            No structure data available for this program.
          </div>
        )}
      </div>

      {/* Special Notes */}
      {specialNotes && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50
                      dark:from-amber-900/10 dark:to-orange-900/10
                      border border-amber-200/40 dark:border-amber-800/40">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Important Information
            </h4>
          </div>
          <div
            className="text-slate-700 dark:text-slate-300 pl-7 space-y-2"
            dangerouslySetInnerHTML={{ __html: formatSpecialNotes(specialNotes) }}
          />
        </div>
      )}
    </div>
  );
}
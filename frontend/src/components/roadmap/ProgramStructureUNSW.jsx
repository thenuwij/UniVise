// src/pages/roadmap/ProgramStructureUNSW.jsx
import { ChevronDown, ChevronUp, Info, Layers, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SaveButton from "../../components/SaveButton";
import { supabase } from "../../supabaseClient";

function sumUoC(list = []) {
  return list.reduce((s, c) => s + (Number(c?.uoc) || 0), 0);
}

function InfoSection({ section }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 dark:border-slate-600
                    bg-white dark:bg-slate-900
                    p-5 shadow-md">
      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-3">
        {section.title}
      </h3>
      {section.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {section.description}
        </p>
      )}
      {section.notes && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 
                    border-t-2 border-slate-200 dark:border-slate-700">
          {section.notes}
        </p>
      )}
    </div>
  );
}

// Expandable Section Card with courses 
function CourseSection({ section, isOpen, onToggle, onCourseClick }) {
  const total = section.uoc ?? sumUoC(section.courses);

  return (
    <div className="rounded-xl border-2 border-slate-300 dark:border-slate-600
                    bg-gradient-to-br from-blue-50/30 via-blue-50/50 to-blue-50/30
                    dark:from-blue-900/10 dark:via-blue-900/15 dark:to-blue-900/10
                    shadow-md hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500
                    transition-all duration-200 overflow-hidden group">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4
                   hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors
                   cursor-pointer"
      >
        <div className="flex items-center gap-3 text-left flex-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg
                         group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                {section.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs px-3 py-1.5 rounded-full 
                         bg-blue-50 dark:bg-blue-900/30 
                         text-blue-700 dark:text-blue-300 
                         border-2 border-blue-300 dark:border-blue-700 font-bold
                         group-hover:bg-blue-100 dark:group-hover:bg-blue-800/40
                         group-hover:border-blue-400 dark:group-hover:border-blue-500
                         transition-all shadow-sm">
            {section.courses?.length || 0} courses • {total} UOC
          </span>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400 
                                 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400
                                   group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          )}
        </div>
      </button>

      {/* Section Body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-4 pt-2 border-t-2 border-slate-200 dark:border-slate-700">
          <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
            {section.courses?.map((c, i) => (
              <div
                key={c.code || i}
                onClick={() => onCourseClick?.(c)}
                className="group flex items-center justify-between 
                          rounded-xl px-3.5 py-3 cursor-pointer
                          bg-blue-50 dark:bg-blue-900/20
                          border-2 border-blue-300 dark:border-blue-700
                          hover:border-blue-400 dark:hover:border-blue-500
                          hover:shadow-md hover:-translate-y-0.5
                          transition-all duration-200"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold text-blue-800 dark:text-blue-300 
                                  group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {c.code}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 
                                  line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {c.name}
                  </span>
                </div>
                {c.uoc && (
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 
                                  bg-blue-100 dark:bg-blue-900/40 
                                  border-2 border-blue-300 dark:border-blue-700
                                  rounded-full px-2.5 py-1 ml-3 flex-shrink-0 shadow-sm">
                    {c.uoc} UOC
                  </span>
                )}
              </div>

            ))}
          </div>

          {section.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 pt-3 
                        border-t-2 border-slate-200 dark:border-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Note: </span>
              {section.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main 
export default function ProgramStructureUNSW({ degreeCode, sections: propSections }) {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [structureDescription, setStructureDescription] = useState("");
  const [minimumUoc, setMinimumUoc] = useState(null);
  const [specialNotes, setSpecialNotes] = useState("");
  
  const firstExpandableSectionRef = useRef(null);

  const allCourses = useMemo(() => {
    const codes = sections.flatMap((s) => s.courses || []).map((c) => c.code).filter(Boolean);
    return Array.from(new Set(codes));
  }, [sections]);

  // Check if there are any expandable sections
  const hasExpandableSections = useMemo(() => {
    return sections.some(s => s.courses && s.courses.length > 0);
  }, [sections]);

  const handleVisualise = () => {
    if (!degreeCode || !allCourses.length) return;
    localStorage.setItem("programCourses", JSON.stringify(allCourses));
    navigate(`/planner/mindmesh?program=${degreeCode}`);
  };

  // Fetch program structure
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
    
    // Auto-scroll to first expandable section after a short delay
    setTimeout(() => {
      if (firstExpandableSectionRef.current) {
        firstExpandableSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }
    }, 100);
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
      .replace(/\u2022/g, "•") 
      .trim();

    const lines = cleaned
      .split(/\n|(?=\b\d+\.\s)|(?=•)/g)
      .map(l => l.trim())
      .filter(Boolean);

    let html = '<div class="space-y-1.5">';

    for (const line of lines) {
      // Numbered items 
      if (/^\d+\.\s*/.test(line)) {
        html += `<p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          ${line}
        </p>`;
        continue;
      }

      // Bullets
      if (line.startsWith("•")) {
        html += `<p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300 flex gap-2">
          <span class="text-sky-600 dark:text-sky-400 flex-shrink-0">•</span>
          <span>${line.replace(/^•\s*/, "")}</span>
        </p>`;
        continue;
      }

      // Dashes 
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
                    dark:border-slate-700/60 p-6 shadow-xl space-y-6">
      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl" />

     {/* HEADER - COMPACT */}
    <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                    px-6 py-4 -mx-6 -mt-6 mb-4 border-b-2 border-slate-200 dark:border-slate-700
                    rounded-t-2xl">
              
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Layers className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Program Structure
          </h2>
          {minimumUoc && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold
                           bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300
                           border-2 border-blue-300/50 dark:border-blue-600/50 shadow-sm">
              {minimumUoc} UOC Required
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SaveButton
            itemType="degree"
            itemId={degreeCode}
            itemName={`Program Structure — ${degreeCode}`}
            itemData={{
              degree_code: degreeCode,
              total_sections: sections?.length || 0,
              minimum_uoc: minimumUoc,
              structure_description: structureDescription,
            }}
          />

          <button
            onClick={handleVisualise}
            disabled={!allCourses.length}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white 
                      bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
                      hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
                      disabled:opacity-50 disabled:cursor-not-allowed
                      shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Layers className="w-5 h-5" />
            Visualise Courses
          </button>
        </div>
      </div>
    </div>

      {/* Controls & Info */}
      <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Quick Guide</h4>
              <div className="space-y-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  • Click sections below to expand and view courses
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  • Click any course for detailed information
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  • Click <span className="text-blue-600 dark:text-blue-400 font-bold">'Visualise Courses'</span> above to see how courses connect
                </p>
              </div>
            </div>
          </div>
          
          {hasExpandableSections && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={expandAll}
                className="text-sm px-4 py-2.5 rounded-xl font-bold
                         bg-blue-600 text-white dark:bg-blue-600 dark:text-white
                         hover:bg-blue-700 dark:hover:bg-blue-700
                         border-2 border-blue-700 dark:border-blue-800
                         shadow-sm hover:shadow-md transition-all whitespace-nowrap hover:scale-105"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-sm px-4 py-2.5 rounded-xl font-bold
                         bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300
                         hover:bg-slate-50 dark:hover:bg-slate-700
                         border-2 border-slate-300 dark:border-slate-600
                         shadow-sm hover:shadow-md transition-all whitespace-nowrap"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Structure Description - SILVER/SLATE THEME */}
      {structureDescription && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50
                      dark:from-slate-800/60 dark:via-slate-800/80 dark:to-slate-800/60
                      border-2 border-slate-300 dark:border-slate-600 shadow-md">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Program Overview
          </h3>
          <div
            className="text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{ __html: formatStructureText(structureDescription) }}
          />
        </div>
      )}

      {/* PROGRAM SECTIONS */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 p-5 rounded-xl
                        bg-blue-50 dark:bg-blue-900/20
                        border-2 border-blue-300 dark:border-blue-700 shadow-sm">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Loading program structure...
            </span>
          </div>
        ) : err ? (
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-900/20 
                        border-2 border-red-300 dark:border-red-700 shadow-sm">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{err}</p>
          </div>
        ) : sections.length > 0 ? (
          <>
            {sections.map((sec, i) => {
              const key = `${sec.title}-${i}`;
              const hasCourses = sec.courses && sec.courses.length > 0;
              const isFirstExpandable = hasCourses && sections.slice(0, i).every(s => !s.courses || s.courses.length === 0);

              return hasCourses ? (
                <div key={key} ref={isFirstExpandable ? firstExpandableSectionRef : null}>
                  <CourseSection
                    section={sec}
                    isOpen={!!openMap[key]}
                    onToggle={() => toggleSection(key)}
                    onCourseClick={handleCourseClick}
                  />
                </div>
              ) : (
                <InfoSection key={key} section={sec} />
              );
            })}
          </>
        ) : (
          <div className="text-center py-10 px-5 rounded-xl border-2 border-slate-300 dark:border-slate-600
                        bg-slate-50 dark:bg-slate-800/50">
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              No structure data available for this program.
            </p>
          </div>
        )}
      </div>

      {/* Special Notes - ORANGE/AMBER THEME FOR IMPORTANT INFO */}
      {specialNotes && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50
                      dark:from-amber-900/20 dark:to-orange-900/20
                      border-2 border-amber-300 dark:border-amber-700 shadow-md">
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Important Information
          </h4>
          <div
            className="text-slate-700 dark:text-slate-300 space-y-2"
            dangerouslySetInnerHTML={{ __html: formatSpecialNotes(specialNotes) }}
          />
        </div>
      )}
    </div>
  );
}
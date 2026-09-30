// src/pages/roadmap/ProgramStructureUNSW.jsx
import { Check, ChevronDown, ChevronUp, Info, Layers, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SaveButton from "@/shared/ui/SaveButton";
import { supabase } from "@/shared/lib/supabase";
import { UserAuth } from "@/app/AuthContext";
import { fetchCompletedCourses, setCourseCompleted } from "@/features/transfer/utils/completedCourses";
import { fetchMajorSections, hasCourses, parseSections } from "../utils/programCourses";

function sumUoC(list = []) {
  return list.reduce((s, c) => s + (Number(c?.uoc) || 0), 0);
}

const HANDBOOK_PROGRAM_URL = "https://www.handbook.unsw.edu.au/undergraduate/programs/2026";

function NoCourseListNotice({ handbookUrl }) {
  return (
    <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 shadow-sm">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
        UniVise does not have a course list for this program yet, so there is nothing to visualise here.
        Its courses may sit inside a major or stream. Choose a major in the Specialisations step to see its courses here.
      </p>
      <a
        href={handbookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline"
      >
        View the full structure in the official UNSW Handbook
      </a>
    </div>
  );
}

function InfoSection({ section }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 px-5 py-3 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
        {section.title}
      </h3>
      {section.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {section.description}
        </p>
      )}
      {section.notes && (
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 pt-2
                    border-t border-slate-200 dark:border-slate-600">
          {section.notes}
        </p>
      )}
    </div>
  );
}

// Expandable Section Card with courses 
function DoneToggle({ done, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-pressed={done}
      className={`ml-2 flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border-2 transition-all ${
        done
          ? "bg-green-500 border-green-500 text-white"
          : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-green-500 hover:text-green-600"
      }`}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
      Done
    </button>
  );
}

function CourseSection({ section, isOpen, onToggle, onCourseClick, completed, onToggleDone }) {
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
                  <span className="text-xs text-slate-800 dark:text-slate-200 
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
                {onToggleDone && (
                  <DoneToggle
                    done={!!completed?.[c.code]?.is_completed}
                    onClick={() => onToggleDone(c, section.title)}
                  />
                )}
              </div>

            ))}
          </div>

          {section.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 pt-3 
                        border-t-2 border-slate-200 dark:border-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Note: </span>
              {section.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main 
export default function ProgramStructureUNSW({ degreeCode, sections: propSections, trackCompletion = false }) {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [completed, setCompleted] = useState({});
  const pendingRef = useRef(new Set());
  const [sections, setSections] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [minimumUoc, setMinimumUoc] = useState(null);
  const [specialNotes, setSpecialNotes] = useState("");
  const [handbookUrl, setHandbookUrl] = useState("");
  
  const [major, setMajor] = useState(null);
  
  const firstExpandableSectionRef = useRef(null);

  const programHasCourses = useMemo(() => sections.some(hasCourses), [sections]);

  const courseSections = useMemo(
    () => (programHasCourses ? sections.filter(hasCourses) : major?.sections || []),
    [programHasCourses, sections, major]
  );

  const allCourses = useMemo(() => {
    const codes = courseSections.flatMap((s) => s.courses || []).map((c) => c.code).filter(Boolean);
    return Array.from(new Set(codes));
  }, [courseSections]);

  const hasExpandableSections = courseSections.length > 0;

  const handleVisualise = () => {
    if (!degreeCode || !allCourses.length) return;
    navigate(`/coursemesh?program=${degreeCode}`);
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
          .select("sections, minimum_uoc, special_notes, source_url")
          .eq("degree_code", degreeCode)
          .maybeSingle();

        if (error) throw error;

        const parsed = parseSections(data?.sections);

        const ordered = parsed
          .filter((s) => s && s.title && !s.title.toLowerCase().includes("overview"))
          .sort((a, b) => {
            const getLevel = (t) =>
              /level\s*(\d+)/i.test(t) ? parseInt(t.match(/level\s*(\d+)/i)[1]) : 99;
            return getLevel(a.title) - getLevel(b.title);
          });

        setSections(ordered);
        setMinimumUoc(data?.minimum_uoc || null);
        setSpecialNotes(data?.special_notes || "");
        setHandbookUrl(data?.source_url || "");
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

  useEffect(() => {
    if (loading || programHasCourses || !degreeCode || !userId) {
      setMajor(null);
      return;
    }
    let active = true;
    fetchMajorSections(userId, degreeCode).then((found) => {
      if (active) setMajor(found);
    });
    return () => { active = false; };
  }, [loading, programHasCourses, degreeCode, userId]);

  useEffect(() => {
    if (!trackCompletion || !userId) return;
    fetchCompletedCourses(userId).then((rows) => {
      setCompleted(Object.fromEntries(rows.map((r) => [r.course_code, r])));
    });
  }, [trackCompletion, userId]);

  const toggleDone = async (course, category) => {
    if (!userId || pendingRef.current.has(course.code)) return;
    pendingRef.current.add(course.code);
    const existing = completed[course.code];
    const isCompleted = !existing?.is_completed;
    setCompleted((prev) => ({ ...prev, [course.code]: { ...existing, course_code: course.code, is_completed: isCompleted } }));
    try {
      const row = await setCourseCompleted({ userId, course, existing, isCompleted, category });
      setCompleted((prev) => ({ ...prev, [course.code]: row }));
    } catch (err) {
      console.error("Error saving course:", err);
      setCompleted((prev) => ({ ...prev, [course.code]: existing }));
    } finally {
      pendingRef.current.delete(course.code);
    }
  };

  const toggleSection = (key) => setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  
  const expandAll = () => {
    const newMap = {};
    courseSections.forEach((s, i) => {
      newMap[`${s.title}-${i}`] = true;
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

  // Format special notes with better structure
  function formatSpecialNotes(text = "") {
    if (!text) return "";

    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      return `<p class="text-sm leading-relaxed font-medium text-slate-900 dark:text-slate-100">${sentences[0] ?? ""}</p>`;
    }

    return `<ul class="space-y-1.5">${sentences.map(s =>
      `<li class="flex gap-2 text-sm leading-relaxed font-medium text-slate-900 dark:text-slate-100">
        <span class="text-amber-500 flex-shrink-0 mt-0.5">•</span>
        <span>${s}</span>
      </li>`
    ).join('')}</ul>`;
  }

  return (
    <div className="p-6 space-y-6">

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
            Open in CourseMesh
          </button>
        </div>
      </div>
    </div>

      {/* Controls & Info */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Info className="h-4 w-4 flex-shrink-0 text-blue-500" />
          <span>Click sections to expand courses · Click any course for details · Use <span className="text-blue-600 dark:text-blue-400 font-medium">Open in CourseMesh</span> to see how courses connect</span>
        </div>
        {hasExpandableSections && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={expandAll} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all">Expand All</button>
            <button onClick={collapseAll} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 transition-all">Collapse All</button>
          </div>
        )}
      </div>

      {/* PROGRAM SECTIONS */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 p-5 rounded-xl
                        bg-blue-50 dark:bg-blue-900/20
                        border-2 border-blue-300 dark:border-blue-700 shadow-sm">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Loading program structure...
            </span>
          </div>
        ) : err ? (
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-900/20 
                        border-2 border-red-300 dark:border-red-700 shadow-sm">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{err}</p>
          </div>
        ) : sections.length > 0 || major ? (
          <>
            {!programHasCourses && (major ? (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Showing the courses of your major: <span className="font-bold">{major.name}</span>
              </p>
            ) : (
              <NoCourseListNotice handbookUrl={handbookUrl || `${HANDBOOK_PROGRAM_URL}/${degreeCode}`} />
            ))}
            {courseSections.map((sec, i) => {
              const key = `${sec.title}-${i}`;
              return (
                <div key={key} ref={i === 0 ? firstExpandableSectionRef : null}>
                  <CourseSection
                    section={sec}
                    isOpen={!!openMap[key]}
                    onToggle={() => toggleSection(key)}
                    onCourseClick={handleCourseClick}
                    completed={completed}
                    onToggleDone={trackCompletion ? toggleDone : null}
                  />
                </div>
              );
            })}
            {sections.some(sec => !hasCourses(sec)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sections.map((sec, i) => {
                  if (hasCourses(sec)) return null;
                  return <InfoSection key={`${sec.title}-${i}`} section={sec} />;
                })}
              </div>
            )}
          </>
        ) : (
          <NoCourseListNotice handbookUrl={handbookUrl || `${HANDBOOK_PROGRAM_URL}/${degreeCode}`} />
        )}
      </div>

      {/* Special Notes - ORANGE/AMBER THEME FOR IMPORTANT INFO */}
      {specialNotes && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Important Information
          </h4>
          <div
            className="text-slate-800 dark:text-slate-200 space-y-2"
            dangerouslySetInnerHTML={{ __html: formatSpecialNotes(specialNotes) }}
          />
        </div>
      )}
    </div>
  );
}
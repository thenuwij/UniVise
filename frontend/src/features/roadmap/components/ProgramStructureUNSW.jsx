// src/pages/roadmap/ProgramStructureUNSW.jsx
import { ArrowRight, Check, ChevronDown, ChevronUp, Layers, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase";
import { UserAuth } from "@/app/AuthContext";
import { fetchCompletedCourses, setCourseCompleted } from "@/features/transfer/utils/completedCourses";
import { THIN_PROGRAM_COURSES, courseCodesOf, fetchAddedCourses, fetchChosenSpecialisations, hasCourses, parseSections, setCourseAdded } from "../utils/programCourses";
import { notNeededCodes, progressOf, requiredCount, splitCourses } from "../utils/myCourses";
import SectionHeading from "@/shared/ui/SectionHeading";
import { card } from "@/shared/ui/cardStyles";

function sumUoC(list = []) {
  return list.reduce((s, c) => s + (Number(c?.uoc) || 0), 0);
}

const HANDBOOK_PROGRAM_URL = "https://www.handbook.unsw.edu.au/undergraduate/programs/2026";

function ChooseSpecialisationCard({ handbookUrl, onChoose }) {
  return (
    <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 shadow-sm">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
        Most of this program's courses sit inside its majors or streams. Choose yours to see its courses here and in CourseMesh.
      </p>
      {onChoose && (
        <button
          onClick={onChoose}
          className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Choose your major or stream
        </button>
      )}
      <a
        href={handbookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-3 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline"
      >
        View the full structure in the official UNSW Handbook
      </a>
    </div>
  );
}

function TickStepCard({ ticked, total, uoc }) {
  const pct = total ? Math.round((ticked / total) * 100) : 0;
  return (
    <div className={`${card} p-5 md:p-6`}>
      <div className="flex items-center gap-3">
        <span className="h-8 w-8 flex-shrink-0 rounded-full inline-flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-blue-600 to-indigo-600">1</span>
        <p className="text-lg font-bold text-ink-strong">Tick the courses you've done</p>
      </div>
      <p className="mt-2 text-[15px] text-ink-muted">Open each part below and press <span className="font-semibold text-ink">Done</span> on every course you've completed.</p>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="text-[15px] text-ink">
          <span className="text-xl font-bold text-ink-strong">{ticked}</span> of {total} courses in your plan ticked
        </p>
        <p className="text-sm font-semibold text-ink-muted">{uoc} UOC</p>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CourseMeshStepCard({ ticked, onOpen, disabled }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 dark:from-blue-950/60 dark:via-slate-900 dark:to-indigo-950/60 p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span className="h-8 w-8 flex-shrink-0 rounded-full inline-flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-blue-600 to-indigo-600">2</span>
        <p className="text-lg font-bold text-ink-strong">See what you can take next</p>
      </div>
      <p className="mt-2 text-[15px] text-ink-muted">
        {ticked > 0
          ? `You've ticked ${ticked} ${ticked === 1 ? "course" : "courses"}. CourseMesh shows what they unlock and how your courses connect.`
          : "Once you've ticked your courses, CourseMesh shows what they unlock and how your courses connect."}
      </p>
      <button
        onClick={onOpen}
        disabled={disabled}
        className="mt-4 group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
      >
        <Layers className="h-4 w-4" />
        Open CourseMesh
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
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

function AddToggle({ added, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-pressed={added}
      className={`ml-2 flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border-2 transition-all ${
        added
          ? "bg-blue-600 border-blue-600 text-white"
          : "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:border-blue-500"
      }`}
    >
      {added ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={3} />}
      {added ? "Added" : "Add"}
    </button>
  );
}

function CourseSection({ section, isOpen, onToggle, onCourseClick, completed, onToggleDone, options, added, notNeeded, onToggleAdded }) {
  const total = section.uoc ?? sumUoC(section.courses);
  const count = section.courses?.length || 0;

  return (
    <div className={`${card} overflow-hidden`}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-blue-50/60 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{section.title}</h3>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="px-3 py-1 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800">
            {count} {count === 1 ? "course" : "courses"} · {total} UOC
          </span>
          {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400 group-hover:text-blue-600" /> : <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />}
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 pb-6 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {section.courses?.map((c, i) => (
              <div
                key={c.code || i}
                onClick={() => onCourseClick?.(c)}
                className={`group flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer ${notNeeded?.has(c.code) ? "opacity-60 " : ""}bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-md transition-all`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[15px] font-bold text-blue-700 dark:text-blue-300">
                    {c.code}
                    {notNeeded?.has(c.code) && <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Not needed</span>}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1">{c.name}</span>
                </div>
                {c.uoc != null && c.uoc !== "" && (
                  <span className="ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    {c.uoc} UOC
                  </span>
                )}
                {onToggleAdded && options?.has(c.code) && !completed?.[c.code]?.is_completed && (
                  <AddToggle added={added.has(c.code)} onClick={() => onToggleAdded(c)} />
                )}
                {onToggleDone && (
                  <DoneToggle done={!!completed?.[c.code]?.is_completed} onClick={() => onToggleDone(c, section.title)} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main 
export default function ProgramStructureUNSW({ degreeCode, sections: propSections, trackCompletion = false, onChangeSpecialisation }) {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [completed, setCompleted] = useState({});
  const pendingRef = useRef(new Set());
  const [sections, setSections] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [handbookUrl, setHandbookUrl] = useState("");
  
  const [specs, setSpecs] = useState(null);
  

  const programCourseSections = useMemo(() => sections.filter(hasCourses), [sections]);

  const courseSections = useMemo(
    () => [
      ...programCourseSections,
      ...(specs || []).flatMap((spec) => spec.sections.map((sec) => ({ ...sec, title: `${spec.name}: ${sec.title}` }))),
    ],
    [programCourseSections, specs]
  );

  const allCourses = useMemo(() => courseCodesOf(courseSections), [courseSections]);
  const [added, setAdded] = useState(new Set());

  const mine = useMemo(
    () => splitCourses([{ key: degreeCode, sections: programCourseSections }, ...(specs || []).map((spec) => ({ key: spec.id, sections: spec.sections }))]),
    [degreeCode, programCourseSections, specs]
  );
  const options = useMemo(() => new Map(mine.options.map((o) => [o.code, o])), [mine]);
  const notNeeded = useMemo(() => {
    const done = new Set(Object.values(completed).filter((r) => r?.is_completed).map((r) => r.course_code));
    return notNeededCodes(mine, done, added);
  }, [mine, completed, added]);

  const tickedStats = useMemo(() => {
    const seen = new Map();
    for (const sec of courseSections) for (const c of sec.courses || []) if (c?.code && !seen.has(c.code)) seen.set(c.code, c);
    const doneCodes = new Set(Object.values(completed).filter((r) => r?.is_completed).map((r) => r.course_code));
    const { done, total } = progressOf(mine, doneCodes, added);
    const uoc = [...seen.values()].filter((c) => doneCodes.has(c.code)).reduce((sum, c) => sum + (Number(c.uoc) || 0), 0);
    return { ticked: done, total, uoc };
  }, [courseSections, completed, mine, added]);

  const thin = specs?.length === 0 && requiredCount(splitCourses([{ key: degreeCode, sections: programCourseSections }])) <= THIN_PROGRAM_COURSES;

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
          .select("sections, source_url")
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
    let active = true;
    setSpecs(null);
    fetchChosenSpecialisations(degreeCode, userId).then((found) => {
      if (active) setSpecs(found);
    });
    return () => { active = false; };
  }, [degreeCode, userId]);

  useEffect(() => {
    if (!trackCompletion || !userId) return;
    fetchCompletedCourses(userId).then((rows) => {
      setCompleted(Object.fromEntries(rows.map((r) => [r.course_code, r])));
    });
    fetchAddedCourses(userId).then(setAdded);
  }, [trackCompletion, userId]);

  const toggleAdded = async (course) => {
    if (!userId || pendingRef.current.has(course.code)) return;
    pendingRef.current.add(course.code);
    const isAdded = !added.has(course.code);
    const update = (on) => setAdded((prev) => {
      const next = new Set(prev);
      if (on) next.add(course.code);
      else next.delete(course.code);
      return next;
    });
    update(isAdded);
    try {
      await setCourseAdded({ userId, course, section: options.get(course.code)?.section, added: isAdded });
    } catch (err) {
      console.error("Error saving elective:", err);
      update(!isAdded);
    } finally {
      pendingRef.current.delete(course.code);
    }
  };

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

  const expandAll = () =>
    setOpenMap(Object.fromEntries(courseSections.map((s, i) => [`${s.title}-${i}`, true])));

  const collapseAll = () =>
    setOpenMap(Object.fromEntries(courseSections.map((s, i) => [`${s.title}-${i}`, false])));
  

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

      <SectionHeading subtitle={trackCompletion ? null : "The courses in this program."}>
        Your courses
      </SectionHeading>

      {trackCompletion ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TickStepCard {...tickedStats} />
          <CourseMeshStepCard ticked={tickedStats.ticked} onOpen={handleVisualise} disabled={!allCourses.length} />
        </div>
      ) : (
        <button
          onClick={handleVisualise}
          disabled={!allCourses.length}
          className="group inline-flex items-center gap-2 text-[15px] font-semibold text-link hover:underline disabled:opacity-50 disabled:no-underline"
        >
          <Layers className="h-4 w-4" />
          See how these courses connect in CourseMesh
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        {specs ? (
          <p className="text-[15px] text-ink-muted">
            {specs.length ? <>Showing courses for <span className="font-semibold text-ink-strong">{specs.map((sp) => sp.name).join(", ")}</span></> : "No specialisation chosen yet"}
            {onChangeSpecialisation && (
              <button onClick={onChangeSpecialisation} className="ml-2 font-semibold text-link hover:underline">
                {specs.length ? "Change" : "Choose one"}
              </button>
            )}
          </p>
        ) : <span />}
        {courseSections.length > 0 && (
          <div className="flex gap-2">
            <button onClick={expandAll} className="px-3 py-1 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
              Expand all
            </button>
            <button onClick={collapseAll} className="px-3 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Collapse all
            </button>
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
        ) : (
          <>
            {thin && (
              <ChooseSpecialisationCard
                handbookUrl={handbookUrl || `${HANDBOOK_PROGRAM_URL}/${degreeCode}`}
                onChoose={onChangeSpecialisation}
              />
            )}
            {courseSections.map((sec, i) => {
              const key = `${sec.title}-${i}`;
              return (
                <div key={key}>
                  <CourseSection
                    section={sec}
                    isOpen={openMap[key] ?? i === 0}
                    onToggle={() => toggleSection(key)}
                    onCourseClick={handleCourseClick}
                    completed={completed}
                    onToggleDone={trackCompletion ? toggleDone : null}
                    options={options}
                    added={added}
                    notNeeded={notNeeded}
                    onToggleAdded={trackCompletion ? toggleAdded : null}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {trackCompletion && !loading && courseSections.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 px-6 py-5">
          <p className="text-[15px] text-ink">
            <span className="font-semibold text-ink-strong">Finished ticking?</span> See what your courses unlock next.
          </p>
          <button
            onClick={handleVisualise}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <Layers className="h-4 w-4" />
            Open CourseMesh
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}

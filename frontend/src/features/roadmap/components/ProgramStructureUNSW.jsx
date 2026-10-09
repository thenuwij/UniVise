// src/pages/roadmap/ProgramStructureUNSW.jsx
import { ArrowRight, Check, HelpCircle, Layers, Plus, Sparkles } from "lucide-react";
import ExpandIcon from "@/shared/ui/ExpandIcon";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import SpotlightGuide from "@/shared/ui/SpotlightGuide";
import { hasSeenGuide } from "@/shared/lib/guideSeen";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase";
import { UserAuth } from "@/app/AuthContext";
import { fetchCompletedCourses, setCourseCompleted } from "@/features/transfer/utils/completedCourses";
import { THIN_PROGRAM_COURSES, courseCodesOf, fetchAddedRows, fetchChosenSpecialisations, hasCourses, parseSections, setCourseAdded } from "../utils/programCourses";
import { ADDED_SECTION, notNeededCodes, openRequirementParts, orderSections, progressOf, requiredCount, sectionProgress, splitCourses, withAddedCourses } from "../utils/myCourses";
import ElectivesPanel from "@/features/mindmesh/components/ElectivesPanel";
import SectionHeading from "@/shared/ui/SectionHeading";
import { card } from "@/shared/ui/cardStyles";

function sumUoC(list = []) {
  return list.reduce((s, c) => s + (Number(c?.uoc) || 0), 0);
}

const GUIDE_KEY = "univise-courses-guide-seen";

const GUIDE_STEPS = [
  {
    targets: ['[data-tour="course-tick"][aria-checked="false"]', '[data-tour="course-tick"]'],
    title: "Tick what you've done",
    text: "Tick the box next to each course you've finished. Each part shows how much is left.",
  },
  {
    targets: ['[data-tour="coursemesh-strip"]'],
    title: "See what's next",
    text: "CourseMesh shows what your ticked courses unlock and which ones you can take next.",
  },
];

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

function ProgressStrip({ ticked, total, uoc, minimum, onOpen, disabled }) {
  const pct = minimum ? Math.min(100, Math.round((uoc / minimum) * 100)) : total ? Math.round((ticked / total) * 100) : 0;
  return (
    <div className="rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          {minimum ? (
            <p className="text-[15px] text-ink">
              <span className="text-xl font-bold text-ink-strong">{uoc}</span> of {minimum} UOC completed
              <span className="text-ink-muted"> · {ticked} of {total} listed courses ticked</span>
            </p>
          ) : (
            <p className="text-[15px] text-ink">
              <span className="text-xl font-bold text-ink-strong">{ticked}</span> of {total} courses ticked
              <span className="text-ink-muted"> · {uoc} UOC</span>
            </p>
          )}
          <p className="hidden sm:block text-sm text-ink-muted">Tick the box on each course you've done</p>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button
        onClick={onOpen}
        disabled={disabled}
        data-tour="coursemesh-strip"
        className="group flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold text-blue-900 dark:text-blue-100 bg-blue-200 dark:bg-blue-900/70 border-2 border-blue-400 dark:border-blue-600 shadow-sm hover:bg-blue-300 hover:border-blue-500 dark:hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Layers className="h-4 w-4" />
        See what's next in CourseMesh
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

// Expandable Section Card with courses 
function DoneCheck({ done, code, onClick, tour }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      role="checkbox"
      aria-checked={done}
      aria-label={`${code} done`}
      data-tour={tour ? "course-tick" : undefined}
      className="-m-1.5 mr-1.5 p-1.5 flex-shrink-0 rounded-lg"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
          done
            ? "bg-green-500 border-green-500 text-white"
            : "bg-white dark:bg-slate-900 border-slate-400 dark:border-slate-500 text-transparent hover:border-green-500"
        }`}
      >
        <Check className="h-4 w-4" strokeWidth={3.5} />
      </span>
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

function SectionProgress({ progress }) {
  const { done, total, unit } = progress;
  if (total > 0 && done >= total) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40">
        <Check className="h-4 w-4" strokeWidth={3} />
        All done
      </span>
    );
  }
  return (
    <span className="flex w-32 flex-col items-end gap-1.5">
      <span className={`text-sm font-semibold ${total ? "text-ink-strong" : "text-ink-muted"}`}>
        {unit ? `${done} of ${total} ${unit}` : total ? `${done} of ${total} done` : "None picked yet"}
      </span>
      <span className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <span className="block h-full rounded-full bg-green-500" style={{ width: `${total ? Math.min(100, (done / total) * 100) : 0}%` }} />
      </span>
    </span>
  );
}

function CourseSection({ section, isOpen, onToggle, onCourseClick, completed, progress, onToggleDone, options, added, notNeeded, onToggleAdded, onAdd }) {
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
          {progress && (
            <p className="mt-0.5 text-sm text-ink-muted">
              {count} {count === 1 ? "course" : "courses"} · {total} UOC
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {progress ? (
            <SectionProgress progress={progress} />
          ) : (
            <span className="px-3 py-1 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800">
              {count} {count === 1 ? "course" : "courses"} · {total} UOC
            </span>
          )}
          <ExpandIcon open={isOpen} />
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
                {onToggleDone && (
                  <DoneCheck done={!!completed?.[c.code]?.is_completed} code={c.code} tour={isOpen} onClick={() => onToggleDone(c, section.title)} />
                )}
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
                {onToggleAdded && options?.has(c.code) && (section.open || !completed?.[c.code]?.is_completed) && (
                  <AddToggle added={added.has(c.code)} onClick={() => onToggleAdded(c)} />
                )}
              </div>
            ))}
          </div>
          {section.open && count === 0 && (
            <p className="mt-4 text-sm text-ink-muted">No courses here yet. Add the courses you've taken or plan to take for {section.title}.</p>
          )}
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-blue-900 dark:text-blue-100 bg-blue-200 dark:bg-blue-900/70 border-2 border-blue-400 dark:border-blue-600 hover:bg-blue-300 hover:border-blue-500 dark:hover:bg-blue-900 transition-colors"
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
              Add a course to {section.title}
            </button>
          )}
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
    () =>
      orderSections([
        ...programCourseSections,
        ...(specs || []).flatMap((spec) => spec.sections.map((sec) => ({ ...sec, title: `${spec.name}: ${sec.title}` }))),
      ]),
    [programCourseSections, specs]
  );

  const allCourses = useMemo(() => courseCodesOf(courseSections), [courseSections]);
  const [addedRows, setAddedRows] = useState([]);
  const [minimumUoc, setMinimumUoc] = useState(null);
  const [ticksLoaded, setTicksLoaded] = useState(false);
  const [firstOpen, setFirstOpen] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [addTarget, setAddTarget] = useState(null);
  const added = useMemo(() => new Set(addedRows.map((r) => r.code)), [addedRows]);

  const mine = useMemo(
    () => withAddedCourses(splitCourses([{ key: degreeCode, sections: programCourseSections }, ...(specs || []).map((spec) => ({ key: spec.id, sections: spec.sections }))]), addedRows),
    [degreeCode, programCourseSections, specs, addedRows]
  );
  const openParts = useMemo(() => openRequirementParts(sections), [sections]);
  const listedCodes = useMemo(() => new Set(allCourses), [allCourses]);

  const shownSections = useMemo(() => {
    if (!trackCompletion) return courseSections;
    const open = openParts.filter((p) => !p.optional);
    const titles = open.map((p) => p.title);
    const placeOf = (section) => (titles.includes(section) ? section : titles[0]);
    const extras = mine.options.filter((o) => !listedCodes.has(o.code));
    return [
      ...courseSections,
      ...open.map((p) => ({ title: p.title, uoc: p.uoc, open: true, courses: extras.filter((e) => placeOf(e.section) === p.title) })),
    ];
  }, [courseSections, mine, trackCompletion, openParts, listedCodes]);
  const doneSet = useMemo(() => new Set(Object.values(completed).filter((r) => r?.is_completed).map((r) => r.course_code)), [completed]);
  const options = useMemo(() => new Map(mine.options.map((o) => [o.code, o])), [mine]);
  const notNeeded = useMemo(() => {
    const done = new Set(Object.values(completed).filter((r) => r?.is_completed).map((r) => r.course_code));
    return notNeededCodes(mine, done, added);
  }, [mine, completed, added]);

  const tickedStats = useMemo(() => {
    const doneRows = Object.values(completed).filter((r) => r?.is_completed);
    const { done, total } = progressOf(mine, new Set(doneRows.map((r) => r.course_code)), added);
    const uoc = doneRows.reduce((sum, r) => sum + (Number(r.uoc) || 0), 0);
    return { ticked: done, total, uoc, minimum: minimumUoc };
  }, [completed, mine, added, minimumUoc]);

  const sectionProgresses = useMemo(
    () =>
      trackCompletion
        ? shownSections.map((sec) =>
            sec.open
              ? { done: sec.courses.filter((c) => doneSet.has(c.code)).reduce((sum, c) => sum + (Number(c.uoc) || 0), 0), total: sec.uoc, unit: "UOC" }
              : sectionProgress(sec, doneSet, added)
          )
        : null,
    [trackCompletion, shownSections, doneSet, added]
  );

  useEffect(() => {
    if (firstOpen !== null || specs === null || !shownSections.length) return;
    if (trackCompletion && userId && !ticksLoaded) return;
    const index = sectionProgresses ? sectionProgresses.findIndex((p) => p.total > 0 && p.done < p.total) : 0;
    setFirstOpen(index === -1 ? 0 : index);
  }, [firstOpen, specs, shownSections, trackCompletion, userId, ticksLoaded, sectionProgresses]);

  useEffect(() => {
    if (!trackCompletion || firstOpen === null || hasSeenGuide(GUIDE_KEY)) return;
    const timer = setTimeout(() => setShowGuide(true), 700);
    return () => clearTimeout(timer);
  }, [trackCompletion, firstOpen]);

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

        setSections(parsed.filter((s) => s && s.title && !s.title.toLowerCase().includes("overview")));
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
    if (!degreeCode) return;
    let active = true;
    supabase
      .from("unsw_degrees_final")
      .select("minimum_uoc")
      .eq("degree_code", degreeCode)
      .maybeSingle()
      .then(({ data }) => active && setMinimumUoc(Number(data?.minimum_uoc) || null));
    return () => { active = false; };
  }, [degreeCode]);

  useEffect(() => {
    let active = true;
    setSpecs(null);
    setFirstOpen(null);
    fetchChosenSpecialisations(degreeCode, userId).then((found) => {
      if (active) setSpecs(found);
    });
    return () => { active = false; };
  }, [degreeCode, userId]);

  useEffect(() => {
    if (!trackCompletion || !userId) return;
    fetchCompletedCourses(userId).then((rows) => {
      setCompleted(Object.fromEntries(rows.map((r) => [r.course_code, r])));
      setTicksLoaded(true);
    });
    fetchAddedRows(userId).then(setAddedRows);
  }, [trackCompletion, userId]);

  const toggleAdded = async (course) => {
    if (!userId || pendingRef.current.has(course.code)) return;
    pendingRef.current.add(course.code);
    const isAdded = !added.has(course.code);
    const section = options.get(course.code)?.section || course.section;
    const row = { code: course.code, name: course.name, uoc: course.uoc, section };
    const update = (on) => setAddedRows((prev) => (on ? [...prev.filter((r) => r.code !== row.code), row] : prev.filter((r) => r.code !== row.code)));
    update(isAdded);
    try {
      await setCourseAdded({ userId, course, section, added: isAdded });
    } catch (err) {
      console.error("Error saving elective:", err);
      update(!isAdded);
    } finally {
      pendingRef.current.delete(course.code);
    }
  };

  const toggleInSection = async (course, target) => {
    if (!userId || !target || pendingRef.current.has(course.code)) return;
    pendingRef.current.add(course.code);
    const previous = addedRows;
    const inTarget = shownSections.some((s) => s.title === target && s.courses.some((c) => c.code === course.code));
    const row = { code: course.code, name: course.name, uoc: course.uoc, section: target };
    setAddedRows((prev) => (inTarget ? prev.filter((r) => r.code !== course.code) : [...prev.filter((r) => r.code !== course.code), row]));
    try {
      await setCourseAdded({ userId, course: row, section: target, added: !inTarget });
    } catch (err) {
      console.error("Error saving course:", err);
      setAddedRows(previous);
    } finally {
      pendingRef.current.delete(course.code);
    }
  };

  const doneOutsideLists = useMemo(
    () =>
      Object.values(completed)
        .filter((r) => r?.is_completed && !listedCodes.has(r.course_code) && !added.has(r.course_code))
        .map((r) => ({ code: r.course_code, name: r.course_name, uoc: r.uoc, section: ADDED_SECTION })),
    [completed, listedCodes, added]
  );

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

  const allOpen = shownSections.length > 0 && shownSections.every((s, i) => openMap[`${s.title}-${i}`] ?? i === firstOpen);

  const setAllOpen = (open) =>
    setOpenMap(Object.fromEntries(shownSections.map((s, i) => [`${s.title}-${i}`, open])));
  

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
        <span className="inline-flex flex-wrap items-center gap-3">
          Your courses
          {trackCompletion && (
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/60 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-200 hover:border-blue-400 dark:hover:bg-blue-900 transition-colors"
            >
              <HelpCircle className="h-4 w-4" strokeWidth={2.5} />
              How it works
            </button>
          )}
        </span>
      </SectionHeading>

      {trackCompletion ? (
        <ProgressStrip {...tickedStats} onOpen={handleVisualise} disabled={!allCourses.length} />
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
          <div className="flex flex-wrap items-center gap-2">
            <ExpandToggle open={allOpen} onClick={() => setAllOpen(!allOpen)}>
              {allOpen ? "Collapse all" : "Expand all"}
            </ExpandToggle>
          </div>
        )}
      </div>

      {showGuide && <SpotlightGuide steps={GUIDE_STEPS} seenKey={GUIDE_KEY} onClose={() => setShowGuide(false)} />}

      {addTarget && (
        <ElectivesPanel
          target={addTarget}
          options={shownSections.filter((s) => s.open).flatMap((s) => s.courses.map((c) => ({ ...c, section: s.title })))}
          added={added}
          completed={doneSet}
          suggestions={doneOutsideLists}
          programCodes={listedCodes}
          saving={false}
          onToggle={(option) => toggleInSection(option, addTarget)}
          onShow={(code) => navigate(`/coursemesh?focus=${encodeURIComponent(code)}`)}
          onClose={() => setAddTarget(null)}
        />
      )}

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
            {shownSections.map((sec, i) => {
              const key = `${sec.title}-${i}`;
              return (
                <div key={key}>
                  <CourseSection
                    section={sec}
                    isOpen={openMap[key] ?? i === firstOpen}
                    onToggle={() => toggleSection(key)}
                    onCourseClick={handleCourseClick}
                    completed={completed}
                    progress={sectionProgresses?.[i]}
                    onToggleDone={trackCompletion ? toggleDone : null}
                    options={options}
                    added={added}
                    notNeeded={notNeeded}
                    onToggleAdded={trackCompletion ? (sec.open ? (c) => toggleInSection(c, sec.title) : toggleAdded) : null}
                    onAdd={trackCompletion && sec.open ? () => setAddTarget(sec.title) : null}
                  />
                </div>
              );
            })}
            {trackCompletion && openParts.some((p) => p.optional) && (
              <div className="pt-2">
                <p className="text-sm font-semibold text-ink-muted">Also part of your program</p>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {openParts.filter((p) => p.optional).map((part) => (
                    <div key={part.title} className="rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-base font-semibold text-ink-strong">{part.title}</p>
                        <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900">
                          {part.uoc} UOC
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">{part.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {trackCompletion && !loading && courseSections.length > 0 && (
        <div className="rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <p className="text-[15px] text-ink">
            <span className="font-semibold text-ink-strong">Finished ticking?</span> See what your courses unlock next.
          </p>
          <button
            onClick={handleVisualise}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-bold text-blue-900 dark:text-blue-100 bg-blue-200 dark:bg-blue-900/70 border-2 border-blue-400 dark:border-blue-600 shadow-sm hover:bg-blue-300 hover:border-blue-500 dark:hover:bg-blue-900 transition-colors"
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

import { handbookUrl, openHandbook } from "@/shared/lib/handbook";
import { ArrowRight, HelpCircle, Layers, Plus, Sparkles } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import SpotlightGuide from "@/shared/ui/SpotlightGuide";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchDegree } from "../api";
import { UserAuth } from "@/app/AuthContext";
import { fetchCompletedCourses, setCourseCompleted } from "../utils/completedCourses";
import { THIN_PROGRAM_COURSES, courseCodesOf, fetchAddedRows, fetchChosenMinorId, fetchChosenSpecialisations, fetchMinorOptions, fetchSpecialisationOptions, parseSections, saveMinor, setCourseAdded, withCourseUoc } from "../utils/programCourses";
import { ADDED_SECTION, sectionRules, showsOnCourses, tidySections, notNeededCodes, openRequirementParts, orderSections, progressOf, requiredCount, sectionProgress, splitCourses, withAddedCourses } from "../utils/myCourses";
import ElectivesPanel from "../coursemesh/components/ElectivesPanel";
import SectionHeading from "@/shared/ui/SectionHeading";
import { ChooseSpecialisationNotice, CourseSection, GroupHeader, MinorControls, ProgressStrip, RuleLine, UnlistedLine } from "./CourseChecklistParts";
import { courseChecklistHeading, placeCourseRules } from "../utils/courseChecklist";
import "../courseChecklist.css";

const GUIDE_KEY = "univise-courses-guide-seen";

const GUIDE_STEPS = [
  {
    targets: ['[data-tour="course-tick"][aria-checked="false"]', '[data-tour="course-tick"]'],
    title: "Tick what you've done",
    text: "Tick each course you've finished. Each part shows what's left.",
  },
  {
    targets: ['[data-tour="coursemesh-strip"]'],
    title: "See how they connect",
    text: "Open CourseMesh to see what your ticked courses unlock.",
  },
];


// Main 
export default function MyCoursesTab({ degreeCode, sections: propSections, trackCompletion = false, onChangeSpecialisation, onOpenCourseMesh }) {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [completed, setCompleted] = useState({});
  const pendingRef = useRef(new Set());
  const [sections, setSections] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  
  const [specs, setSpecs] = useState(null);
  

  const programCourseSections = useMemo(() => tidySections(sections).filter(showsOnCourses), [sections]);

  const courseSections = useMemo(
    () => orderSections([...programCourseSections, ...(specs || []).flatMap((spec) => spec.sections)]),
    [programCourseSections, specs]
  );

  const allCourses = useMemo(() => courseCodesOf(courseSections), [courseSections]);
  const [addedRows, setAddedRows] = useState([]);
  const [minimumUoc, setMinimumUoc] = useState(null);
  const [programName, setProgramName] = useState("");
  const [minorOptions, setMinorOptions] = useState([]);
  const [hasMajors, setHasMajors] = useState(true);
  const [minorId, setMinorId] = useState(null);
  const [savingMinor, setSavingMinor] = useState(false);
  const [specsVersion, setSpecsVersion] = useState(0);
  const [ticksLoaded, setTicksLoaded] = useState(false);
  const [firstOpen, setFirstOpen] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showMinorControls, setShowMinorControls] = useState(null);
  const [addTarget, setAddTarget] = useState(null);
  const added = useMemo(() => new Set(addedRows.map((r) => r.code)), [addedRows]);

  const mine = useMemo(
    () => withAddedCourses(splitCourses([{ key: degreeCode, sections: programCourseSections }, ...(specs || []).map((spec) => ({ key: spec.id, sections: spec.sections }))]), addedRows),
    [degreeCode, programCourseSections, specs, addedRows]
  );
  const openParts = useMemo(() => openRequirementParts(sections), [sections]);
  const listedCodes = useMemo(() => new Set(allCourses), [allCourses]);

  const groups = useMemo(() => {
    const sorted = [...(specs || [])].sort((a, b) => (a.type === "Minor") - (b.type === "Minor"));
    const list = [
      ...sorted.map((spec) => ({ key: spec.id, name: spec.name, type: spec.type, uoc: spec.uoc, raw: spec.sections, prefix: spec.name })),
      { key: "program", name: programName, type: "Program", uoc: minimumUoc, raw: programCourseSections, prefix: null },
    ];
    const built = list.map((g) => {
      const ordered = orderSections(g.raw);
      return {
        ...g,
        rules: ordered.filter((sec) => sec.kind === "limit"),
        unlisted: ordered.filter((sec) => sec.kind === "unlisted"),
        sections: ordered
          .filter((sec) => sec.kind !== "limit" && sec.kind !== "unlisted")
          .map((sec) => ({ ...sec, place: g.prefix ? `${g.prefix}: ${sec.title}` : sec.title, elective: sec.kind === "elective" })),
      };
    });
    const program = built[built.length - 1];
    const unlistedProgram = !hasMajors && !programCourseSections.length;
    const disciplinary = unlistedProgram
      ? sections
          .filter((sec) => sec.kind === "info" && Number(sec.uoc) > 0 && !sec.courses?.length)
          .map((sec) => ({ title: sec.title, uoc: Number(sec.uoc), note: "Courses that count towards this part of the program" }))
      : [];
    for (const part of [...disciplinary, ...openParts.filter((p) => !p.optional)]) {
      program.sections.push({ title: part.title, uoc: part.uoc, note: part.note, open: true, place: part.title, courses: [] });
    }
    if (trackCompletion) {
      const targets = built.flatMap((g) => g.sections.filter((sec) => sec.open || sec.elective));
      const fallback = targets.find((sec) => sec.open);
      for (const extra of mine.options.filter((o) => !listedCodes.has(o.code))) {
        const target = targets.find((sec) => sec.place === extra.section) || fallback;
        if (target) target.courses = [...(target.courses || []), { ...extra, extra: true }];
      }
    }
    return built.filter((g) => g.sections.length || g.rules.length || g.unlisted.length);
  }, [specs, programName, minimumUoc, programCourseSections, trackCompletion, openParts, mine, listedCodes, hasMajors, sections]);

  const shownSections = useMemo(() => groups.flatMap((g) => g.sections), [groups]);
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
            sec.open || (sec.elective && Number(sec.uoc) > 0)
              ? { done: sec.courses.filter((c) => doneSet.has(c.code)).reduce((sum, c) => sum + (Number(c.uoc) || 0), 0), total: Number(sec.uoc), unit: "UOC" }
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

  const openGuideRef = useRef(null);
  openGuideRef.current = () => {
    const unfinished = shownSections.findIndex((sec, i) => !sec.open && sectionProgresses?.[i]?.total > 0 && sectionProgresses[i].done < sectionProgresses[i].total);
    const index = unfinished !== -1 ? unfinished : shownSections.findIndex((sec) => !sec.open && sec.courses?.length);
    if (index !== -1) setOpenMap((prev) => ({ ...prev, [`${shownSections[index].title}-${index}`]: true }));
    setShowGuide(true);
  };
  const openGuide = () => openGuideRef.current?.();


  const thin = specs?.length === 0 && requiredCount(splitCourses([{ key: degreeCode, sections: programCourseSections }])) <= THIN_PROGRAM_COURSES;

  const handleVisualise = () => {
    if (!degreeCode || !allCourses.length) return;
    onOpenCourseMesh?.();
  };

  // Fetch program structure
  useEffect(() => {
    const fetchStructure = async () => {
      if (propSections?.length > 0) {
        const filtered = propSections.filter(
          (s) => !s?.title?.toLowerCase()?.includes("overview")
        );
        const [filled] = await withCourseUoc([filtered]);
        setSections(filled);
        setOpenMap({});
        return;
      }

      if (!degreeCode) return;

      try {
        setLoading(true);

        const { data, error } = await fetchDegree(degreeCode, "sections, source_url");

        if (error) throw error;

        const parsed = parseSections(data?.sections);

        const [filled] = await withCourseUoc([parsed.filter((s) => s && s.title && !s.title.toLowerCase().includes("overview"))]);
        setSections(filled);
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
    fetchDegree(degreeCode, "minimum_uoc, program_name")
      .then(({ data }) => {
        if (!active) return;
        setMinimumUoc(Number(data?.minimum_uoc) || null);
        setProgramName(data?.program_name || "");
      });
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
  }, [degreeCode, userId, specsVersion]);

  useEffect(() => {
    if (!degreeCode) return;
    let active = true;
    fetchSpecialisationOptions(degreeCode).then((groups) => active && setHasMajors(groups.length > 0));
    return () => { active = false; };
  }, [degreeCode]);

  useEffect(() => {
    if (!trackCompletion || !degreeCode || !userId) return;
    let active = true;
    Promise.all([fetchMinorOptions(degreeCode), fetchChosenMinorId(degreeCode, userId)]).then(([found, chosen]) => {
      if (!active) return;
      setMinorOptions(found);
      setMinorId(chosen);
    });
    return () => { active = false; };
  }, [trackCompletion, degreeCode, userId]);

  const chooseMinor = async (id) => {
    if (!userId) return;
    setSavingMinor(true);
    try {
      await saveMinor(userId, degreeCode, id);
      setMinorId(id || null);
      setSpecsVersion((v) => v + 1);
    } catch (err) {
      console.error("Error saving minor:", err);
    } finally {
      setSavingMinor(false);
    }
  };

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
    const inTarget = shownSections.some((sec) => sec.place === target && sec.courses.some((c) => c.code === course.code && c.extra));
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

  const addSection = shownSections.find((sec) => sec.place === addTarget) || null;
  const listedIn = useMemo(
    () => new Map(shownSections.flatMap((sec) => (sec.courses || []).filter((c) => !c.extra).map((c) => [c.code, sec.place])).reverse()),
    [shownSections]
  );
  const hasMinorGroup = groups.some((g) => g.type === "Minor");
  const optionalMinorUoc = openParts.find((p) => p.optional)?.uoc || null;
  const canChooseMinor = trackCompletion && (hasMinorGroup || minorOptions.length > 0 || optionalMinorUoc);
  const minorControlsOpen = showMinorControls ?? (hasMinorGroup || Boolean(minorId));
  const heading = courseChecklistHeading(specs, programName, minimumUoc);

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

  const toggleSection = (key, initiallyOpen) => setOpenMap((prev) => ({ ...prev, [key]: !(prev[key] ?? initiallyOpen) }));

  const allOpen = shownSections.length > 0 && shownSections.every((s, i) => openMap[`${s.title}-${i}`] ?? i === firstOpen);

  const setAllOpen = (open) =>
    setOpenMap(Object.fromEntries(shownSections.map((s, i) => [`${s.title}-${i}`, open])));
  

  const handleCourseClick = (course) => {
    if (course?.code) openHandbook("courses", course.code);
  };


  return (
    <div className="course-checklist space-y-6">

      <SectionHeading
        subtitle={trackCompletion ? null : "The courses in this program."}
        action={
          courseSections.length > 0 ? (
            <ExpandToggle plain open={allOpen} onClick={() => setAllOpen(!allOpen)}>
              {allOpen ? "Collapse all" : "Expand all"}
            </ExpandToggle>
          ) : null
        }
      >
        <span className="inline-flex flex-wrap items-center gap-3">
          Your courses
          {trackCompletion && (
            <button
              type="button"
              onClick={() => openGuide()}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-link ring-1 ring-line hover:bg-surface-tint"
              aria-label="How ticking courses works"
              title="How it works"
            >
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
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

      {showGuide && <SpotlightGuide steps={GUIDE_STEPS} seenKey={GUIDE_KEY} onClose={() => setShowGuide(false)} />}

      {addSection && (
        <ElectivesPanel
          target={addSection.place}
          targetTitle={addSection.title}
          groupName={groups.find((g) => g.sections.includes(addSection))?.name}
          listedOptions={addSection.elective ? addSection.courses.filter((c) => !c.extra) : []}
          options={addSection.courses.filter((c) => c.extra).map((c) => ({ ...c, section: addSection.place }))}
          rule={addSection.elective ? { text: addSection.description, patterns: sectionRules(addSection) } : null}
          listedIn={listedIn}
          added={added}
          completed={doneSet}
          suggestions={doneOutsideLists}
          saving={false}
          onToggle={(option) =>
            addSection.courses.some((c) => !c.extra && c.code === option.code) ? toggleAdded(option) : toggleInSection(option, addSection.place)
          }
          onShow={(code) => onOpenCourseMesh?.(code)}
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
            <GroupHeader
              group={heading}
              action={
                <div className="course-checklist-manage">
                  {hasMajors && onChangeSpecialisation && (
                    <button type="button" onClick={onChangeSpecialisation} className="course-checklist-link">
                      {specs?.some((spec) => spec.type !== "Minor") ? "Change" : "Choose a specialisation"}
                    </button>
                  )}
                  {canChooseMinor && (
                    <button type="button" className="course-checklist-link" aria-expanded={minorControlsOpen} aria-controls="course-checklist-minor-controls" onClick={() => setShowMinorControls(!minorControlsOpen)}>
                      <Plus aria-hidden="true" className="h-4 w-4" />Optional minor
                    </button>
                  )}
                </div>
              }
            />
            {canChooseMinor && minorControlsOpen && (
              <MinorControls uoc={optionalMinorUoc} options={minorOptions} value={minorId} saving={savingMinor} onChange={chooseMinor} />
            )}
            {thin && hasMajors && <ChooseSpecialisationNotice handbookUrl={handbookUrl("programs", degreeCode)} />}
            {groups.length > 0 && (
              <div className="course-checklist-sheet">
                {groups.map((group, groupIndex) => {
                  const notes = placeCourseRules(group.rules, group.sections);
                  const headingShownAbove = groupIndex === 0 && group.name === heading.name && group.type === heading.type;
                  return (
                    <section key={group.key}>
                      {!headingShownAbove && <GroupHeader group={group} divider />}
                      {group.sections.map((section) => {
                        const index = shownSections.indexOf(section);
                        const key = `${section.title}-${index}`;
                        return (
                          <div key={key} className="course-checklist-part">
                            {section.heading && <p className="course-checklist-part-heading">{section.heading.title}<span> · {section.heading.uoc} UOC, made up of the parts below</span></p>}
                            <CourseSection
                              section={section}
                              isOpen={openMap[key] ?? index === firstOpen}
                              onToggle={() => toggleSection(key, index === firstOpen)}
                              onCourseClick={handleCourseClick}
                              completed={completed}
                              progress={sectionProgresses?.[index]}
                              onToggleDone={trackCompletion ? toggleDone : null}
                              options={options}
                              added={added}
                              notNeeded={notNeeded}
                              onToggleAdded={trackCompletion ? (course) => (course.extra ? toggleInSection(course, section.place) : toggleAdded(course)) : null}
                              onAdd={trackCompletion && (section.open || section.elective) ? () => setAddTarget(section.place) : null}
                              rules={notes.bySection.get(section)}
                              ruleRows={trackCompletion ? Object.values(completed) : null}
                            />
                          </div>
                        );
                      })}
                      {group.unlisted.map((section) => <UnlistedLine key={section.title} section={section} />)}
                      {notes.remaining.map((rule) => <RuleLine key={rule.title} section={rule} rows={trackCompletion ? Object.values(completed) : null} />)}
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

// src/pages/ProgressPage.jsx
// 4-step wizard: Current Program → Progress → Target Program → Transfer Recommendation

import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

import {
  HiAcademicCap,
  HiArrowRight,
  HiArrowLeft,
  HiCheckCircle,
  HiCheck,
  HiSwitchHorizontal,
  HiInformationCircle,
  HiX,
} from "react-icons/hi";

import CourseStructureDisplay from "../components/progress/CourseStructureDisplay";
import ProgramSetupModal from "../components/progress/ProgramSetupModal";
import SpecialisationSelectionPanel from "../components/progress/SpecialisationSelectionPanel";
import ProgramSelector from "../components/compare/ProgramSelector";
import AdvisorReport from "../components/advisor/AdvisorReport";

// ─── Steps ──────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Current Program", desc: "Confirm your enrolled program", icon: HiAcademicCap },
  { id: 2, label: "Your Progress", desc: "Mark completed courses", icon: HiCheckCircle },
  { id: 3, label: "Target Program", desc: "Choose your target program", icon: HiSwitchHorizontal },
  { id: 4, label: "Transfer Recommendation", desc: "Get your personalised analysis", icon: HiCheckCircle },
];

function ProgressPage() {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);

  // Progress state
  const [enrolledProgram, setEnrolledProgram] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [progressStats, setProgressStats] = useState(null);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [courseStructure, setCourseStructure] = useState([]);

  // Compare state
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [searchTarget, setSearchTarget] = useState("");
  const [programsLoading, setProgramsLoading] = useState(false); 
  const [baseSpecsOptions, setBaseSpecsOptions] = useState([]);
  const [baseSelectedSpecs, setBaseSelectedSpecs] = useState([]);
  const [targetProgram, setTargetProgram] = useState(null);
  const [targetSpecsOptions, setTargetSpecsOptions] = useState([]);
  const [targetSelectedSpecs, setTargetSelectedSpecs] = useState([]);

  // Report state
  const [comparisonData, setComparisonData] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentStep]);

  // ─── INIT ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;
    initPage();
  }, [session]);

  const initPage = async () => {
    try {
      setLoading(true);
      setProgramsLoading(true);

      const { data: programData, error: programError } = await supabase
        .from("user_enrolled_program")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (programError && programError.code !== "PGRST116")
        console.error("Error fetching program:", programError);

      if (!programData) {
        setShowSetupModal(true);
        setLoading(false);
        return;
      }

      setEnrolledProgram(programData);
      setBaseSelectedSpecs(programData.specialisation_codes || []);
      await fetchSpecialisationsForProgram(programData.degree_code, true);

      const { data: statsData } = await supabase
        .from("user_progress_stats")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      setProgressStats(statsData);

      const { data: coursesData } = await supabase
        .from("user_completed_courses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("category", { ascending: true });
      setCompletedCourses(coursesData || []);

      await buildCourseStructure(programData, session.user.id);

      const { data: programs } = await supabase
        .from("unsw_degrees_final")
        .select("degree_code, program_name")
        .order("program_name");
      setAvailablePrograms(programs || []);
      setProgramsLoading(false);

      setLoading(false);
    } catch (error) {
      console.error("Error initialising:", error);
      setLoading(false);
      setProgramsLoading(false); 
    }
  };

  // ─── BUILD COURSE STRUCTURE ───────────────────────────────────
  const buildCourseStructure = async (programData, userId) => {
    const { degree_code, specialisation_codes } = programData;
    try {
      const { data: degreeData } = await supabase
        .from("unsw_degrees_final")
        .select("*")
        .eq("degree_code", degree_code)
        .single();
      if (!degreeData) return;

      let structure = [];
      let degreeSections = [];
      try {
        degreeSections =
          typeof degreeData.sections === "string"
            ? JSON.parse(degreeData.sections)
            : degreeData.sections;
      } catch {
        degreeSections = [];
      }

      degreeSections?.forEach((section) => {
        if (section?.title?.toLowerCase().includes("overview")) return;
        structure.push({
          title: section.title,
          uoc: section.uoc,
          courses: section.courses || [],
          notes: section.notes,
          description: section.description,
          source: "program",
          sourceName: degreeData.program_name,
        });
      });

      if (specialisation_codes?.length > 0) {
        const { data: specialisationData } = await supabase
          .from("unsw_specialisations")
          .select("*")
          .in("major_code", specialisation_codes);

        specialisationData?.forEach((spec) => {
          let specSections = [];
          try {
            specSections =
              typeof spec.sections === "string"
                ? JSON.parse(spec.sections)
                : spec.sections;
          } catch {}

          specSections?.forEach((section) => {
            if (section?.title?.toLowerCase().includes("overview")) return;
            structure.push({
              title: section.title,
              uoc: section.uoc,
              courses: section.courses || [],
              notes: section.notes,
              description: section.description,
              source: spec.specialisation_type,
              sourceName: spec.major_name,
            });
          });
        });
      }

      const { data: customCourses } = await supabase
        .from("user_custom_courses")
        .select("*")
        .eq("user_id", userId);

      const coursesBySection = {};
      customCourses?.forEach((course) => {
        if (!coursesBySection[course.section_name])
          coursesBySection[course.section_name] = [];
        coursesBySection[course.section_name].push({
          code: course.course_code,
          name: course.course_name,
          uoc: course.uoc,
        });
      });

      Object.entries(coursesBySection).forEach(([sectionName, courses]) => {
        const existingSection = structure.find((s) => s.title === sectionName);
        if (existingSection) {
          existingSection.courses = [...existingSection.courses, ...courses];
        }
      });

      setCourseStructure(structure);
    } catch (err) {
      console.error("Error in buildCourseStructure:", err);
    }
  };

  const refreshData = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const { data: programData } = await supabase
      .from("user_enrolled_program")
      .select("*")
      .eq("user_id", userId)
      .single();
    setEnrolledProgram(programData);
    setBaseSelectedSpecs(programData?.specialisation_codes || []);
    await buildCourseStructure(programData, userId);
    const { data: statsData } = await supabase
      .from("user_progress_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProgressStats(statsData);
    const { data: coursesData } = await supabase
      .from("user_completed_courses")
      .select("*")
      .eq("user_id", userId);
    setCompletedCourses(coursesData || []);
  };

  // ─── COMPARE HELPERS ──────────────────────────────────────────
  const fetchSpecialisationsForProgram = async (degreeCode, isBase = true) => {
    try {
      let codesToMatch = [degreeCode];
      const { data: degreeData } = await supabase
        .from("unsw_degrees_final")
        .select("program_name")
        .eq("degree_code", degreeCode)
        .single();

      if (degreeData?.program_name?.includes("/")) {
        const programNames = degreeData.program_name.split("/").map((n) => n.trim());
        const { data: individualDegrees } = await supabase
          .from("unsw_degrees_final")
          .select("degree_code, program_name")
          .in("program_name", programNames);
        if (individualDegrees?.length > 0)
          codesToMatch = individualDegrees.map((d) => d.degree_code);
      }

      const { data: specs } = await supabase
        .from("unsw_specialisations")
        .select("major_code, major_name, specialisation_type, sections_degrees")
        .order("major_name");

      const filtered = (specs || []).filter((spec) => {
        try {
          const degrees =
            typeof spec.sections_degrees === "string"
              ? JSON.parse(spec.sections_degrees)
              : spec.sections_degrees;
          return degrees?.some((d) => codesToMatch.includes(d.degree_code));
        } catch {
          return false;
        }
      });

      if (isBase) setBaseSpecsOptions(filtered);
      else setTargetSpecsOptions(filtered);
    } catch (err) {
      console.error(err);
      if (isBase) setBaseSpecsOptions([]);
      else setTargetSpecsOptions([]);
    }
  };

  const filteredTargetPrograms = useMemo(
    () =>
      availablePrograms.filter(
        (p) =>
          p.program_name?.toLowerCase().includes(searchTarget.toLowerCase()) ||
          p.degree_code?.toLowerCase().includes(searchTarget.toLowerCase())
      ),
    [availablePrograms, searchTarget]
  );

  const targetSpecsByType = useMemo(() => {
    const groups = {};
    targetSpecsOptions.forEach((s) => {
      const type = s.specialisation_type || "Specialisation";
      if (!groups[type]) groups[type] = [];
      groups[type].push(s);
    });
    return groups;
  }, [targetSpecsOptions]);

  const toggleSpec = (code, isBase = true) => {
    if (!isBase) {
      const clickedSpec = targetSpecsOptions.find((s) => s.major_code === code);
      if (!clickedSpec) return;
      const clickedType = clickedSpec.specialisation_type;
      const specsOfSameType = targetSpecsOptions
        .filter((s) => s.specialisation_type === clickedType)
        .map((s) => s.major_code);
      setTargetSelectedSpecs((prev) => {
        const withoutSameType = prev.filter((c) => !specsOfSameType.includes(c));
        if (prev.includes(code)) return withoutSameType;
        return [...withoutSameType, code];
      });
    }
  };

  // ─── STEP 4: ANALYSIS ─────────────────────────────────────────
  const runFullAnalysis = async () => {
    if (!enrolledProgram || !targetProgram) return;
    setReportLoading(true);
    setReportError(null);
    setComparisonData(null);
    setAiReport(null);

    try {
      const compareResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/compare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: session.user.id,
            base_program_code: enrolledProgram.degree_code,
            base_specialisation_codes: baseSelectedSpecs,
            target_program_code: targetProgram.code,
            target_specialisation_codes: targetSelectedSpecs,
          }),
        }
      );
      const compareData = await compareResponse.json();
      if (!compareResponse.ok) throw new Error(compareData.detail || "Comparison failed");
      setComparisonData(compareData);

      const aiResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/switch-advisor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: session.user.id,
            base_program_code: enrolledProgram.degree_code,
            base_specialisation_codes: baseSelectedSpecs,
            target_program_code: targetProgram.code,
            target_specialisation_codes: targetSelectedSpecs,
            comparison_data: compareData,
          }),
        }
      );
      const aiData = await aiResponse.json();
      if (!aiResponse.ok) throw new Error(aiData.detail || "Transfer analysis failed");
      setAiReport(aiData);
    } catch (err) {
      console.error(err);
      setReportError(err.message || "Something went wrong. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 4 && !comparisonData && !reportLoading && targetProgram)
      runFullAnalysis();
  }, [currentStep]);

  // ─── NAVIGATION ───────────────────────────────────────────────
  const canProceedFromStep = (step) => {
    switch (step) {
      case 1: return !!enrolledProgram;
      case 2: return true;
      case 3: return !!targetProgram;
      default: return false;
    }
  };

  const goNext = () => {
    if (currentStep < 4 && canProceedFromStep(currentStep)) setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 1) {
      if (currentStep === 4) {
        setComparisonData(null);
        setAiReport(null);
        setReportError(null);
      }
      setCurrentStep((s) => s - 1);
    }
  };

  const goToStep = (step) => {
    if (step <= currentStep) {
      if (step < 4) { setComparisonData(null); setAiReport(null); setReportError(null); }
      setCurrentStep(step);
    }
  };

  const resetAndGoStep4 = () => {
    setComparisonData(null);
    setAiReport(null);
    setReportError(null);
    setCurrentStep(4);
  };

  // ─── LOADING ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50">
          <DashboardNavBar onMenuClick={openDrawer} />
          <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
        </div>
        <div className="pt-16 sm:pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <HiAcademicCap className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const baseProgram = enrolledProgram
    ? { code: enrolledProgram.degree_code, name: enrolledProgram.program_name }
    : null;

  // Nav config per step
  const navConfig = {
    1: { next: "Continue to Your Progress", back: null },
    2: { next: "Continue to Target Program", back: "Back to Current Program" },
    3: { next: "Generate Transfer Recommendation", back: "Back to Your Progress", gradient: true },
    4: { next: null, back: "Back to Target Program" },
  };
  const nav = navConfig[currentStep] || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="mx-6 sm:mx-12 lg:mx-20" ref={contentRef}>
          {/* ═══ PAGE HEADER ══════════════════════════════════════ */}
          <div className="mt-10 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              Program Switch Advisor
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold mt-4 text-slate-900 dark:text-white tracking-tight">
              Program{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-700">
                Switch Advisor
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-3 max-w-2xl">
              Follow the steps below to get a transfer recommendation for switching programs.
            </p>
          </div>

          {/* ═══ STEP INDICATOR ═══════════════════════════════════ */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 mb-8">
            <div className="flex items-center">
              {STEPS.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const isClickable = step.id <= currentStep;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => isClickable && goToStep(step.id)}
                      disabled={!isClickable}
                      className={`flex items-center gap-3 transition-all ${
                        isClickable ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {/* Circle */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                            isActive
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-300/40 dark:shadow-blue-900/60 ring-[3px] ring-blue-200 dark:ring-blue-800"
                              : isCompleted
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {isCompleted ? <HiCheck className="w-5 h-5" /> : step.id}
                        </div>
                        {isActive && (
                          <div className="absolute -inset-1 rounded-full border-2 border-blue-400/30 dark:border-blue-500/20 animate-pulse" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="hidden sm:block text-left min-w-0">
                        <p
                          className={`text-sm font-bold leading-tight ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : isCompleted
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isActive && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            Current Step
                          </span>
                        )}
                        {isCompleted && (
                          <p className="text-[11px] text-emerald-500 dark:text-emerald-400 mt-0.5 font-medium">
                            ✓ Completed
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Connector */}
                    {idx < STEPS.length - 1 && (
                      <div className="flex-1 mx-3 lg:mx-5">
                        <div
                          className={`h-0.5 rounded-full transition-all ${
                            step.id < currentStep
                              ? "bg-emerald-400"
                              : step.id === currentStep
                              ? "bg-gradient-to-r from-blue-400 to-slate-200 dark:to-slate-700"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ STEP CONTENT ════════════════════════════════════= */}
          <div className="mb-8">
            {showSetupModal && (
              <ProgramSetupModal
                onClose={() => setShowSetupModal(false)}
                userId={session.user.id}
                onComplete={async (programData) => {
                  setEnrolledProgram(programData);
                  setShowSetupModal(false);
                  await refreshData();
                }}
              />
            )}

            {/* STEP 1 */}
            {currentStep === 1 && enrolledProgram && !showSetupModal && (
              <div className="space-y-6">
                <StepHeader
                  stepNum={1}
                  title="Confirm Your Current Program"
                  subtitle="Make sure your enrolled program and specialisations are correct before proceeding."
                />
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                  <SpecialisationSelectionPanel
                    enrolledProgram={enrolledProgram}
                    userId={session.user.id}
                    onUpdate={refreshData}
                    onReselectProgram={() => setShowSetupModal(true)}
                  />
                </div>
                {progressStats && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                      Your Current Progress
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <MiniStat label="UOC Done" value={progressStats.uoc_completed} />
                      <MiniStat label="UOC Required" value={progressStats.total_uoc_required} />
                      <MiniStat label="Courses Done" value={progressStats.courses_completed_count} />
                      <MiniStat
                        label="WAM"
                        value={progressStats.current_wam ? progressStats.current_wam.toFixed(1) : "N/A"}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && enrolledProgram && (
              <div className="space-y-6">
                <StepHeader
                  stepNum={2}
                  title="Update Your Progress"
                  subtitle="Mark the courses you've completed. The more accurate your progress, the better the recommendation."
                />
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <HiInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Click the checkbox next to each course to mark it as completed.
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      You can also add marks for WAM calculation.
                    </p>
                  </div>
                </div>
                <ProgressStatsBar stats={progressStats} />
                <CourseStructureDisplay
                  structure={courseStructure}
                  completedCourses={completedCourses}
                  userId={session.user.id}
                  enrolledProgram={enrolledProgram}
                  onCourseUpdate={refreshData}
                />
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <StepHeader
                  stepNum={3}
                  title="Select Your Target Program"
                  subtitle="Search for and select the program you're thinking about switching to."
                />
                
                {programsLoading ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                    <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <HiAcademicCap className="w-8 h-8 text-slate-400 animate-pulse" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Loading programs...</p>
                  </div>
                ) : (
                  <ProgramSelector
                    isBase={false}
                    searchValue={searchTarget}
                    setSearchValue={setSearchTarget}
                    filteredPrograms={filteredTargetPrograms}
                    program={targetProgram}
                    onSelectProgram={async (p) => {
                      if (!p) {
                        setTargetProgram(null);
                        setTargetSelectedSpecs([]);
                        setTargetSpecsOptions([]);
                        return;
                      }
                      setTargetProgram({ code: p.degree_code, name: p.program_name });
                      setTargetSelectedSpecs([]);
                      await fetchSpecialisationsForProgram(p.degree_code, false);
                    }}
                    specsOptions={targetSpecsOptions}
                    specsByType={targetSpecsByType}
                    selectedSpecs={targetSelectedSpecs}
                    toggleSpec={toggleSpec}
                    goNext={resetAndGoStep4}
                    navigate={navigate}
                    baseProgram={baseProgram}
                    baseSpecsOptions={baseSpecsOptions}
                    baseSelectedSpecs={baseSelectedSpecs}
                  />
                )}
              </div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <StepHeader
                  stepNum={4}
                  title="Transfer Recommendation"
                  subtitle={
                    reportLoading
                      ? "Analysing your programs and generating your personalised report..."
                      : "Here’s your transfer analysis and recommendation."
                  }
                />

                {reportLoading && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="mb-8">
                      <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      Generating Your Report
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md text-center leading-relaxed">
                      Comparing course requirements, checking prerequisites, and generating your transfer recommendation...
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      {[0, 0.2, 0.4].map((d) => (
                        <div
                          key={d}
                          className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce"
                          style={{ animationDelay: `${d}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {reportError && !reportLoading && (
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900 p-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <HiX className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Something went wrong
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-6 max-w-md mx-auto">
                      {reportError}
                    </p>
                    <button
                      onClick={runFullAnalysis}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!reportLoading && !reportError && comparisonData && aiReport && (
                  <AdvisorReport
                    comparisonData={comparisonData}
                    aiReport={aiReport}
                    currentProgram={baseProgram}
                    targetProgram={targetProgram}
                    baseSelectedSpecs={baseSelectedSpecs}
                    targetSelectedSpecs={targetSelectedSpecs}
                    baseSpecsOptions={baseSpecsOptions}
                    targetSpecsOptions={targetSpecsOptions}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ STICKY BOTTOM NAV ═══════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="mx-6 sm:mx-12 lg:mx-20 py-4 flex items-center justify-between">
          {/* Back */}
          <div>
            {currentStep > 1 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <HiArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{nav.back}</span>
                <span className="sm:hidden">Back</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/planner")}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <HiArrowLeft className="w-4 h-4" /> Back to Planner
              </button>
            )}
          </div>

          {/* Centre */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Step {currentStep}</span>
            <span className="text-sm text-slate-400 dark:text-slate-500">of {STEPS.length}</span>
          </div>

          {/* Next / Regenerate */}
          <div className="flex items-center gap-3">
            {currentStep === 4 && !reportLoading && (comparisonData || reportError) && (
              <button
                onClick={runFullAnalysis}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            )}

            {currentStep < 4 && (
              <button
                onClick={currentStep === 3 ? resetAndGoStep4 : goNext}
                disabled={!canProceedFromStep(currentStep)}
                className={`flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-[15px] transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-md ${
                  nav.gradient
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <span>{nav.next}</span>
                <HiArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function StepHeader({ stepNum, title, subtitle }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="h-1 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Step {stepNum}</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="text-base text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}

function ProgressStatsBar({ stats }) {
  if (!stats) return null;
  const pct =
    stats.total_uoc_required > 0
      ? Math.round((stats.uoc_completed / stats.total_uoc_required) * 100)
      : 0;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {stats.uoc_completed} / {stats.total_uoc_required} UOC completed
        </span>
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
        <span>{stats.courses_completed_count} courses completed</span>
        <span>WAM: {stats.current_wam ? stats.current_wam.toFixed(1) : "N/A"}</span>
      </div>
    </div>
  );
}

export default ProgressPage;

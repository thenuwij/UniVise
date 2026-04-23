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
  HiX,
  HiSearch,
  HiPlus,
  HiPencil,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi";

import CourseStructureDisplay from "../components/progress/CourseStructureDisplay";
import ProgramSetupModal from "../components/progress/ProgramSetupModal";
import SpecialisationSelectionPanel from "../components/progress/SpecialisationSelectionPanel";
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
  const [targetExpandedType, setTargetExpandedType] = useState(null);

  const [wamInput, setWamInput] = useState("");
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseQuery, setCourseQuery] = useState("");
  const [courseResults, setCourseResults] = useState([]);
  const [courseSearchLoading, setCourseSearchLoading] = useState(false);
  const [extraCourses, setExtraCourses] = useState([]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" && currentStep < 4 && canProceedFromStep(currentStep)) {
        currentStep === 3 ? resetAndGoStep4() : goNext();
      }
      if (e.key === "ArrowLeft") {
        currentStep > 1 ? goBack() : navigate("/planner");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, enrolledProgram, targetProgram]);

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
        .select("current_wam")
        .eq("user_id", session.user.id)
        .single();
      if (statsData?.current_wam) setWamInput(statsData.current_wam.toFixed(1));

      const { data: coursesData } = await supabase
        .from("user_completed_courses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("category", { ascending: true });
      setCompletedCourses(coursesData || []);

      const { data: extraData } = await supabase
        .from("user_completed_courses")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("category", "extra");
      setExtraCourses(extraData || []);

      await buildCourseStructure(programData, session.user.id);

      const { data: programs } = await supabase
        .from("unsw_degrees_final")
        .select("degree_code, program_name, faculty")
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
    const { data: coursesData } = await supabase
      .from("user_completed_courses")
      .select("*")
      .eq("user_id", userId);
    setCompletedCourses(coursesData || []);
  };

  const searchCourses = async (q) => {
    setCourseQuery(q);
    if (q.length < 2) { setCourseResults([]); return; }
    setCourseSearchLoading(true);
    const { data } = await supabase
      .from("unsw_courses")
      .select("id, code, title, uoc")
      .or(`code.ilike.%${q}%,title.ilike.%${q}%`)
      .limit(6);
    setCourseResults(data || []);
    setCourseSearchLoading(false);
  };

  const addExtraCourse = async (course) => {
    const alreadyExists = extraCourses.find(c => c.course_code === course.code);
    if (alreadyExists) return;
    const { data } = await supabase
      .from("user_completed_courses")
      .insert({
        user_id: session.user.id,
        course_code: course.code,
        course_name: course.title,
        uoc: parseInt(course.uoc) || 6,
        is_completed: true,
        category: "extra",
        source_type: "program",
        source_code: null,
      })
      .select()
      .single();
    if (data) setExtraCourses(prev => [...prev, data]);
  };

  const removeExtraCourse = async (id) => {
    await supabase.from("user_completed_courses").delete().eq("id", id);
    setExtraCourses(prev => prev.filter(c => c.id !== id));
  };

  const saveWam = async (value) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) return;
    await supabase.from("user_progress_stats").update({ current_wam: parsed }).eq("user_id", session.user.id);
  };

  // Auto-open first accordion type when target specs load
  useEffect(() => {
    if (targetSpecsOptions.length > 0) {
      const firstType = targetSpecsOptions[0].specialisation_type ?? null;
      setTargetExpandedType(firstType);
    }
  }, [targetSpecsOptions]);

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
      const isDeselecting = targetSelectedSpecs.includes(code);
      setTargetSelectedSpecs((prev) => {
        const withoutSameType = prev.filter((c) => !specsOfSameType.includes(c));
        if (isDeselecting) return withoutSameType;
        return [...withoutSameType, code];
      });
      if (!isDeselecting) {
        // Auto-advance to next type, mirroring step 1 accordion behaviour
        const specTypes = Object.keys(targetSpecsByType);
        const idx = specTypes.indexOf(clickedType);
        setTargetExpandedType(idx < specTypes.length - 1 ? specTypes[idx + 1] : null);
      }
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
      case 1: return true;
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
          <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
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
    3: { next: "Run Analysis", back: "Back to Your Progress", gradient: true },
    4: { next: null, back: "Back to Target Program" },
  };
  const nav = navConfig[currentStep] || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="" ref={contentRef}>
          {/* ═══ STEP INDICATOR ═══════════════════════════════════ */}
          <div className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 border-b border-slate-400 dark:border-slate-500 px-6 py-5 mb-2 flex items-center">
            {currentStep > 1 && currentStep < 4 && (
              <button
                onClick={goBack}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                <HiArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {currentStep === 4 && (
              <button
                onClick={() => setCurrentStep(3)}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                <HiArrowLeft className="w-4 h-4" /> Back to Planner
              </button>
            )}
            <span className="ml-auto text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-widest uppercase">
              {currentStep < 4 ? `Step ${currentStep} of 3` : "Your Analysis"}
            </span>
          </div>

          {/* ═══ STEP CONTENT ════════════════════════════════════= */}
          <div className="max-w-6xl mx-auto px-6 mb-8">
            {showSetupModal && (
              <ProgramSetupModal
                onClose={() => {
                  setShowSetupModal(false);
                  if (!enrolledProgram) navigate("/planner");
                }}
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
              <div className="max-w-6xl mx-auto mt-10 px-4 space-y-4">
                <StepHeader
                  stepNum={1}
                  title="What's your current program?"
                  subtitle=""
                />
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-5 py-3">
                    <SpecialisationSelectionPanel
                      enrolledProgram={enrolledProgram}
                      userId={session.user.id}
                      onUpdate={refreshData}
                      onReselectProgram={() => setShowSetupModal(true)}
                    />
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-6">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      Current WAM <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={wamInput}
                        onChange={(e) => setWamInput(e.target.value)}
                        onBlur={(e) => saveWam(e.target.value)}
                        placeholder="e.g. 75.5"
                        className="w-28 px-3 py-2 text-base font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                      />
                      <span className="text-sm text-slate-400">/ 100</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && enrolledProgram && (
              <div className="space-y-4">
                <StepHeader
                  stepNum={2}
                  title="Which courses have you completed?"
                  subtitle=""
                />
                <div className="max-w-5xl mx-auto px-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tick each course you've completed
                      </p>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">
                        {completedCourses.length} completed
                      </span>
                    </div>
                    <div className="px-5 py-4 max-h-96 overflow-y-auto">
                      <CourseStructureDisplay
                        structure={courseStructure}
                        completedCourses={completedCourses}
                        userId={session.user.id}
                        enrolledProgram={enrolledProgram}
                        onCourseUpdate={refreshData}
                      />
                    </div>
                  </div>
                </div>

                {/* Add extra courses button */}
                <div className="max-w-5xl mx-auto px-4 mb-4">
                  <button
                    onClick={() => setShowCourseModal(true)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold text-base"
                  >
                    <HiPlus className="w-5 h-5" />
                    Add other completed courses
                  </button>
                </div>

                {/* Extra courses display */}
                {extraCourses.length > 0 && (
                  <div className="max-w-5xl mx-auto px-4 border-l-4 border-emerald-400 dark:border-emerald-600 pl-4 rounded-r-lg py-3 bg-gradient-to-r from-emerald-50/20 to-transparent dark:from-emerald-950/10">
                    <div className="flex items-baseline gap-2 mb-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Other Completed Courses</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {extraCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center p-2.5 rounded-lg border border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-600 shadow-sm"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 bg-green-500 border-green-500">
                              <HiCheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                {course.course_code} - {course.course_name}
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                                {course.uoc} UOC
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeExtraCourse(course.id)}
                            className="ml-2 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <HiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Course search modal */}
                {showCourseModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Add completed courses</h3>
                        <button onClick={() => { setShowCourseModal(false); setCourseQuery(""); setCourseResults([]); }} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                          <HiX className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-6">
                        <div className="relative mb-4">
                          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            autoFocus
                            type="text"
                            value={courseQuery}
                            onChange={(e) => searchCourses(e.target.value)}
                            placeholder="Search by course code or name..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors text-sm"
                          />
                          {courseSearchLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                          {courseResults.length > 0 ? courseResults.map((course) => {
                            const isAdded = extraCourses.some(c => c.course_code === course.code);
                            return (
                            <button
                              key={course.code}
                              onClick={async () => { if (!isAdded) await addExtraCourse(course); }}
                              disabled={isAdded}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                                isAdded
                                  ? "border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600 cursor-default"
                                  : "border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300"
                              }`}
                            >
                              <div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white block">{course.code}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{course.title}</span>
                              </div>
                              {isAdded ? (
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 ml-4 flex-shrink-0 flex items-center gap-1">
                                  <HiCheck className="w-3.5 h-3.5" /> Added
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-4 flex-shrink-0">+ Add</span>
                              )}
                            </button>
                            );
                          }) : courseQuery.length >= 2 && !courseSearchLoading ? (
                            <p className="text-center text-sm text-slate-400 py-8">No courses found</p>
                          ) : (
                            <p className="text-center text-sm text-slate-400 py-8">Type at least 2 characters to search</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <StepHeader
                  stepNum={3}
                  title="What program do you want to switch to?"
                  subtitle=""
                />

                {programsLoading ? (
                  <div className="max-w-5xl mx-auto px-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
                      <div className="inline-block p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <HiAcademicCap className="w-7 h-7 text-slate-400 animate-pulse" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">Loading programs...</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-5xl mx-auto px-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                      <input
                        type="text"
                        value={searchTarget}
                        onChange={(e) => setSearchTarget(e.target.value)}
                        placeholder="Search programs..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                      />
                      {targetProgram && (
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-300 dark:border-green-700 mb-3">
                          <div className="flex items-center gap-3">
                            <HiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{targetProgram.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{targetProgram.code}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => { setTargetProgram(null); setTargetSelectedSpecs([]); setTargetSpecsOptions([]); }}
                            className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-bold transition-colors"
                          >
                            <HiPencil className="w-3.5 h-3.5" /> Change
                          </button>
                        </div>
                      )}
                      {!targetProgram && (
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                          {filteredTargetPrograms.slice(0, 30).map((p) => (
                            <button
                              key={p.degree_code}
                              onClick={async () => {
                                setTargetProgram({ code: p.degree_code, name: p.program_name });
                                setTargetSelectedSpecs([]);
                                setTargetExpandedType(null);
                                await fetchSpecialisationsForProgram(p.degree_code, false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.program_name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{p.faculty}</p>
                            </button>
                          ))}
                          {filteredTargetPrograms.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-slate-400">No programs found</div>
                          )}
                        </div>
                      )}
                      {targetProgram && targetSpecsOptions.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-base font-bold text-slate-900 dark:text-white">Specialisations (Optional)</p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Select one from each category if applicable</p>
                          {Object.keys(targetSpecsByType).length === 1 ? (
                            /* Single type — no accordion, just cards */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {targetSpecsOptions.map((spec) => {
                                const isSelected = targetSelectedSpecs.includes(spec.major_code);
                                return (
                                  <button
                                    key={spec.major_code}
                                    onClick={() => toggleSpec(spec.major_code, false)}
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                      isSelected
                                        ? "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-md"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-semibold text-xs text-slate-900 dark:text-white flex-1">{spec.major_name}</span>
                                      {isSelected && <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />}
                                    </div>
                                    {isSelected && <span className="mt-1 inline-block text-[11px] font-semibold text-green-600 dark:text-green-400">Selected</span>}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            /* Multiple types — accordion */
                            <div className="space-y-2">
                              {Object.entries(targetSpecsByType).map(([type, specs]) => {
                                const isExpanded = targetExpandedType === type;
                                const selectedSpec = specs.find((s) => targetSelectedSpecs.includes(s.major_code)) ?? null;
                                return (
                                  <div
                                    key={type}
                                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                                      selectedSpec ? "border-green-300 dark:border-green-700" : "border-blue-300 dark:border-blue-700"
                                    }`}
                                  >
                                    {/* Accordion header */}
                                    <div
                                      className={`flex items-center justify-between px-5 py-4 ${
                                        selectedSpec
                                          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40"
                                          : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40"
                                      }`}
                                    >
                                      <button
                                        onClick={() => setTargetExpandedType(isExpanded ? null : type)}
                                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                      >
                                        <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex-shrink-0">{type}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{specs.length} options</span>
                                        {selectedSpec ? (
                                          <span className="text-xs font-semibold text-green-700 dark:text-green-400 truncate">{selectedSpec.major_name}</span>
                                        ) : (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex-shrink-0">Not selected</span>
                                        )}
                                      </button>
                                      <button onClick={() => setTargetExpandedType(isExpanded ? null : type)} className="ml-3 flex-shrink-0">
                                        {isExpanded ? <HiChevronUp className="w-5 h-5 text-slate-500" /> : <HiChevronDown className="w-5 h-5 text-slate-500" />}
                                      </button>
                                    </div>
                                    {/* Accordion body */}
                                    {isExpanded && (
                                      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {specs.map((spec) => {
                                            const isSelected = targetSelectedSpecs.includes(spec.major_code);
                                            return (
                                              <button
                                                key={spec.major_code}
                                                onClick={() => toggleSpec(spec.major_code, false)}
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                  isSelected
                                                    ? "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-md"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                                }`}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <span className="font-semibold text-xs text-slate-900 dark:text-white flex-1">{spec.major_name}</span>
                                                  {isSelected && <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />}
                                                </div>
                                                {isSelected && <span className="mt-1 inline-block text-[11px] font-semibold text-green-600 dark:text-green-400">Selected</span>}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <div>

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

            {currentStep < 4 && (
              <div className="mt-8 mb-16">
                <button
                  onClick={currentStep === 3 ? resetAndGoStep4 : goNext}
                  disabled={!canProceedFromStep(currentStep)}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {nav.next} <HiArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
            {currentStep === 4 && !reportLoading && (comparisonData || reportError) && (
              <div className="mt-8 mb-16">
                <button
                  onClick={runFullAnalysis}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500 hover:from-slate-400 hover:to-slate-500 dark:hover:from-slate-500 dark:hover:to-slate-400 border border-slate-400 dark:border-slate-500 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all"
                >
                  Regenerate Report
                </button>
              </div>
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

function StepHeader({ title, subtitle }) {
  return (
    <div className="mt-8 mb-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h2>
      <p className="text-base text-slate-500 dark:text-slate-400 mt-1.5">{subtitle}</p>
    </div>
  );
}



export default ProgressPage;

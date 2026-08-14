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
  HiInformationCircle,
} from "react-icons/hi";

import ProgramSetupModal from "../components/progress/ProgramSetupModal";
import StepCurrentProgram from "../components/progress/StepCurrentProgram";
import StepCompletedCourses from "../components/progress/StepCompletedCourses";
import StepTargetProgram from "../components/progress/StepTargetProgram";
import StepTransferReport from "../components/progress/StepTransferReport";
import { apiJson } from "../utils/api";
import { buildCourseStructure } from "../utils/courseStructure";

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
  const [duplicateNotice, setDuplicateNotice] = useState(null);

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

      await loadCourseStructure(programData, session.user.id);

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
  const loadCourseStructure = async (programData, userId) => {
    try {
      const structure = await buildCourseStructure(programData, userId);
      if (structure) setCourseStructure(structure);
    } catch (err) {
      console.error("Error building course structure:", err);
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
    await loadCourseStructure(programData, userId);
    const { data: coursesData } = await supabase
      .from("user_completed_courses")
      .select("*")
      .eq("user_id", userId);
    setCompletedCourses(coursesData || []);
    const { data: extraData } = await supabase
      .from("user_completed_courses")
      .select("*")
      .eq("user_id", userId)
      .eq("category", "extra");
    setExtraCourses(extraData || []);
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
    const existing = completedCourses.find(c => c.course_code === course.code);
    if (existing) {
      const reason = existing.category === "extra" ? "extras" : "program";
      setDuplicateNotice({ code: course.code, reason });
      return;
    }
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

  // Auto-dismiss the "already completed" notice after 4 seconds
  useEffect(() => {
    if (!duplicateNotice) return;
    const t = setTimeout(() => setDuplicateNotice(null), 4000);
    return () => clearTimeout(t);
  }, [duplicateNotice]);

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
      const comparisonRequest = {
        user_id: session.user.id,
        base_program_code: enrolledProgram.degree_code,
        base_specialisation_codes: baseSelectedSpecs,
        target_program_code: targetProgram.code,
        target_specialisation_codes: targetSelectedSpecs,
      };

      const compareData = await apiJson("/compare", {
        method: "POST",
        token: session.access_token,
        body: comparisonRequest,
      });
      setComparisonData(compareData);

      const aiData = await apiJson("/switch-advisor", {
        method: "POST",
        token: session.access_token,
        body: { ...comparisonRequest, comparison_data: compareData },
      });
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
            {currentStep === 1 && (
              <button
                onClick={() => navigate("/planner")}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                <HiArrowLeft className="w-4 h-4" /> Planner
              </button>
            )}
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
                <HiArrowLeft className="w-4 h-4" /> Back
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
              <StepCurrentProgram
                enrolledProgram={enrolledProgram}
                userId={session.user.id}
                onRefresh={refreshData}
                onReselectProgram={() => setShowSetupModal(true)}
                wamInput={wamInput}
                setWamInput={setWamInput}
                onSaveWam={saveWam}
              />
            )}

            {/* STEP 2 */}
            {currentStep === 2 && enrolledProgram && (
              <StepCompletedCourses
                enrolledProgram={enrolledProgram}
                userId={session.user.id}
                courseStructure={courseStructure}
                completedCourses={completedCourses}
                onRefresh={refreshData}
                extraCourses={extraCourses}
                onRemoveExtraCourse={removeExtraCourse}
                showCourseModal={showCourseModal}
                setShowCourseModal={setShowCourseModal}
                courseQuery={courseQuery}
                setCourseQuery={setCourseQuery}
                courseResults={courseResults}
                setCourseResults={setCourseResults}
                courseSearchLoading={courseSearchLoading}
                duplicateNotice={duplicateNotice}
                setDuplicateNotice={setDuplicateNotice}
                onSearchCourses={searchCourses}
                onAddExtraCourse={addExtraCourse}
              />
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <StepTargetProgram
                programsLoading={programsLoading}
                searchTarget={searchTarget}
                setSearchTarget={setSearchTarget}
                filteredTargetPrograms={filteredTargetPrograms}
                targetProgram={targetProgram}
                setTargetProgram={setTargetProgram}
                targetSpecsOptions={targetSpecsOptions}
                setTargetSpecsOptions={setTargetSpecsOptions}
                targetSelectedSpecs={targetSelectedSpecs}
                setTargetSelectedSpecs={setTargetSelectedSpecs}
                targetSpecsByType={targetSpecsByType}
                targetExpandedType={targetExpandedType}
                setTargetExpandedType={setTargetExpandedType}
                onFetchSpecialisations={fetchSpecialisationsForProgram}
                onToggleSpec={toggleSpec}
              />
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <StepTransferReport
                reportLoading={reportLoading}
                reportError={reportError}
                comparisonData={comparisonData}
                aiReport={aiReport}
                onRetry={runFullAnalysis}
                baseProgram={baseProgram}
                targetProgram={targetProgram}
                baseSelectedSpecs={baseSelectedSpecs}
                targetSelectedSpecs={targetSelectedSpecs}
                baseSpecsOptions={baseSpecsOptions}
                targetSpecsOptions={targetSpecsOptions}
              />
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




export default ProgressPage;

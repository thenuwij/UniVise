// src/pages/ProgressPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

import {
  HiAcademicCap,
  HiArrowRight,
  HiCheckCircle,
  HiPencil,
  HiChartBar,
  HiSwitchHorizontal,
  HiInformationCircle,
  HiX,
} from "react-icons/hi";

import CourseStructureDisplay from "../components/progress/CourseStructureDisplay";
import ProgramSetupModal from "../components/progress/ProgramSetupModal";
import SpecialisationSelectionPanel from "../components/progress/SpecialisationSelectionPanel";

function ProgressPage() {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  const [enrolledProgram, setEnrolledProgram] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [progressStats, setProgressStats] = useState(null);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [courseStructure, setCourseStructure] = useState([]);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const checkEnrollment = async () => {
      try {
        setLoading(true);

        const { data: programData, error: programError } = await supabase
          .from("user_enrolled_program")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (programError && programError.code !== "PGRST116") {
          console.error("Error fetching program:", programError);
        }

        if (!programData) {
          setShowSetupModal(true);
          setLoading(false);
          return;
        }

        setEnrolledProgram(programData);

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

        setLoading(false);
      } catch (error) {
        console.error("Error in checkEnrollment:", error);
        setLoading(false);
      }
    };

    checkEnrollment();
  }, [session]);

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
            <p className="text-gray-500 dark:text-gray-400">
              Loading your progress...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen 
        bg-gradient-to-br 
        from-slate-50 via-slate-50 to-slate-100
        dark:from-slate-950 dark:via-slate-950 dark:to-slate-900
      "
    >
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        {/* SUBTLE INNER GRADIENT — ALSO SOFTENED */}
        <div className="bg-gradient-to-b from-blue-50/10 via-transparent to-purple-50/10 dark:from-blue-950/5 dark:via-transparent dark:to-purple-950/5">
          <div className="flex flex-col justify-center h-full px-6 lg:px-10 xl:px-20">

            {/* HEADER */}
            <div className="mt-6 mb-6">
             <div className="flex items-center justify-between gap-4 flex-wrap">

                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Track Progress
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold mt-3 text-slate-900 dark:text-white">
                    My{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600">
                      Academic Progress
                    </span>
                  </h1>

                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-3">
                    Track your completed courses and monitor your degree progress
                  </p>
                </div>

                {!showGuide && enrolledProgram && (
                  <button
                    onClick={() => setShowGuide(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 text-white text-base font-bold hover:from-blue-700 hover:to-sky-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <HiInformationCircle className="w-5 h-5" />
                    Show Guide
                  </button>
                )}
              </div>
            </div>

            {/* GUIDE */}
            {enrolledProgram && showGuide && (
              <div className="mb-4 bg-gradient-to-br from-blue-50/40 to-sky-50/40 dark:from-blue-900/20 dark:to-sky-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800/40">
                      <HiInformationCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                      How to Use This Page
                    </h2>
                  </div>

                  <button
                    onClick={() => setShowGuide(false)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-base font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <HiX className="w-5 h-5" />
                    Hide Guide
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GuideCard
                    icon={<HiPencil className="w-6 h-6" />}
                    title="1. Select Your Program & Specialisations"
                    description="Click 'Edit Program' to change your program or select majors/minors/honours."
                  />
                  <GuideCard
                    icon={<HiCheckCircle className="w-6 h-6" />}
                    title="2. Mark Courses as Completed"
                    description="Click small box inside course cards to mark as completed. Stats auto update."
                  />
                  <GuideCard
                    icon={<HiChartBar className="w-6 h-6" />}
                    title="3. Add Marks to Calculate WAM"
                    description="Enter marks on completed courses. Your WAM updates automatically."
                  />
                  <GuideCard
                    icon={<HiSwitchHorizontal className="w-6 h-6" />}
                    title="4. Compare Programs"
                    description="Click 'Compare Programs' to compare your completed courses with other UNSW programs."
                  />
                </div>
              </div>
            )}

            {/* Setup Modal */}
            {showSetupModal && (
              <ProgramSetupModal
                onClose={() => setShowSetupModal(false)}
                userId={session.user.id}
                onComplete={(programData) => {
                  setEnrolledProgram(programData);
                  setShowSetupModal(false);
                  buildCourseStructure(programData, session.user.id);
                }}
              />
            )}

            {/* MAIN CONTENT */}
            {enrolledProgram && !showSetupModal && (
              <>
                {/* SPECIALISATIONS */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-4 mb-6">
                  <SpecialisationSelectionPanel
                    enrolledProgram={enrolledProgram}
                    userId={session.user.id}
                    onUpdate={refreshData}
                    onReselectProgram={() => setShowSetupModal(true)}
                  />
                </div>

                {/* STATS */}
                <ProgressStatsOverview stats={progressStats} />

                {/* COMPARE */}
                <ComparePromoBanner />

                {/* COURSE STRUCTURE */}
                <CourseStructureDisplay
                  structure={courseStructure}
                  completedCourses={completedCourses}
                  userId={session.user.id}
                  enrolledProgram={enrolledProgram}
                  onCourseUpdate={refreshData}
                />
              </>
            )}

            {/* Back Button */}
            <div className="my-12">
              <button
                onClick={() => navigate("/planner")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow hover:shadow-lg transition"
              >
                <HiArrowRight className="w-5 h-5 rotate-180" />
                <span>Back to Planner</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper Components */

function GuideCard({ icon, title, description }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressStatsOverview({ stats }) {
  if (!stats) return null;

  const completionPercentage =
    stats.total_uoc_required > 0
      ? Math.round((stats.uoc_completed / stats.total_uoc_required) * 100)
      : 0;

  return (
    <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-slate-700 shadow p-5">
      <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
        Progress Overview
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox
          label="UOC Completed"
          value={stats.uoc_completed}
          sublabel={`of ${stats.total_uoc_required}`}
        />

        <StatBox
          label="UOC Remaining"
          value={stats.uoc_remaining}
          sublabel={`${completionPercentage}% done`}
        />

        <StatBox
          label="Current WAM"
          value={stats.current_wam ? stats.current_wam.toFixed(2) : "N/A"}
          sublabel="Auto-calculated"
        />

        <StatBox
          label="Courses Done"
          value={stats.courses_completed_count}
          sublabel="completed"
        />
      </div>
    </div>
  );
}

function StatBox({ label, value, sublabel }) {
  return (
    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-bold uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
        {sublabel}
      </p>
    </div>
  );
}

function ComparePromoBanner() {
  const navigate = useNavigate();

  return (
    <div className="mt-4 p-6 rounded-xl bg-gradient-to-r from-blue-50/40 to-sky-50/40 dark:from-blue-900/30 dark:to-sky-900/30 border-2 border-blue-200 dark:border-blue-700 shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800/40">
            <HiAcademicCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              Thinking about switching programs?
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1 font-semibold">
              Compare your progress with other programs to see how courses transfer
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/compare")}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white text-base font-bold hover:bg-blue-700 transition shadow hover:shadow-xl"
        >
          <span>Compare Programs</span>
          <HiArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ProgressPage;
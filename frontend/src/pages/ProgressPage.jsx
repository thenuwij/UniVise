// src/pages/ProgressPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import {
  HiAcademicCap,
  HiArrowRight,
} from "react-icons/hi";

// Import components
import ProgramSetupModal from "../components/progress/ProgramSetupModal";
import SpecialisationSelectionPanel from "../components/progress/SpecialisationSelectionPanel";
import CourseStructureDisplay from "../components/progress/CourseStructureDisplay";

function ProgressPage() {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // User's enrolled program data
  const [enrolledProgram, setEnrolledProgram] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  
  // Progress data
  const [progressStats, setProgressStats] = useState(null);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [courseStructure, setCourseStructure] = useState([]);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // Check if user has enrolled program on mount
  useEffect(() => {
    if (!session?.user?.id) return;

    const checkEnrollment = async () => {
      try {
        setLoading(true);

        // Check if user has enrolled program
        const { data: programData, error: programError } = await supabase
          .from("user_enrolled_program")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (programError && programError.code !== "PGRST116") {
          console.error("Error fetching program:", programError);
        }

        if (!programData) {
          // No enrolled program, show setup modal
          setShowSetupModal(true);
          setLoading(false);
          return;
        }

        setEnrolledProgram(programData);

        // Fetch progress stats
        const { data: statsData, error: statsError } = await supabase
          .from("user_progress_stats")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (statsError) console.error("Stats error:", statsError);
        setProgressStats(statsData);

        // Fetch completed courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("user_completed_courses")
          .select("*")
          .eq("user_id", session.user.id)
          .order("category", { ascending: true });

        if (coursesError) console.error("Courses error:", coursesError);
        setCompletedCourses(coursesData || []);

        // Fetch and build course structure
        await buildCourseStructure(programData);

        setLoading(false);
      } catch (error) {
        console.error("Error in checkEnrollment:", error);
        setLoading(false);
      }
    };

    checkEnrollment();
  }, [session]);

  // Build merged course structure from program + specialisations
  const buildCourseStructure = async (programData) => {
    const { degree_code, specialisation_codes } = programData;

    try {
      // Fetch degree data
      const { data: degreeData, error: degreeError } = await supabase
        .from("unsw_degrees_final")
        .select("*")
        .eq("degree_code", degree_code)
        .single();

      if (degreeError) {
        console.error("Error fetching degree:", degreeError);
        return;
      }

      if (!degreeData) {
        console.error("No degree data found");
        return;
      }

      const structure = [];

      // Parse degree sections with proper error handling
      let degreeSections = [];
      try {
        degreeSections = typeof degreeData.sections === "string" 
          ? JSON.parse(degreeData.sections) 
          : degreeData.sections;
        
        if (typeof degreeSections === "string") {
          degreeSections = JSON.parse(degreeSections);
        }
      } catch (err) {
        console.error("Error parsing degree sections:", err);
        degreeSections = [];
      }

      // Add ALL degree sections (including ones without courses)
      if (Array.isArray(degreeSections)) {
        degreeSections.forEach((section) => {
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
      }

      // Fetch and add specialisation sections
      if (specialisation_codes && specialisation_codes.length > 0) {
        const { data: specialisationData, error: specError } = await supabase
          .from("unsw_specialisations")
          .select("*")
          .in("major_code", specialisation_codes);

        if (specError) {
          console.error("Error fetching specialisations:", specError);
        } else if (specialisationData) {
          specialisationData.forEach((spec) => {
            let specSections = [];
            try {
              specSections = typeof spec.sections === "string" 
                ? JSON.parse(spec.sections) 
                : spec.sections;
              
              if (typeof specSections === "string") {
                specSections = JSON.parse(specSections);
              }
            } catch (err) {
              console.error("Error parsing specialisation sections:", err);
              specSections = [];
            }

            if (Array.isArray(specSections)) {
              specSections.forEach((section) => {
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
            }
          });
        }
      }

      console.log("Built structure with", structure.length, "sections");
      setCourseStructure(structure);
    } catch (err) {
      console.error("Error in buildCourseStructure:", err);
    }
  };

  const refreshData = async () => {
    if (!session?.user?.id) return;

    // Refresh enrolled program
    const { data: programData } = await supabase
      .from("user_enrolled_program")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (programData) {
      setEnrolledProgram(programData);
      await buildCourseStructure(programData);
    }

    // Refresh stats
    const { data: statsData } = await supabase
      .from("user_progress_stats")
      .select("*")
      .eq("user_id", session.user.id)
      .single();
    setProgressStats(statsData);

    // Refresh completed courses
    const { data: coursesData } = await supabase
      .from("user_completed_courses")
      .select("*")
      .eq("user_id", session.user.id);
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
            <p className="text-gray-500 dark:text-gray-400">Loading your progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">
          {/* Header Section */}
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              Track Progress
            </div>
            <h1 className="text-4xl font-bold mt-4 mb-2">My Academic Progress</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your courses, calculate your WAM, and monitor your degree completion
            </p>
          </div>

          {/* Setup Modal */}
          {showSetupModal && (
            <ProgramSetupModal
              onClose={() => setShowSetupModal(false)}
              userId={session.user.id}
              onComplete={(programData) => {
                setEnrolledProgram(programData);
                setShowSetupModal(false);
                buildCourseStructure(programData);
              }}
            />
          )}

          {/* Main Content */}
          {enrolledProgram && !showSetupModal && (
            <>
              {/* Specialisation Selection Panel */}
              <div className="mt-6">
                <SpecialisationSelectionPanel
                  enrolledProgram={enrolledProgram}
                  userId={session.user.id}
                  onUpdate={refreshData}
                  onReselectProgram={() => setShowSetupModal(true)}
                />
              </div>

              {/* Progress Stats Overview */}
              <ProgressStatsOverview stats={progressStats} />

              {/* Compare Programs CTA */}
              <ComparePromoBanner />

              {/* Course Structure */}
              <CourseStructureDisplay
                structure={courseStructure}
                completedCourses={completedCourses}
                userId={session.user.id}
                onCourseUpdate={refreshData}
              />
            </>
          )}

          {/* Back Button */}
          <div className="my-16">
            <button
              onClick={() => navigate("/planner")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <HiArrowRight className="w-5 h-5 rotate-180" />
              <span>Back to Planner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* HELPER COMPONENTS */

// Progress Stats Overview
function ProgressStatsOverview({ stats }) {
  if (!stats) return null;

  const completionPercentage = stats.total_uoc_required > 0
    ? Math.round((stats.uoc_completed / stats.total_uoc_required) * 100)
    : 0;

  return (
    <div className="mt-6 border-t border-b border-gray-200 dark:border-gray-700 py-6">
      <h2 className="text-2xl font-bold mb-6">Progress Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox
          label="UOC Completed"
          value={stats.uoc_completed}
          sublabel={`of ${stats.total_uoc_required} required`}
          color="blue"
        />
        <StatBox
          label="Minimum UOC remaining"
          value={stats.uoc_remaining}
          sublabel={`${completionPercentage}% complete`}
          color="purple"
        />
        <StatBox
          label="Current WAM"
          value={stats.current_wam ? stats.current_wam.toFixed(2) : "N/A"}
          sublabel="Weighted Average"
          color="green"
        />
        <StatBox
          label="Courses Completed"
          value={stats.courses_completed_count}
          sublabel="courses finished"
          color="amber"
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        Minimum UOC Required: {stats.total_uoc_required} UOC
      </p>
    </div>
  );
}

function StatBox({ label, value, sublabel, color }) {
  const colorMap = {
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    green: "text-green-600 dark:text-green-400",
    amber: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      <p className={`text-4xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{sublabel}</p>
    </div>
  );
}

// Compare Programs Promo Banner
function ComparePromoBanner() {
  return (
    <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-2 border-sky-200 dark:border-sky-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-sky-900 dark:text-sky-100">
            Thinking about switching programs?
          </h3>
          <p className="text-sky-700 dark:text-sky-300 text-sm mt-1">
            Compare your current progress with other programs to see how your courses transfer
          </p>
        </div>
        <button
          onClick={() => {
            alert("Compare feature coming soon!");
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
        >
          <span>Compare Programs</span>
          <HiArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ProgressPage;
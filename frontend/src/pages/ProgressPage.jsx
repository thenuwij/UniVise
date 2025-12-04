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
} from "react-icons/hi";

// Import components
import CourseStructureDisplay from "../components/progress/CourseStructureDisplay";
import ProgramSetupModal from "../components/progress/ProgramSetupModal";
import SpecialisationSelectionPanel from "../components/progress/SpecialisationSelectionPanel";

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
        await buildCourseStructure(programData, session.user.id);

        setLoading(false);
      } catch (error) {
        console.error("Error in checkEnrollment:", error);
        setLoading(false);
      }
    };

    checkEnrollment();
  }, [session]);

  // Build merged course structure from program + specialisations
  const buildCourseStructure = async (programData, userId) => {
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

      // Fetch and add user's custom courses
      const { data: customCourses, error: customError } = await supabase
        .from("user_custom_courses")
        .select("*")
        .eq("user_id", userId);

      if (customError) {
        console.error("Error fetching custom courses:", customError);
      } else if (customCourses && customCourses.length > 0) {
        // Group custom courses by section name
        const coursesBySection = {};
        customCourses.forEach(course => {
          if (!coursesBySection[course.section_name]) {
            coursesBySection[course.section_name] = [];
          }
          coursesBySection[course.section_name].push({
            code: course.course_code,
            name: course.course_name,
            uoc: course.uoc
          });
        });

        // Add each section with its custom courses to the structure
        Object.entries(coursesBySection).forEach(([sectionName, courses]) => {
          // Find if this section already exists in the structure
          const existingSection = structure.find(s => s.title === sectionName);
          
          if (existingSection) {
            // Add custom courses to existing section
            existingSection.courses = [...existingSection.courses, ...courses];
          }
        });
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
      await buildCourseStructure(programData, session.user.id);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-6 lg:px-10 xl:px-20">
          {/* Header Section */}
          <div className="mt-6 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              Track Progress
            </div>
            <h1 className="text-3xl font-bold mt-3 text-slate-900 dark:text-white">
              My Academic Progress
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
              {/* Compact Specialisation Selection Panel */}
              <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <SpecialisationSelectionPanel
                  enrolledProgram={enrolledProgram}
                  userId={session.user.id}
                  onUpdate={refreshData}
                  onReselectProgram={() => setShowSetupModal(true)}
                />
              </div>

              <ProgressStatsOverview stats={progressStats} />

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
          <div className="my-12">
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

// Progress Stats Overview - More Compact
function ProgressStatsOverview({ stats }) {
  if (!stats) return null;

  const completionPercentage = stats.total_uoc_required > 0
    ? Math.round((stats.uoc_completed / stats.total_uoc_required) * 100)
    : 0;

  return (
    <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
      <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Progress Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox
          label="UOC Completed"
          value={stats.uoc_completed}
          sublabel={`of ${stats.total_uoc_required}`}
          color="blue"
        />
        <StatBox
          label="UOC Remaining"
          value={stats.uoc_remaining}
          sublabel={`${completionPercentage}% done`}
          color="purple"
        />
        <StatBox
          label="Current WAM"
          value={stats.current_wam ? stats.current_wam.toFixed(2) : "N/A"}
          color="green"
        />
        <StatBox
          label="Completed done"
          value={stats.courses_completed_count}
          sublabel="completed"
          color="amber"
        />
      </div>
    </div>
  );
}

function StatBox({ label, value, sublabel, color }) {
  const colorMap = {
    blue: "text-black dark:text-white",
    purple: "text-black dark:text-white",
    green: "text-black dark:text-white",
    amber: "text-black dark:text-white",
  };

  return (
    <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">{label}</p>
      <p className={`text-2xl lg:text-3xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{sublabel}</p>
    </div>
  );
}

// Compare Programs
function ComparePromoBanner() {
  const navigate = useNavigate();
  
  return (
    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-700">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-sky-900 dark:text-sky-100">
            Thinking about switching programs?
          </h3>
          <p className="text-sky-700 dark:text-sky-300 text-xs mt-0.5">
            Compare your progress with other programs to see how courses transfer
          </p>
        </div>
        <button
          onClick={() => navigate("/compare")}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition"
        >
          <span>Compare Programs</span>
          <HiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ProgressPage;
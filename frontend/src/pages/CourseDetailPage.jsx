// src/pages/CourseDetailPage.jsx
import { useEffect, useState } from "react";
import {
  HiAcademicCap,
  HiArrowLeft,
  HiBookOpen,
  HiCalendar,
  HiChartBar,
  HiCheckCircle,
  HiClipboardList,
  HiCollection
} from "react-icons/hi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import CourseRelatedDegrees from "../components/CourseRelatedDegrees";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import SaveButton from "../components/SaveButton";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = UserAuth();
  
  // Get section from URL parameter
  const sectionName = searchParams.get("section");
  const goDegree = (degreeId) => navigate(`/degrees/${degreeId}`);

  const [course, setCourse] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [addingToProgress, setAddingToProgress] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    let alive = true;
    const fetchCourse = async () => {
      setLoadErr(null);
      const { data, error } = await supabase
        .from("unsw_courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (!alive) return;

      if (error) {
        console.error("Failed to fetch course:", error.message);
        setLoadErr(error.message);
      } else {
        setCourse(data);
      }
    };
    fetchCourse();
    return () => {
      alive = false;
    };
  }, [courseId]);

  const handleAddToProgress = async () => {
    if (!session?.user?.id || !course || !sectionName) {
      alert("Unable to add course. Please ensure you're logged in and came from a progress section.");
      return;
    }

    setAddingToProgress(true);

    try {
      // Extract UOC number from string 
      const uocNumber = course.uoc ? parseInt(course.uoc.match(/\d+/)?.[0] || 0) : 0;

      // Insert into user_custom_courses table
      const { error } = await supabase
        .from("user_custom_courses")
        .insert({
          user_id: session.user.id,
          course_code: course.code,
          course_name: course.title,
          uoc: uocNumber,
          section_name: sectionName,
        });

      if (error) {
        console.error("Error adding course:", error);
        alert("Failed to add course to progress. It may already be added.");
      } else {
        setAddedSuccess(true);
        setTimeout(() => {
          navigate("/progress");
        }, 1500);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred while adding the course.");
    } finally {
      setAddingToProgress(false);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-400/40 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <HiBookOpen className="w-12 h-12 text-slate-400 animate-pulse" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-lg">
            {loadErr ? `Error: ${loadErr}` : "Loading course details..."}
          </p>
        </div>
      </div>
    );
  }

  // Normalize terms
  const normalizedTerms = Array.isArray(course.offering_terms)
    ? course.offering_terms.join(", ")
    : typeof course.offering_terms === "string"
    ? course.offering_terms
    : "N/A";

  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 to-slate-400/40 dark:from-slate-950 dark:to-slate-900">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <main className="max-w-[1600px] mx-auto px-6 py-16">

        {/* Back Button */}
        <button
          onClick={goBack}
          className="group flex items-center gap-2 mb-12 px-4 py-2 rounded-xl
                     bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600
                     text-slate-700 dark:text-slate-300 font-semibold
                     hover:bg-slate-50 dark:hover:bg-slate-800
                     shadow-md hover:shadow-lg transition-all duration-200"
        >
          <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Success Message */}
        {addedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-700">
            <div className="flex items-center gap-3">
              <HiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200 font-semibold">
                Course added to progress! Redirecting...
              </p>
            </div>
          </div>
        )}

        {/* Section Info Banner */}
        {sectionName && !addedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-700">
            <p className="text-blue-800 dark:text-blue-200 font-semibold">
              Adding course to: <span className="font-bold">{sectionName}</span>
            </p>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-2xl p-10 mb-14">

          <div className="flex items-start gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-md">
              <HiBookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4 leading-tight">
                {course.title}
              </h1>

              <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 font-semibold mb-2">
                {course.code}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {course.faculty && (
                  <Tag>{course.faculty}</Tag>
                )}

                {course.school && (
                  <Tag>{course.school}</Tag>
                )}

                {course.study_level && (
                  <Tag blue>{course.study_level}</Tag>
                )}
              </div>
            </div>

            {/* Action Buttons*/}
            <div className="flex-shrink-0 flex gap-3">
              {/* Add to Progress Button */}
              {sectionName && (
                <button
                  onClick={handleAddToProgress}
                  disabled={addingToProgress || addedSuccess}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToProgress ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : addedSuccess ? (
                    <>
                      <HiCheckCircle className="w-5 h-5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <HiAcademicCap className="w-5 h-5" />
                      <span>Add to Progress</span>
                    </>
                  )}
                </button>
              )}

              {/* Save Button */}
              <SaveButton
                itemType="course"
                itemId={course.code}
                itemName={course.title}
                itemData={{
                  code: course.code,
                  title: course.title,
                  faculty: course.faculty,
                  uoc: course.uoc ? `${course.uoc} Units of Credit` : null,
                  description: course.overview,
                }}
              />
            </div>
          </div>

          {/* Overview */}
          {course.overview && (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {course.overview}
              </p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {course.uoc && (
            <InfoCard
              icon={<HiChartBar className="w-6 h-6" />}
              label="Units of Credit"
              value={`${course.uoc} UOC`}
            />
          )}

          {normalizedTerms && normalizedTerms !== "N/A" && (
            <InfoCard
              icon={<HiCalendar className="w-6 h-6" />}
              label="Offered In"
              value={normalizedTerms}
            />
          )}

          {course.field_of_education && (
            <InfoCard
              icon={<HiCollection className="w-6 h-6" />}
              label="Field of Education"
              value={course.field_of_education}
            />
          )}
        </div>

        {/* Enrolment Requirements */}
        {course.conditions_for_enrolment && (
          <Section title="Enrolment Requirements" icon={<HiClipboardList className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {course.conditions_for_enrolment}
              </p>
            </div>
          </Section>
        )}

        {/* Related Degrees */}
        <CourseRelatedDegrees
          courseId={course.id}
          courseCode={course.code}
          onNavigateDegree={goDegree}
        />
      </main>
    </div>
  );
}

// Components
function Section({ title, icon, children }) {
  return (
    <div className="mb-14">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-slate-300 dark:border-slate-700">
        <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 
                     dark:from-blue-900/20 dark:to-indigo-900/20
                     border border-slate-200 dark:border-slate-700
                     shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function Tag({ children, blue }) {
  return (
    <span
      className={`px-4 py-1.5 rounded-lg font-semibold border
        ${blue
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
        }
      `}
    >
      {children}
    </span>
  );
}

export default CourseDetailPage;
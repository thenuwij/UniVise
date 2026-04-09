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
  HiCollection,
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

  const sectionName = searchParams.get("section");

  const [course, setCourse] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [addingToProgress, setAddingToProgress] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

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
      if (error) { setLoadErr(error.message); }
      else { setCourse(data); }
    };
    fetchCourse();
    return () => { alive = false; };
  }, [courseId]);

  const handleAddToProgress = async () => {
    if (!session?.user?.id || !course || !sectionName) {
      alert("Unable to add course. Please ensure you're logged in and came from a progress section.");
      return;
    }
    setAddingToProgress(true);
    try {
      const uocNumber = course.uoc ? parseInt(course.uoc.match(/\d+/)?.[0] || 0) : 0;
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
        setTimeout(() => { navigate("/progress"); }, 1500);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
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

  const normalizedTerms = Array.isArray(course.offering_terms)
    ? course.offering_terms.join(", ")
    : typeof course.offering_terms === "string"
    ? course.offering_terms
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <main className="max-w-[1400px] mx-auto px-6 py-10">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 shadow-sm transition-all"
        >
          <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Success Message */}
        {addedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700">
            <div className="flex items-center gap-3">
              <HiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200 font-semibold text-sm">
                Course added to progress! Redirecting...
              </p>
            </div>
          </div>
        )}

        {/* Section Info Banner */}
        {sectionName && !addedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
              Adding to: <span className="font-bold">{sectionName}</span>
            </p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sky-600 dark:text-sky-400 mb-1">{course.code}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                {course.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {course.faculty && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {course.faculty}
                  </span>
                )}
                {course.school && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {course.school}
                  </span>
                )}
                {course.study_level && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                    {course.study_level}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 flex gap-3">
              {sectionName && (
                <button
                  onClick={handleAddToProgress}
                  disabled={addingToProgress || addedSuccess}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToProgress ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : addedSuccess ? (
                    <>
                      <HiCheckCircle className="w-4 h-4" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <HiAcademicCap className="w-4 h-4" />
                      <span>Add to Progress</span>
                    </>
                  )}
                </button>
              )}
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

          {course.overview && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {course.overview}
              </p>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0 space-y-0">

            {/* Enrolment Requirements */}
            {course.conditions_for_enrolment && (
              <FlatSection title="Enrolment Requirements" icon={<HiClipboardList className="w-4 h-4" />}>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {course.conditions_for_enrolment}
                  </p>
                </div>
              </FlatSection>
            )}

            {/* Related Degrees */}
            <FlatSection title="Related Programs" icon={<HiAcademicCap className="w-4 h-4" />}>
              <CourseRelatedDegrees
                courseId={course.id}
                courseCode={course.code}
              />
            </FlatSection>

          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                At a Glance
              </h3>
              <div className="space-y-3">
                {course.uoc && (
                  <StatRow icon={<HiChartBar className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="Units of Credit" value={`${course.uoc} UOC`} />
                )}
                {normalizedTerms && (
                  <StatRow icon={<HiCalendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="Offered In" value={normalizedTerms} />
                )}
                {course.field_of_education && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Field of Education</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{course.field_of_education}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function FlatSection({ title, icon, children }) {
  return (
    <div className="py-7 border-b border-slate-200 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-1.5 rounded-md bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900 dark:text-white flex-shrink-0">{value}</span>
    </div>
  );
}

export default CourseDetailPage;

// src/pages/CourseDetailPage.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  HiAcademicCap,
  HiArrowLeft,
  HiBookOpen,
  HiCalendar,
  HiChartBar,
  HiCheckCircle,
  HiClipboardList,
  HiCollection,
  HiExternalLink,
  HiSparkles,
} from "react-icons/hi";
import { useParams } from "react-router-dom";
import CourseRelatedDegrees from "../components/CourseRelatedDegrees";
import { useBackToHandbook } from "../hooks/useBackToHandbook";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { fetchCompletedCourses, setCourseCompleted } from "@/features/transfer/utils/completedCourses";
import { MYPLAN_URL, useCoursePicks } from "@/features/mindmesh/hooks/useCoursePicks";

const HANDBOOK_COURSE_URL = "https://www.handbook.unsw.edu.au";

function CourseDetailPage() {
  const { courseId } = useParams();
  const goBack = useBackToHandbook();
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const { picks } = useCoursePicks();

  const [course, setCourse] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [completedRow, setCompletedRow] = useState(null);
  const [savingCompleted, setSavingCompleted] = useState(false);

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

  useEffect(() => {
    if (!userId || !course?.code) return;
    fetchCompletedCourses(userId).then((rows) => {
      setCompletedRow(rows.find((r) => r.course_code === course.code) || null);
    });
  }, [userId, course?.code]);

  const isCompleted = !!completedRow?.is_completed;

  const handleToggleCompleted = async () => {
    if (!userId || !course) return;
    setSavingCompleted(true);
    try {
      const row = await setCourseCompleted({
        userId,
        course: { code: course.code, name: course.title, uoc: String(course.uoc ?? "").match(/\d+/)?.[0] },
        existing: completedRow,
        isCompleted: !isCompleted,
      });
      setCompletedRow(row);
      toast.success(row.is_completed ? "Marked as completed" : "Removed from completed courses");
    } catch (err) {
      console.error("Error saving course:", err);
      toast.error("Couldn't save. Please try again.");
    } finally {
      setSavingCompleted(false);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen app-page flex items-center justify-center">
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
  const pick = picks.find((p) => p.code === course.code);
  const level = course.study_level === "Postgraduate" ? "postgraduate" : "undergraduate";
  const handbookUrl = `${HANDBOOK_COURSE_URL}/${level}/courses/2026/${course.code}`;

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <main className="max-w-[1400px] mx-auto px-6 py-10">

        {/* Back */}
        <button
          onClick={goBack}
          className="group inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 shadow-sm transition-all"
        >
          <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

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
              {userId && (
                <button
                  onClick={handleToggleCompleted}
                  disabled={savingCompleted}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCompleted
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-white dark:bg-slate-800 border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  }`}
                >
                  {isCompleted ? <HiCheckCircle className="w-4 h-4" /> : <HiAcademicCap className="w-4 h-4" />}
                  <span>{isCompleted ? "Completed" : "Mark as completed"}</span>
                </button>
              )}
            </div>
          </div>

          {pick && (
            <div className="mt-6 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
                <HiSparkles className="w-4 h-4" />
                Recommended for you
              </p>
              <p className="mt-1.5 text-base text-slate-700 dark:text-slate-300">{pick.reason}</p>
              <a
                href={MYPLAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300 hover:underline"
              >
                Plan it in myPlan
                <HiExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

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

            {/* Programs that include this course */}
            <FlatSection title="Part of these programs" icon={<HiAcademicCap className="w-4 h-4" />}>
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
              </div>
              <a
                href={handbookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all"
              >
                View in the official UNSW Handbook
                <HiExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
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

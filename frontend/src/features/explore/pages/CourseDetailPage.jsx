// src/pages/CourseDetailPage.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  HiAcademicCap,
  HiBookOpen,
  HiCheckCircle,
  HiExternalLink,
  HiSparkles,
} from "react-icons/hi";
import { Link, useParams } from "react-router-dom";
import CourseRelatedDegrees from "../components/CourseRelatedDegrees";
import { useBackToHandbook } from "../hooks/useBackToHandbook";
import PageHeader from "@/shared/layout/PageHeader";
import { card } from "@/shared/ui/cardStyles";
import { DetailSection, FactRow, bandButton, bandButtonSolid } from "../components/DetailLayout";
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

      <PageHeader
        back={{ label: "Back", onClick: goBack }}
        eyebrow={[course.code, course.uoc && `${course.uoc} UOC`].filter(Boolean).join(" · ")}
        title={course.title}
        subtitle={course.school || course.faculty}
        aside={
          <div className="flex flex-wrap gap-3">
            <a href={handbookUrl} target="_blank" rel="noopener noreferrer" className={bandButton}>
              Official Handbook
              <HiExternalLink className="w-4 h-4" />
            </a>
            {userId && (
              <button
                onClick={handleToggleCompleted}
                disabled={savingCompleted}
                className={`${isCompleted ? "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-colors" : bandButtonSolid} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCompleted ? <HiCheckCircle className="w-4 h-4" /> : <HiAcademicCap className="w-4 h-4" />}
                {isCompleted ? "Completed" : "Mark as completed"}
              </button>
            )}
          </div>
        }
      />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0">
            {pick && (
              <div className="mb-8 p-5 rounded-2xl bg-pick-soft border border-amber-200 dark:border-amber-900">
                <p className="flex items-center gap-2 text-sm font-bold text-pick-ink">
                  <HiSparkles className="w-4 h-4" />
                  Recommended for you
                </p>
                <p className="mt-1.5 text-base text-ink">{pick.reason}</p>
                <a
                  href={MYPLAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-pick-ink hover:underline"
                >
                  Plan it in myPlan
                  <HiExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {course.overview && (
              <DetailSection title="About this course">
                <p className="max-w-[68ch] text-base leading-relaxed text-ink">{course.overview}</p>
              </DetailSection>
            )}

            {/* Enrolment Requirements */}
            {course.conditions_for_enrolment && (
              <DetailSection title="Before you enrol">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {course.conditions_for_enrolment}
                  </p>
                </div>
              </DetailSection>
            )}

            {/* Programs that include this course */}
            <DetailSection title="Part of these programs">
              <CourseRelatedDegrees
                courseId={course.id}
                courseCode={course.code}
              />
            </DetailSection>

          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-24">
            <div className={`${card} p-5`}>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-link mb-4">
                At a glance
              </h3>
              <div className="space-y-3">
                {course.uoc && (
                  <FactRow label="Units of credit" value={`${course.uoc} UOC`} />
                )}
                {normalizedTerms && (
                  <FactRow label="Offered in" value={normalizedTerms} />
                )}
                {course.faculty && <FactRow label="Faculty" value={course.faculty.replace(/^Faculty of\s+/i, "")} />}
                {userId && <FactRow label="Your status" value={isCompleted ? "Completed" : "Not ticked yet"} />}
              </div>
              <Link to="/coursemesh" className="button-secondary mt-5 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold">
                See it in CourseMesh
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}


export default CourseDetailPage;

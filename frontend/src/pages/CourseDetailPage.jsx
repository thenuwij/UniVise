// src/pages/CourseDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import CourseRelatedDegrees from "../components/CourseRelatedDegrees";
import SaveButton from "../components/SaveButton";
import {
  HiArrowLeft,
  HiBookOpen,
  HiAcademicCap,
  HiChartBar,
  HiCalendar,
  HiCollection,
  HiInformationCircle,
  HiClipboardList,
} from "react-icons/hi";

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Correct: use degreeId (UUID) for navigation
  const goDegree = (degreeId) => navigate(`/degrees/${degreeId}`);

  const [course, setCourse] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

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

      {/* 🔥 Full-width like degree + specialisation pages */}
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

            {/* Save Button - Top Right */}
            <div className="flex-shrink-0">
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


/* ————————————————————————————————
  COMPONENTS
——————————————————————————————— */

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

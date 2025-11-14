// src/pages/CourseDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import CourseRelatedDegrees from "../components/CourseRelatedDegrees";
import {
  HiArrowLeft,
  HiBookOpen,
  HiAcademicCap,
  HiClock,
  HiOfficeBuilding,
  HiClipboardList,
  HiInformationCircle,
  HiChartBar,
  HiCalendar,
  HiCollection,
} from "react-icons/hi";

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300/80 to-slate-400/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <HiBookOpen className="w-12 h-12 text-slate-400 animate-pulse" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            {loadErr ? `Error: ${loadErr}` : "Loading course details..."}
          </p>
        </div>
      </div>
    );
  }

  const normalizedTerms = Array.isArray(course?.offering_terms)
    ? course.offering_terms.join(", ")
    : (typeof course?.offering_terms === "string" ? course.offering_terms : "N/A");

  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300/80 to-slate-400/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Back Button */}
        <button
          onClick={goBack}
          className="group flex items-center gap-2 mb-8 px-4 py-2 rounded-xl
                   bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600
                   text-slate-700 dark:text-slate-300 font-semibold
                   hover:bg-slate-50 dark:hover:bg-slate-800
                   shadow-md hover:shadow-lg transition-all duration-200"
        >
          <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Back to Search</span>
        </button>

        {/* Header Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-600 
                      shadow-2xl p-8 mb-8 ring-1 ring-slate-400/20 dark:ring-slate-500/20">
          <div className="flex items-start gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 
                          dark:from-blue-900/30 dark:to-indigo-900/30 shadow-md">
              <HiBookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-800 dark:text-blue-400 mb-3 leading-tight">
                {course.code}
              </h1>
              <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 font-semibold mb-4">
                {course.title}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {course.faculty && (
                  <span className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 
                                 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                    {course.faculty}
                  </span>
                )}
                {course.school && (
                  <span className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 
                                 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                    {course.school}
                  </span>
                )}
                {course.study_level && (
                  <span className="px-4 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 
                                 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-700">
                    {course.study_level}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {course.uoc && (
            <InfoCard
              icon={<HiChartBar className="w-6 h-6" />}
              label="Units of Credit"
              value={course.uoc}
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

        {/* Course Overview */}
        {course.overview && (
          <Section title="Course Overview" icon={<HiInformationCircle className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {course.overview}
              </p>
            </div>
          </Section>
        )}

        {/* Conditions for Enrolment */}
        {course.conditions_for_enrolment && (
          <Section title="Enrolment Requirements" icon={<HiClipboardList className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {course.conditions_for_enrolment}
              </p>
            </div>
          </Section>
        )}

        {/* Related Degrees */}
        <Section title="Programs Offering This Course" icon={<HiAcademicCap className="w-6 h-6" />}>
          <CourseRelatedDegrees
            courseId={course?.id}
            courseCode={course?.code}
            onNavigateDegree={goDegree}
          />
        </Section>

      </main>
    </div>
  );
}

// Helper Components
function Section({ title, icon, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-300 dark:border-slate-600">
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
    <div className="p-5 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 
                   dark:bg-gradient-to-br dark:from-blue-900/30 dark:to-sky-900/30
                   border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-slate-700 dark:text-slate-300">
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default CourseDetailPage;
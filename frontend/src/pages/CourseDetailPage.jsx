// src/pages/CourseDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import AddToMeshButton from "../components/mindmesh/AddToMeshButton";
import CourseRelatedDegrees from "../components/CourseRelatedDegrees";

function CourseDetailPage() {
  const { courseId } = useParams(); // Course UUID
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
      <div className="p-6 text-center text-gray-400 text-lg">
        {loadErr ? `Error: ${loadErr}` : "Loading course details..."}
      </div>
    );
  }

  // ---- Derived fields / normalizers ----
  const levelTag = (() => {
    const m = String(course?.code || "").match(/\d{4}/); // e.g. COMP2511 -> "2511"
    return m ? `level-${m[0][0]}` : "level-x"; // "2" -> level-2
  })();

  const normalizedTerms = Array.isArray(course?.offering_terms)
    ? course.offering_terms.join(", ")
    : (typeof course?.offering_terms === "string" ? course.offering_terms : "N/A");

  // ---- Quick nav handlers ----
  const goBack = () => navigate(-1);
  const goExploreDegrees = () => navigate("/explore-by-degree");
  const goExploreMajors = () => navigate("/explore-by-major");
  const goExploreCourses = () => navigate("/explore-by-course");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Static sidebar (leave as-is if this is your current layout) */}
      <MenuBar />

      <div className="flex flex-col flex-1">
        {/* Top bar */}
        <DashboardNavBar onMenuClick={openDrawer} />
        {/* Drawer for mobile */}
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

        <main className="flex-1 overflow-y-auto px-8 py-14">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">

            {/* LEFT SECTION */}
            <div className="flex-1 space-y-10">
              {/* Top Back Button */}
              <div>
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm text-sm"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" className="opacity-80">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
              </div>

              {/* Header */}
              <header className="pb-6 border-b border-gray-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-5xl font-bold tracking-tight mb-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-transparent bg-clip-text break-words">
                      {course.code}: {course.title}
                    </h1>
                    <p className="text-sky-700 text-lg">
                      {course.faculty ?? "—"}
                      {course.school ? <span className="ml-2 text-sky-600/80">• {course.school}</span> : null}
                    </p>
                  </div>

                  {/* Add to MindMesh */}
                  <AddToMeshButton
                    itemType="course"
                    itemKey={course?.code}
                    title={course?.title}
                    sourceTable="unsw_courses"
                    sourceId={course?.id}
                    tags={["course", levelTag]}
                    metadata={{
                      uoc: course?.uoc ?? null,
                      term: normalizedTerms,
                      study_level: course?.study_level ?? null,
                    }}
                    className="shrink-0"
                  />
                </div>
              </header>

              {/* Course Overview */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-3">Course Overview</h2>
                <div className="bg-white p-6 rounded-3xl shadow border border-gray-200">
                  <p className="text-base text-gray-700 leading-relaxed">
                    {course.overview || "No overview provided."}
                  </p>
                </div>
              </section>

              {/* Conditions for Enrolment */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-3">Conditions for Enrolment</h2>
                <div className="bg-white p-6 rounded-3xl shadow border border-gray-200">
                  <p className="text-base text-gray-700">
                    {course.conditions_for_enrolment || "None listed."}
                  </p>
                </div>
              </section>
              {/* Related Degrees */}
              <section>
                <CourseRelatedDegrees
                  courseId={course?.id}
                  courseCode={course?.code}
                  onNavigateDegree={goDegree}
                />
              </section>
            </div>


            {/* RIGHT SECTION – Key Information + Explore More */}
            <aside className="w-full lg:w-96">
              <div className="bg-white h-full min-h-[520px] p-6 rounded-3xl shadow border border-gray-200 flex flex-col">
                <h2 className="text-2xl font-semibold text-slate-800 mb-6">Key Information</h2>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {[
                    { label: "UOC", value: course?.uoc ?? "N/A" },
                    { label: "Faculty", value: course?.faculty ?? "N/A" },
                    { label: "School", value: course?.school ?? "N/A" },
                    { label: "Study Level", value: course?.study_level ?? "N/A" },
                    { label: "Offered In", value: normalizedTerms },
                    { label: "Field of Education", value: course?.field_of_education ?? "N/A" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{item.label}</div>
                      <div className="text-base font-semibold text-slate-800">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Explore More Actions */}
                <div className="mt-auto">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Explore more</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={goExploreDegrees}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-sm text-sm font-medium"
                    >
                      Add more degrees
                    </button>
                    <button
                      onClick={goExploreMajors}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-sm text-sm font-medium"
                    >
                      Add more majors
                    </button>
                    <button
                      onClick={goExploreCourses}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-sm text-sm font-medium"
                    >
                      Add more courses
                    </button>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </main>
      </div>
    </div>
  );
}

export default CourseDetailPage;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

function CourseDetailPage() {
  const { courseId } = useParams(); // Course UUID
  const [course, setCourse] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("unsw_courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) {
        console.error("Failed to fetch course:", error.message);
      } else {
        setCourse(data);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (!course) {
    return (
      <div className="p-6 text-center text-gray-400 text-lg">
        Loading course details...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <MenuBar />
      <div className="flex flex-col flex-1">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
        <main className="flex-1 overflow-y-auto px-8 py-14">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">

            {/* LEFT SECTION */}
            <div className="flex-1 space-y-10">
              <header className="pb-6 border-b border-gray-300">
                <h1 className="text-5xl font-bold tracking-tight mb-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-transparent bg-clip-text">
                  {course.code}: {course.title}
                </h1>
                <p className="text-sky-700 text-lg">{course.faculty}</p>
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
            </div>

            {/* RIGHT SECTION – Key Information */}
            <aside className="w-full lg:w-96">
              <div className="bg-white h-full min-h-[520px] p-6 rounded-3xl shadow border border-gray-200">
                <h2 className="text-2xl font-semibold text-slate-800 mb-6">Key Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: "UOC", value: `${course.uoc} Units of Credit` },
                    { label: "Faculty", value: course.faculty },
                    { label: "School", value: course.school },
                    { label: "Study Level", value: course.study_level },
                    { label: "Offered In", value: course.offering_terms },
                    { label: "Field of Education", value: course.field_of_education },
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
              </div>
            </aside>

          </div>
        </main>
      </div>
    </div>
  );
}

export default CourseDetailPage;

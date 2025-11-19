// src/pages/MinorDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SaveButton from "../components/SaveButton";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

import {
  HiArrowLeft,
  HiAcademicCap,
  HiInformationCircle,
  HiChartBar,
  HiBookOpen,
  HiDocumentText,
} from "react-icons/hi";

function MinorDetailPage() {
  const { id } = useParams(); // specialisation row UUID
  const navigate = useNavigate();

  const [minor, setMinor] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

  // lookup maps
  const [degreeDetailsByCode, setDegreeDetailsByCode] = useState({});
  const [courseDetailsByCode, setCourseDetailsByCode] = useState({});

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // ───────────────────────────────────────────
  // 1. Fetch minor specialisation
  // ───────────────────────────────────────────
  useEffect(() => {
    let alive = true;

    const fetchMinor = async () => {
      setLoadErr(null);

      const { data, error } = await supabase
        .from("unsw_specialisations")
        .select("*")
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error) {
        setLoadErr(error.message);
        return;
      }

      let parsedSections = [];
      let parsedDegrees = [];

      try {
        parsedSections =
          typeof data.sections === "string"
            ? JSON.parse(data.sections)
            : data.sections || [];
      } catch {
        parsedSections = [];
      }

      try {
        parsedDegrees =
          typeof data.sections_degrees === "string"
            ? JSON.parse(data.sections_degrees)
            : data.sections_degrees || [];
      } catch {
        parsedDegrees = [];
      }

      setMinor({
        ...data,
        sections: parsedSections,
        related_degrees: parsedDegrees,
      });
    };

    fetchMinor();
    return () => {
      alive = false;
    };
  }, [id]);

  // ───────────────────────────────────────────
  // 2. Fetch degree + course metadata
  // ───────────────────────────────────────────
  useEffect(() => {
    if (!minor) return;

    const fetchMeta = async () => {
      try {
        // === DEGREE METADATA ===
        if (minor.related_degrees?.length > 0) {
          const degreeCodes = Array.from(
            new Set(
              minor.related_degrees.map((d) => d.degree_code).filter(Boolean)
            )
          );

          if (degreeCodes.length > 0) {
            const { data: degreesData } = await supabase
              .from("unsw_degrees_final")
              .select("id, degree_code, program_name, faculty, minimum_uoc")
              .in("degree_code", degreeCodes);

            const map = {};
            (degreesData || []).forEach((deg) => {
              map[deg.degree_code] = deg;
            });
            setDegreeDetailsByCode(map);
          }
        }

        // === COURSE METADATA ===
        if (minor.sections?.length > 0) {
          const allCodes = new Set();
          minor.sections.forEach((sec) => {
            (sec.courses || []).forEach((c) => c.code && allCodes.add(c.code));
          });

          const list = Array.from(allCodes);

          if (list.length > 0) {
            const { data: courseData } = await supabase
              .from("unsw_courses")
              .select("id, code, title, faculty")
              .in("code", list);

            const cmap = {};
            (courseData || []).forEach((c) => {
              cmap[c.code] = c;
            });
            setCourseDetailsByCode(cmap);
          }
        }
      } catch (err) {
        console.error("Metadata fetch error:", err.message);
      }
    };

    fetchMeta();
  }, [minor]);

  // ───────────────────────────────────────────

  if (!minor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-950 dark:to-slate-900">
        <p className="text-slate-600 dark:text-slate-300">
          {loadErr ? `Error: ${loadErr}` : "Loading minor..."}
        </p>
      </div>
    );
  }

  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 to-slate-400/40 dark:from-slate-950 dark:to-slate-900">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <main className="max-w-[1600px] mx-auto px-6 py-16">

        {/* BACK BUTTON */}
        <button
          onClick={goBack}
          className="group flex items-center gap-2 mb-10 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 
                     border-2 border-slate-300 dark:border-slate-600 shadow-md hover:shadow-lg transition-all"
        >
          <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* HEADER CARD */}
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-2xl p-10 mb-12">

          {/* TOP RIGHT TAGS */}
          <div className="absolute top-6 right-6 flex flex-wrap gap-4">
            {minor.specialisation_type && (
              <span className="px-6 py-2 text-base font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200">
                {minor.specialisation_type}
              </span>
            )}

            {minor.faculty && (
              <span className="px-6 py-2 text-base font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {minor.faculty}
              </span>
            )}

            {minor.major_code && (
              <span className="px-6 py-2 text-base font-bold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                Code: {minor.major_code}
              </span>
            )}
          </div>

          {/* SAVE BUTTON - Below tags */}
          <div className="absolute top-20 right-6">
            <SaveButton
              itemType="specialisation"
              itemId={id}
              itemName={minor.major_name}
              itemData={{
                major_code: minor.major_code,
                major_name: minor.major_name,
                specialisation_type: minor.specialisation_type,
                faculty: minor.faculty,
                uoc_required: minor.uoc_required,
              }}
            />
          </div>

          {/* NAME + ICON */}
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 shadow-md">
              <HiAcademicCap className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              {minor.major_name}
            </h1>
          </div>

          {/* OVERVIEW */}
          {minor.overview_description && (
            <div className="mt-8 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {minor.overview_description}
              </p>
            </div>
          )}
        </div>

        {/* UOC */}
        {minor.uoc_required && (
          <Section title="Credit Requirements" icon={<HiChartBar className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700">
              <p className="text-lg font-bold">{minor.uoc_required}</p>
            </div>
          </Section>
        )}

        {/* NOTES */}
        {minor.special_notes && minor.special_notes !== "Not specified" && (
          <Section title="Important Notes" icon={<HiInformationCircle className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
              <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                {minor.special_notes}
              </p>
            </div>
          </Section>
        )}

        {/* STRUCTURE + COURSES */}
        {minor.sections?.length > 0 && (
          <Section title="Minor Structure" icon={<HiBookOpen className="w-6 h-6" />}>
            <div className="space-y-6">
              {minor.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold">{section.title}</h3>
                    {section.uoc && (
                      <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold">
                        {section.uoc} UOC
                      </span>
                    )}
                  </div>

                  {section.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {section.description}
                    </p>
                  )}

                  {/* Course List */}
                  {section.courses?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {section.courses.map((course, ci) => {
                        const meta = courseDetailsByCode[course.code];
                        const link = meta ? `/course/${meta.id}` : null;

                        const card = (
                          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                              {course.code}
                            </p>
                            <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                              {course.name}
                            </p>
                          </div>
                        );

                        return link ? (
                          <Link key={ci} to={link} className="hover:-translate-y-1 hover:shadow-xl transition-all rounded-xl">
                            {card}
                          </Link>
                        ) : (
                          <div key={ci}>{card}</div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* RELATED DEGREES */}
        {minor.related_degrees?.length > 0 && (
          <Section title="Programs Offering This Minor" icon={<HiAcademicCap className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {minor.related_degrees.map((deg, i) => {
                const mapped = degreeDetailsByCode[deg.degree_code];
                const link = mapped?.id ? `/degrees/${mapped.id}` : null;

                const programName = mapped?.program_name || deg.program_name;
                const degree_code = deg.degree_code;
                const faculty = mapped?.faculty;
                const minUoc = mapped?.minimum_uoc;

                const card = (
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md">
                    <p className="text-lg font-bold mb-2">{programName}</p>

                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                        Code: {degree_code}
                      </span>

                      {faculty && (
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {faculty}
                        </span>
                      )}

                      {minUoc && (
                        <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          {minUoc} UOC
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      View full program structure →
                    </p>
                  </div>
                );

                return link ? (
                  <Link
                    key={i}
                    to={link}
                    className="hover:-translate-y-1 hover:shadow-xl transition-all rounded-2xl"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={i} className="opacity-50 cursor-not-allowed rounded-2xl">
                    {card}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* HANDBOOK LINK */}
        {minor.source_url && (
          <div className="mt-12 text-center">
            <a
              href={minor.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 shadow-md hover:shadow-xl transition-all"
            >
              <HiDocumentText className="w-5 h-5" />
              View Official Handbook
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

// ───────────────────────────────────────────
// SECTION WRAPPER
// ───────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div className="mb-14">
      <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-300 dark:border-slate-700 pb-2">
        <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
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

export default MinorDetailPage;

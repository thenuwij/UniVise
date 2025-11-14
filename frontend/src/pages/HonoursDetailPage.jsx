// src/pages/HonoursDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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

function HonoursDetailPage() {
  const { id } = useParams(); // specialisation row UUID
  const navigate = useNavigate();

  const [honours, setHonours] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

  // lookup maps
  const [degreeDetailsByCode, setDegreeDetailsByCode] = useState({});
  const [courseDetailsByCode, setCourseDetailsByCode] = useState({});

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // ───────────────────────────────────────────
  // 1. Fetch honours specialisation
  // ───────────────────────────────────────────
  useEffect(() => {
    let alive = true;

    const fetchHonours = async () => {
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

      setHonours({
        ...data,
        sections: parsedSections,
        related_degrees: parsedDegrees,
      });
    };

    fetchHonours();
    return () => {
      alive = false;
    };
  }, [id]);

  // ───────────────────────────────────────────
  // 2. Fetch degree + course metadata
  // ───────────────────────────────────────────
  useEffect(() => {
    if (!honours) return;

    const fetchMeta = async () => {
      try {
        // DEGREE METADATA
        if (honours.related_degrees?.length > 0) {
          const degreeCodes = Array.from(
            new Set(
              honours.related_degrees.map((d) => d.degree_code).filter(Boolean)
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

        // COURSE METADATA
        if (honours.sections?.length > 0) {
          const allCodes = new Set();
          honours.sections.forEach((sec) => {
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
  }, [honours]);

  // ───────────────────────────────────────────

  if (!honours) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-950 dark:to-slate-900">
        <p className="text-slate-600 dark:text-slate-300">
          {loadErr ? `Error: ${loadErr}` : "Loading honours specialisation..."}
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

        {/* BACK */}
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
            {honours.specialisation_type && (
              <span className="px-6 py-2 text-base font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200">
                {honours.specialisation_type}
              </span>
            )}

            {honours.faculty && (
              <span className="px-6 py-2 text-base font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {honours.faculty}
              </span>
            )}

            {honours.major_code && (
              <span className="px-6 py-2 text-base font-bold rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg">
                Code: {honours.major_code}
              </span>
            )}
          </div>

          {/* NAME + ICON */}
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 shadow-md">
              <HiAcademicCap className="w-12 h-12 text-purple-600 dark:text-purple-300" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              {honours.major_name}
            </h1>
          </div>

          {/* OVERVIEW */}
          {honours.overview_description && (
            <div className="mt-8 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {honours.overview_description}
              </p>
            </div>
          )}
        </div>

        {/* UOC */}
        {honours.uoc_required && (
          <Section title="Credit Requirements" icon={<HiChartBar className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700">
              <p className="text-lg font-bold">{honours.uoc_required}</p>
            </div>
          </Section>
        )}

        {/* NOTES */}
        {honours.special_notes && honours.special_notes !== "Not specified" && (
          <Section title="Important Notes" icon={<HiInformationCircle className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
              <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                {honours.special_notes}
              </p>
            </div>
          </Section>
        )}

        {/* STRUCTURE */}
        {honours.sections?.length > 0 && (
          <Section title="Honours Structure" icon={<HiBookOpen className="w-6 h-6" />}>
            <div className="space-y-6">
              {honours.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold">{section.title}</h3>
                    {section.uoc && (
                      <span className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold">
                        {section.uoc} UOC
                      </span>
                    )}
                  </div>

                  {section.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-line">
                      {section.description}
                    </p>
                  )}

                  {/* Course Cards */}
                  {section.courses?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {section.courses.map((course, ci) => {
                        const meta = courseDetailsByCode[course.code];
                        const link = meta ? `/course/${meta.id}` : null;

                        const card = (
                          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
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
        {honours.related_degrees?.length > 0 && (
          <Section title="Programs Offering This Honours Stream" icon={<HiAcademicCap className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {honours.related_degrees.map((deg, i) => {
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
                      <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
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
                  <Link key={i} to={link} className="hover:-translate-y-1 hover:shadow-xl transition-all rounded-2xl">
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
        {honours.source_url && (
          <div className="mt-12 text-center">
            <a
              href={honours.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 
              border-2 border-slate-300 dark:border-slate-600 shadow-md hover:shadow-xl transition-all"
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

export default HonoursDetailPage;

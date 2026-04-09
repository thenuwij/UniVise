// src/pages/MinorDetailPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import SaveButton from "../components/SaveButton";
import { supabase } from "../supabaseClient";

import {
  HiAcademicCap,
  HiArrowLeft,
  HiBookOpen,
  HiChartBar,
  HiCollection,
  HiDocumentText,
  HiExternalLink,
  HiInformationCircle,
} from "react-icons/hi";

function MinorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [minor, setMinor] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [degreeDetailsByCode, setDegreeDetailsByCode] = useState({});
  const [courseDetailsByCode, setCourseDetailsByCode] = useState({});

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
      if (error) { setLoadErr(error.message); return; }

      let parsedSections = [];
      let parsedDegrees = [];
      try { parsedSections = typeof data.sections === "string" ? JSON.parse(data.sections) : data.sections || []; } catch {}
      try { parsedDegrees = typeof data.sections_degrees === "string" ? JSON.parse(data.sections_degrees) : data.sections_degrees || []; } catch {}

      setMinor({ ...data, sections: parsedSections, related_degrees: parsedDegrees });
    };
    fetchMinor();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!minor) return;
    const fetchMeta = async () => {
      try {
        if (minor.related_degrees?.length > 0) {
          const degreeCodes = Array.from(new Set(minor.related_degrees.map((d) => d.degree_code).filter(Boolean)));
          if (degreeCodes.length > 0) {
            const { data: degreesData } = await supabase
              .from("unsw_degrees_final")
              .select("id, degree_code, program_name, faculty, minimum_uoc")
              .in("degree_code", degreeCodes);
            const map = {};
            (degreesData || []).forEach((deg) => { map[deg.degree_code] = deg; });
            setDegreeDetailsByCode(map);
          }
        }
        if (minor.sections?.length > 0) {
          const allCodes = new Set();
          minor.sections.forEach((sec) => { (sec.courses || []).forEach((c) => c.code && allCodes.add(c.code)); });
          const list = Array.from(allCodes);
          if (list.length > 0) {
            const { data: courseData } = await supabase
              .from("unsw_courses")
              .select("id, code, title, faculty")
              .in("code", list);
            const cmap = {};
            (courseData || []).forEach((c) => { cmap[c.code] = c; });
            setCourseDetailsByCode(cmap);
          }
        }
      } catch (err) { console.error("Metadata fetch error:", err.message); }
    };
    fetchMeta();
  }, [minor]);

  if (!minor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <HiAcademicCap className="w-12 h-12 text-slate-400 animate-pulse" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            {loadErr ? `Error: ${loadErr}` : "Loading minor..."}
          </p>
        </div>
      </div>
    );
  }

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

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                {minor.major_name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {minor.faculty && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {minor.faculty}
                  </span>
                )}
                {minor.major_code && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700">
                    {minor.major_code}
                  </span>
                )}
                {minor.specialisation_type && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                    {minor.specialisation_type}
                  </span>
                )}
              </div>
            </div>
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

          {minor.overview_description && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {minor.overview_description}
              </p>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0 space-y-0">

            {/* Minor Structure */}
            {minor.sections?.length > 0 && (
              <FlatSection title="Minor Structure" icon={<HiBookOpen className="w-4 h-4" />}>
                <div className="space-y-8">
                  {minor.sections.map((section, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{section.title}</h3>
                        {section.uoc && (
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-bold flex-shrink-0">
                            {section.uoc} UOC
                          </span>
                        )}
                      </div>
                      {section.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{section.description}</p>
                      )}
                      {section.courses?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {section.courses.map((course, ci) => {
                            const meta = courseDetailsByCode[course.code];
                            const link = meta ? `/course/${meta.id}` : null;
                            const row = (
                              <div className="flex items-center justify-between gap-3 py-3.5 px-4 rounded-xl bg-gradient-to-br from-white to-sky-50/60 dark:from-slate-800/70 dark:to-sky-900/20 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:from-sky-50 hover:to-sky-100/60 hover:shadow-sm dark:hover:from-slate-800 dark:hover:to-sky-900/30 transition-all cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-sm font-bold text-sky-700 dark:text-sky-400 flex-shrink-0">{course.code}</span>
                                  <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{course.name}</span>
                                </div>
                              </div>
                            );
                            return link ? (
                              <Link key={ci} to={link}>{row}</Link>
                            ) : (
                              <div key={ci}>{row}</div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </FlatSection>
            )}

            {/* Related Degrees */}
            {minor.related_degrees?.length > 0 && (
              <FlatSection title="Programs Offering This Minor" icon={<HiAcademicCap className="w-4 h-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {minor.related_degrees.map((deg, i) => {
                    const mapped = degreeDetailsByCode[deg.degree_code];
                    const link = mapped?.id ? `/degrees/${mapped.id}` : null;
                    const programName = mapped?.program_name || deg.program_name;
                    const degree_code = deg.degree_code;
                    const faculty = mapped?.faculty;

                    const card = (
                      <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl bg-gradient-to-br from-white to-sky-50/40 dark:from-slate-800/60 dark:to-sky-900/10 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:to-sky-50/80 dark:hover:from-slate-800 transition-all">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{programName}</p>
                          {faculty && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{faculty}</p>}
                        </div>
                        {degree_code && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 flex-shrink-0">
                            {degree_code}
                          </span>
                        )}
                      </div>
                    );

                    return link ? (
                      <Link key={i} to={link}>{card}</Link>
                    ) : (
                      <div key={i} className="opacity-50 cursor-not-allowed">{card}</div>
                    );
                  })}
                </div>
              </FlatSection>
            )}

            {/* Important Notes */}
            {minor.special_notes && minor.special_notes !== "Not specified" && (
              <FlatSection title="Important Notes" icon={<HiInformationCircle className="w-4 h-4" />}>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                    {minor.special_notes}
                  </p>
                </div>
              </FlatSection>
            )}

            {/* Handbook link */}
            {minor.source_url && (
              <div className="py-7">
                <a
                  href={minor.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all"
                >
                  <HiDocumentText className="w-4 h-4" />
                  View Official UNSW Handbook
                  <HiExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            )}
          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                At a Glance
              </h3>
              <div className="space-y-3">
                {minor.specialisation_type && (
                  <StatRow icon={<HiCollection className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="Type" value={minor.specialisation_type} />
                )}
                {minor.uoc_required && (
                  <StatRow icon={<HiChartBar className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="UOC Required" value={minor.uoc_required} />
                )}
                {minor.major_code && (
                  <StatRow icon={<HiDocumentText className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="Code" value={minor.major_code} />
                )}
                {minor.faculty && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Faculty</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{minor.faculty}</p>
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

export default MinorDetailPage;

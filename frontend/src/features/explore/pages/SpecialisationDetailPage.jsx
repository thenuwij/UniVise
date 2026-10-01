// src/pages/SpecialisationDetailPage.jsx
// Shared detail view for majors, minors and honours streams. All three read the
// same unsw_specialisations row and differ only in labelling and accent colour.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import { supabase } from "@/shared/lib/supabase";
import { useBackToHandbook } from "../hooks/useBackToHandbook";
import DetailLoading from "../components/DetailLoading";
import PageHeader from "@/shared/layout/PageHeader";
import { card } from "@/shared/ui/cardStyles";
import { DetailSection, FactRow, bandButton, courseTile } from "../components/DetailLayout";

import {
  HiExternalLink,
} from "react-icons/hi";

const VARIANTS = {
  major: {
    loadingLabel: "major",
    structureTitle: "Structure",
    relatedTitle: "Programs offering this major",
    preserveSectionWhitespace: false,
  },
  minor: {
    loadingLabel: "minor",
    structureTitle: "Structure",
    relatedTitle: "Programs offering this minor",
    preserveSectionWhitespace: false,
  },
  honours: {
    loadingLabel: "honours specialisation",
    structureTitle: "Structure",
    relatedTitle: "Programs offering this honours stream",
    preserveSectionWhitespace: true,
  },
};

function SpecialisationDetailPage({ variant = "major" }) {
  const config = VARIANTS[variant] ?? VARIANTS.major;
  const { id } = useParams();
  const goBack = useBackToHandbook();
  const [spec, setSpec] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [degreeDetailsByCode, setDegreeDetailsByCode] = useState({});
  const [courseDetailsByCode, setCourseDetailsByCode] = useState({});

  useEffect(() => {
    let alive = true;
    const fetchSpecialisation = async () => {
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
      try {
        parsedSections = typeof data.sections === "string" ? JSON.parse(data.sections) : data.sections || [];
      } catch (err) {
        console.warn("Failed to parse sections", err);
      }
      try {
        parsedDegrees = typeof data.sections_degrees === "string" ? JSON.parse(data.sections_degrees) : data.sections_degrees || [];
      } catch (err) {
        console.warn("Failed to parse related degrees", err);
      }

      setSpec({ ...data, sections: parsedSections, related_degrees: parsedDegrees });
    };
    fetchSpecialisation();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!spec) return;
    const fetchMeta = async () => {
      try {
        if (spec.related_degrees?.length > 0) {
          const degreeCodes = Array.from(new Set(spec.related_degrees.map((d) => d.degree_code).filter(Boolean)));
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
        if (spec.sections?.length > 0) {
          const allCodes = new Set();
          spec.sections.forEach((sec) => { (sec.courses || []).forEach((c) => c.code && allCodes.add(c.code)); });
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
  }, [spec]);

  if (!spec) return <DetailLoading failed={!!loadErr} what={config.loadingLabel} />;

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <PageHeader
        back={{ label: "Back", onClick: goBack }}
        eyebrow={[spec.specialisation_type, spec.major_code].filter(Boolean).join(" · ")}
        title={spec.major_name}
        subtitle={spec.faculty}
        aside={
          spec.source_url ? (
            <a href={spec.source_url} target="_blank" rel="noopener noreferrer" className={bandButton}>
              Official Handbook
              <HiExternalLink className="w-4 h-4" />
            </a>
          ) : null
        }
      />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0">
            {spec.overview_description && (
              <DetailSection title="Overview">
                <p className="max-w-[68ch] text-base leading-relaxed text-ink whitespace-pre-line">{spec.overview_description}</p>
              </DetailSection>
            )}


            {/* Structure */}
            {spec.sections?.length > 0 && (
              <DetailSection title={config.structureTitle}>
                <div className="space-y-8">
                  {spec.sections.map((section, idx) => (
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
                        <p className={`text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed${config.preserveSectionWhitespace ? " whitespace-pre-line" : ""}`}>
                          {section.description}
                        </p>
                      )}
                      {section.courses?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {section.courses.map((course, ci) => {
                            const meta = courseDetailsByCode[course.code];
                            const link = meta ? `/course/${meta.id}` : null;
                            const row = (
                              <div className={courseTile}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-sm font-bold text-link flex-shrink-0">{course.code}</span>
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
              </DetailSection>
            )}

            {/* Related Degrees */}
            {spec.related_degrees?.length > 0 && (
              <DetailSection title={config.relatedTitle}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {spec.related_degrees.map((deg, i) => {
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
              </DetailSection>
            )}

            {/* Important Notes */}
            {spec.special_notes && spec.special_notes !== "Not specified" && (
              <DetailSection title="Important notes">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                    {spec.special_notes}
                  </p>
                </div>
              </DetailSection>
            )}

          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-24">
            <div className={`${card} p-5`}>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-link mb-4">
                At a glance
              </h3>
              <div className="space-y-3">
                {spec.specialisation_type && (
                  <FactRow label="Type" value={spec.specialisation_type} />
                )}
                {spec.uoc_required && (
                  <FactRow label="UOC required" value={spec.uoc_required} />
                )}
                {spec.major_code && (
                  <FactRow label="Code" value={spec.major_code} />
                )}
                {spec.faculty && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Faculty</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{spec.faculty}</p>
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


export default SpecialisationDetailPage;

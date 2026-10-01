// src/pages/DegreeDetailPage.jsx
import { useEffect, useState } from "react";
import {
  HiArrowRight,
  HiExternalLink,
} from "react-icons/hi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import { supabase } from "@/shared/lib/supabase";
import { useBackToHandbook } from "../hooks/useBackToHandbook";
import FormattedText from "@/shared/ui/FormattedText";
import { formatDuration, hasContent } from "@/shared/lib/format";
import DetailLoading from "../components/DetailLoading";
import PageHeader from "@/shared/layout/PageHeader";
import { card } from "@/shared/ui/cardStyles";
import { DetailSection, FactRow, bandButton, bandButtonSolid, courseTile } from "../components/DetailLayout";

function DegreeDetailPage() {
  const { degreeId } = useParams();
  const navigate = useNavigate();
  const goBack = useBackToHandbook();

  const [degree, setDegree] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [courseIdByCode, setCourseIdByCode] = useState({});

  useEffect(() => {
    let alive = true;
    const fetchDegreeData = async () => {
      setLoadErr(null);
      const { data: deg, error: dErr } = await supabase
        .from("unsw_degrees_final")
        .select("*")
        .eq("id", degreeId)
        .single();

      if (!alive) return;
      if (dErr) { setLoadErr(dErr.message); return; }

      const parsedCareerOutcomes = (() => {
        try {
          if (!deg?.career_outcomes) return [];
          return deg.career_outcomes.startsWith("[")
            ? JSON.parse(deg.career_outcomes)
            : String(deg.career_outcomes).split(",").map((s) => s.trim()).filter(Boolean);
        } catch { return []; }
      })();

      let parsedSections = [];
      try {
        if (deg?.sections) {
          parsedSections = typeof deg.sections === "string" ? JSON.parse(deg.sections) : deg.sections;
        }
      } catch (err) {
        console.warn("Failed to parse degree sections", err);
      }

      setDegree({ ...deg, career_outcomes: parsedCareerOutcomes, sections: parsedSections });
    };

    fetchDegreeData();
    return () => { alive = false; };
  }, [degreeId]);

  useEffect(() => {
    if (!degree?.sections?.length) return;
    const allCodes = new Set();
    degree.sections.forEach((sec) => {
      (sec.courses || []).forEach((c) => c.code && allCodes.add(c.code));
    });
    const codes = Array.from(allCodes);
    if (!codes.length) return;
    supabase
      .from("unsw_courses")
      .select("id, code")
      .in("code", codes)
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach((c) => { map[c.code] = c.id; });
        setCourseIdByCode(map);
      });
  }, [degree]);

  if (!degree) return <DetailLoading failed={!!loadErr} what="degree" />;

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <PageHeader
        back={{ label: "Back", onClick: goBack }}
        eyebrow={[degree.degree_code, degree.level].filter(Boolean).join(" · ")}
        title={degree.program_name}
        subtitle={[degree.faculty, degree.other_faculty].filter(Boolean).join(" · ")}
        aside={
          <div className="flex flex-wrap gap-3">
            {degree.source_url && (
              <a href={degree.source_url} target="_blank" rel="noopener noreferrer" className={bandButton}>
                Official Handbook
                <HiExternalLink className="w-4 h-4" />
              </a>
            )}
            <button onClick={() => navigate(`/roadmap?program=${degree.degree_code}`)} className={`group ${bandButtonSolid}`}>
              View this degree's roadmap
              <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        }
      />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0">
            {hasContent(degree.overview_description) && (
              <DetailSection title="Overview">
                <FormattedText text={degree.overview_description} />
              </DetailSection>
            )}

            {/* Program Structure */}
            {hasContent(degree.program_structure) && (
              <DetailSection title="Program structure">
                <FormattedText text={degree.program_structure} />
              </DetailSection>
            )}

            {/* Detailed Requirements */}
            {degree.sections && degree.sections.length > 0 && (
              <DetailSection title="Requirements">
                <div className="space-y-6">
                  {degree.sections.map((section, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{section.title}</h3>
                        {section.uoc && (
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-bold">
                            {section.uoc} UOC
                          </span>
                        )}
                      </div>
                      {hasContent(section.description) && (
                        <div className="mb-3">
                          <FormattedText text={section.description} collapsedHeight="7rem" className="text-sm text-ink-muted" />
                        </div>
                      )}
                      {hasContent(section.notes) && (
                        <div className="mb-3 p-3 rounded-xl bg-pick-soft">
                          <FormattedText text={`Note: ${section.notes}`} collapsedHeight={null} className="text-sm text-pick-ink" />
                        </div>
                      )}
                      {section.courses?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {section.courses.map((course, cIdx) => {
                            const courseId = courseIdByCode[course.code];
                            const card = (
                              <div className={courseTile}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-sm font-bold text-link flex-shrink-0">{course.code}</span>
                                  <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{course.name}</span>
                                </div>
                                {course.uoc > 0 && (
                                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30">{course.uoc} UOC</span>
                                )}
                              </div>
                            );
                            return courseId ? (
                              <Link key={cIdx} to={`/course/${courseId}`}>{card}</Link>
                            ) : (
                              <div key={cIdx}>{card}</div>
                            );
                          })}
                        </div>
                      )}
                      {idx < degree.sections.length - 1 && (
                        <div className="mt-6 border-b border-slate-100 dark:border-slate-800" />
                      )}
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Career Outcomes */}
            {degree.career_outcomes?.length > 0 && (
              <DetailSection title="Career outcomes">
                <div className="flex flex-wrap gap-2">
                  {degree.career_outcomes.map((outcome, idx) => (
                    <span key={idx} className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                      {outcome}
                    </span>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Special Notes */}
            {hasContent(degree.special_notes) && (
              <DetailSection title="Important notes">
                <FormattedText text={degree.special_notes} />
              </DetailSection>
            )}

          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-24">

            {/* Key stats */}
            <div className={`${card} p-5`}>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-link mb-4">
                At a glance
              </h3>
              <div className="space-y-3">
                {formatDuration(degree.duration_years, degree.duration) && (
                  <FactRow label="Duration" value={formatDuration(degree.duration_years, degree.duration)} />
                )}
                {degree.minimum_uoc && (
                  <FactRow label="Total UOC" value={`${degree.minimum_uoc} UOC`} />
                )}
                {degree.uac_code && (
                  <FactRow label="UAC code" value={degree.uac_code} />
                )}
                {degree.cricos_code && (
                  <FactRow label="CRICOS" value={degree.cricos_code} />
                )}
              </div>
            </div>

            {/* Admission Requirements */}
            {(degree.lowest_selection_rank || degree.lowest_atar || degree.assumed_knowledge) && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                  Admission Requirements
                </h3>
                <div className="space-y-3">
                  {degree.lowest_selection_rank && (
                    <FactRow label="Selection Rank" value={degree.lowest_selection_rank} />
                  )}
                  {degree.lowest_atar && (
                    <FactRow label="Lowest ATAR" value={degree.lowest_atar} />
                  )}
                  {degree.assumed_knowledge && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Assumed Knowledge</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{degree.assumed_knowledge}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default DegreeDetailPage;

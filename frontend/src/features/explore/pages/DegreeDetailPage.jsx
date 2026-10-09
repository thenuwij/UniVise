// src/pages/DegreeDetailPage.jsx
import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import { supabase } from "@/shared/lib/supabase";
import { useBackToHandbook } from "../hooks/useBackToHandbook";
import FormattedText from "@/shared/ui/FormattedText";
import { formatDuration, hasContent } from "@/shared/lib/format";
import DetailLoading from "../components/DetailLoading";
import PageHeader from "@/shared/layout/PageHeader";
import { card } from "@/shared/ui/cardStyles";
import { DetailSection, FactRow, bandButton, bandButtonSolid } from "../components/DetailLayout";
import RequirementSections from "../components/RequirementSections";

function DegreeDetailPage() {
  const { degreeId } = useParams();
  const navigate = useNavigate();
  const goBack = useBackToHandbook();

  const [degree, setDegree] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [knownCodes, setKnownCodes] = useState(null);

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
      .select("code")
      .in("code", codes)
      .then(({ data }) => {
        if (data) setKnownCodes(new Set(data.map((c) => c.code)));
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
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button onClick={() => navigate(`/roadmap?program=${degree.degree_code}`)} className={`group ${bandButtonSolid}`}>
              View this degree's roadmap
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
            {degree.sections?.length > 0 && (
              <DetailSection title="Requirements">
                <RequirementSections sections={degree.sections} known={knownCodes} />
              </DetailSection>
            )}

            {/* Career Outcomes */}
            {degree.career_outcomes?.length > 0 && (
              <DetailSection title="Career outcomes">
                <div className="flex flex-wrap gap-2">
                  {degree.career_outcomes.map((outcome, idx) => (
                    <span key={idx} className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 ring-1 ring-blue-200 dark:ring-blue-800">
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
              <div className={`${card} p-5`}>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-link mb-4">
                  Admission requirements
                </h3>
                <div className="space-y-3">
                  {degree.lowest_selection_rank && (
                    <FactRow label="Selection rank" value={degree.lowest_selection_rank} />
                  )}
                  {degree.lowest_atar && (
                    <FactRow label="Lowest ATAR" value={degree.lowest_atar} />
                  )}
                  {degree.assumed_knowledge && (
                    <div className="pt-3 border-t border-line">
                      <p className="text-sm text-ink-muted">Assumed knowledge</p>
                      <p className="mt-1 text-sm font-semibold text-ink-strong leading-relaxed">{degree.assumed_knowledge}</p>
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

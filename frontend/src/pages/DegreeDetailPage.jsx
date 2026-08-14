// src/pages/DegreeDetailPage.jsx
import { useEffect, useRef, useState } from "react";
import {
  HiAcademicCap,
  HiArrowLeft,
  HiArrowRight,
  HiBookOpen,
  HiBriefcase,
  HiChartBar,
  HiClock,
  HiCollection,
  HiDocumentText,
  HiExternalLink,
  HiInformationCircle,
  HiLightBulb,
  HiLocationMarker,
  HiSparkles,
} from "react-icons/hi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import SaveButton from "../components/SaveButton";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { apiJson } from "../utils/api";

function DegreeDetailPage() {
  const { session } = UserAuth();
  const { degreeId } = useParams();
  const navigate = useNavigate();

  const [degree, setDegree] = useState(null);
  const [advisorSummary, setAdvisorSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [courseIdByCode, setCourseIdByCode] = useState({});

  const advisorRef = useRef(null);

  const fetchSmartAdvisor = async () => {
    setLoadingSummary(true);
    setAdvisorSummary(null);
    setLoadErr(null);
    try {
      const data = await apiJson("/smart-summary/degree", {
        method: "POST",
        token: session?.access_token,
        body: { degree_id: degreeId },
      });
      setAdvisorSummary(data.summary);
      advisorRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setLoadErr(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

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

  if (!degree) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <HiAcademicCap className="w-12 h-12 text-slate-400 animate-pulse" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            {loadErr ? `Error: ${loadErr}` : "Loading degree details..."}
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
                {degree.program_name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {degree.faculty && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {degree.faculty}
                  </span>
                )}
                {degree.other_faculty && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {degree.other_faculty}
                  </span>
                )}
                {degree.program_code && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700">
                    {degree.program_code}
                  </span>
                )}
                {degree.level && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                    {degree.level}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() =>
                  navigate("/roadmap-loading", {
                    state: {
                      type: "unsw",
                      degree: {
                        id: degree.id,
                        degree_id: degree.id,
                        degree_code: degree.degree_code,
                        uac_code: degree.uac_code,
                        program_name: degree.program_name,
                      },
                    },
                  })
                }
                className="group flex items-center gap-2 px-4 py-2 rounded-xl
                           bg-gradient-to-r from-purple-600 to-blue-600
                           hover:from-purple-700 hover:to-blue-700
                           text-white font-semibold text-sm whitespace-nowrap
                           shadow-sm hover:shadow-md transition-all duration-200"
              >
                <span>Open on Roadmap</span>
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <SaveButton
                itemType="degree"
                itemId={degreeId}
                itemName={degree.program_name}
                itemData={{
                  degree_code: degree.degree_code,
                  program_name: degree.program_name,
                  faculty: degree.faculty,
                  duration: degree.duration,
                  minimum_uoc: degree.minimum_uoc,
                  lowest_atar: degree.lowest_atar,
                  overview_description: degree.overview_description,
                }}
              />
            </div>
          </div>

          {degree.overview_description && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {degree.overview_description}
              </p>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Smart Advisor */}
            <div ref={advisorRef} className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-700 shadow-sm p-6">
              {loadingSummary ? (
                <div className="text-center py-4">
                  <HiSparkles className="w-7 h-7 text-emerald-600 dark:text-emerald-400 animate-pulse mx-auto mb-3" />
                  <p className="text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                    Generating your personalised Smart Advisor summary…
                  </p>
                </div>
              ) : advisorSummary ? (
                <>
                  <SectionHeader icon={<HiLightBulb className="w-5 h-5" />} title="Smart Advisor Summary" colour="text-emerald-700 dark:text-emerald-300" />
                  <div className="mt-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-700">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {advisorSummary}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <HiLightBulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">Need Personalised Guidance?</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Get an AI-powered summary of how this degree aligns with your goals and interests.
                    </p>
                  </div>
                  <button
                    onClick={fetchSmartAdvisor}
                    className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow hover:shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2"
                  >
                    <HiSparkles className="w-4 h-4" />
                    Generate Summary
                  </button>
                </div>
              )}
            </div>

            {/* Program Structure */}
            {degree.program_structure && (
              <FlatSection title="Program Structure" icon={<HiCollection className="w-4 h-4" />}>
                <div className="space-y-3">
                  {formatStructureText(degree.program_structure).map((block, idx) => (
                    <div key={idx} className={`text-sm text-slate-700 dark:text-slate-300 leading-relaxed ${block.type === "numbered" ? "flex gap-3 items-start" : ""}`}>
                      {block.type === "numbered" && (
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center mt-0.5">
                          {block.num}
                        </span>
                      )}
                      {block.type === "bullet" && <span className="mr-2 text-slate-400 text-base">•</span>}
                      <p className="flex-1 text-sm leading-relaxed">{block.text}</p>
                    </div>
                  ))}
                </div>
              </FlatSection>
            )}

            {/* Detailed Requirements */}
            {degree.sections && degree.sections.length > 0 && (
              <FlatSection title="Detailed Requirements" icon={<HiBookOpen className="w-4 h-4" />}>
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
                      {section.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{section.description}</p>
                      )}
                      {section.notes && (
                        <p className="text-base text-amber-700 dark:text-amber-400 mb-3 leading-relaxed">
                          <strong>Note:</strong> {section.notes}
                        </p>
                      )}
                      {section.courses?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {section.courses.map((course, cIdx) => {
                            const courseId = courseIdByCode[course.code];
                            const card = (
                              <div className="flex items-center justify-between gap-3 py-3.5 px-4 rounded-xl bg-gradient-to-br from-white to-sky-50/60 dark:from-slate-800/70 dark:to-sky-900/20 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:from-sky-50 hover:to-sky-100/60 hover:shadow-sm dark:hover:from-slate-800 dark:hover:to-sky-900/30 transition-all cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-sm font-bold text-sky-700 dark:text-sky-400 flex-shrink-0">{course.code}</span>
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
              </FlatSection>
            )}

            {/* Career Outcomes */}
            {degree.career_outcomes?.length > 0 && (
              <FlatSection title="Career Outcomes" icon={<HiBriefcase className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-2">
                  {degree.career_outcomes.map((outcome, idx) => (
                    <span key={idx} className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                      {outcome}
                    </span>
                  ))}
                </div>
              </FlatSection>
            )}

            {/* Special Notes */}
            {degree.special_notes && (
              <FlatSection title="Important Notes" icon={<HiInformationCircle className="w-4 h-4" />}>
                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {degree.special_notes}
                </p>
              </FlatSection>
            )}

            {/* Handbook link */}
            {degree.source_url && (
              <div className="py-4">
                <a
                  href={degree.source_url}
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

            {/* Key stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                At a Glance
              </h3>
              <div className="space-y-3">
                {degree.duration && (
                  <StatRow icon={<HiClock className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="Duration" value={`${degree.duration} year${degree.duration > 1 ? "s" : ""}`} />
                )}
                {degree.minimum_uoc && (
                  <StatRow icon={<HiChartBar className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="Total UOC" value={`${degree.minimum_uoc} UOC`} />
                )}
                {degree.uac_code && (
                  <StatRow icon={<HiDocumentText className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="UAC Code" value={degree.uac_code} />
                )}
                {degree.cricos_code && (
                  <StatRow icon={<HiLocationMarker className="w-4 h-4 text-sky-600 dark:text-sky-400" />} label="CRICOS" value={degree.cricos_code} />
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
                    <StatRow icon={<HiInformationCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />} label="Selection Rank" value={degree.lowest_selection_rank} />
                  )}
                  {degree.lowest_atar && (
                    <StatRow icon={<HiInformationCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />} label="Lowest ATAR" value={degree.lowest_atar} />
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

// ── Helpers ──────────────────────────────────────────────────────

function formatStructureText(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const numbered = line.match(/^(\d+)\.\s+(.+)/);
      if (numbered) return { type: "numbered", num: numbered[1], text: numbered[2] };
      if (line.startsWith("•") || line.startsWith("-"))
        return { type: "bullet", text: line.replace(/^[•-]\s*/, "") };
      return { type: "text", text: line };
    });
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

function SectionHeader({ icon, title, colour = "text-slate-900 dark:text-slate-100" }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
      <div className="text-slate-500 dark:text-slate-400">{icon}</div>
      <h2 className={`text-base font-semibold ${colour}`}>{title}</h2>
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

export default DegreeDetailPage;

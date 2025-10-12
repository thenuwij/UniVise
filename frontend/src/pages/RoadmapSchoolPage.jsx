// RoadmapSchoolPage.jsx — Light Blue UI + Dark Mode Compatible
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import RoadmapFlow from "../components/roadmap/RoadmapFlow";
import EntryRequirementsCard from "../components/roadmap/EntryRequirementsCard";
import ProgramStructure from "../components/roadmap/ProgramStructure";
import IndustrySection from "../components/roadmap/IndustrySection";
import CareersSection from "../components/roadmap/CareersSection";
import SkeletonCard from "../components/roadmap/SkeletonCard";

/* ---------- Inline icons ---------- */
const ArrowLeft = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M12 19l-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);
const RefreshCw = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"/>
  </svg>
);
const Download = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const FileText = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
  </svg>
);
const SchoolIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M22 10L12 2 2 10l10 6 10-6z"/><path d="M6 12v6l6 4 6-4v-6"/>
  </svg>
);

/* ---------- Reusable UI primitives ---------- */
function GradientCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl p-[1px] bg-gradient-to-br from-sky-400/40 via-blue-400/30 to-indigo-400/30 
      dark:from-sky-700/30 dark:via-blue-700/20 dark:to-indigo-800/20 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${className}`}
    >
      <div className="rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur border border-white/60 dark:border-slate-700/60">
        {children}
      </div>
    </div>
  );
}
function SectionTitle({ icon, subtitle, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-medium text-secondary">
        {icon}
        {subtitle && (
          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800/40">
            {subtitle}
          </span>
        )}
      </div>
      <h1 className="mt-2 heading-lg text-primary">{children}</h1>
    </div>
  );
}
function Pill({ children }) {
  return (
    <span className="px-3 py-1 rounded-full text-sm bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 text-secondary border border-slate-200 dark:border-slate-700">
      {children}
    </span>
  );
}
function Fact({ label, value }) {
  return (
    <div className="flex flex-col rounded-2xl p-3 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/80 border border-slate-200 dark:border-slate-700 shadow-sm">
      <span className="text-[11px] uppercase tracking-wide text-secondary/70">{label}</span>
      <span className="mt-1 font-semibold text-primary">{value ?? "—"}</span>
    </div>
  );
}

/* ---------- Page ---------- */
export default function RoadmapSchoolPage() {
  const { state } = useLocation();
  const nav = useNavigate();

  const degree = state?.degree || null;
  const preloadedPayload = state?.payload || null;
  const preloadedRoadmapId = state?.roadmap_id || null;

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(preloadedPayload);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchByIdIfNeeded = async () => {
      if (!data && preloadedRoadmapId) {
        try {
          setLoading(true);
          const { data: row, error } = await supabase
            .from("school_roadmap")
            .select("payload")
            .eq("id", preloadedRoadmapId)
            .maybeSingle();
          if (error) throw error;
          setData(row?.payload || null);
        } catch (e) {
          setErr(e.message || "Failed to fetch roadmap by id.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchByIdIfNeeded();
  }, [preloadedRoadmapId, data]);

  useEffect(() => {
    if (!data && degree && !preloadedRoadmapId) handleGenerate();
  }, [degree]);

  const steps = useMemo(
    () => [
      {
        key: "entry",
        title: "Entry Requirements",
        render: () => (
          <EntryRequirementsCard
            atar={data?.entry_requirements?.atar}
            selectionRank={data?.entry_requirements?.selectionRank ?? data?.entry_requirements?.selection_rank ?? null}
            subjects={data?.entry_requirements?.subjects || []}
            notes={data?.entry_requirements?.notes}
          />
        ),
      },
      {
        key: "structure",
        title: "Program Structure",
        render: () => (
          <ProgramStructure
            years={data?.program_structure?.years || data?.program_structure || []}
            suggestedSpecialisations={
              data?.program_structure?.suggested_specialisations ||
              data?.suggested_specialisations ||
              data?.specialisations ||
              []
            }
          />
        ),
      },
      {
        key: "industry",
        title: "Industry & Careers",
        render: () => (
          <div className="space-y-6">
            <IndustrySection
              internships={data?.industry?.internships || data?.industry?.best_sites_for_internships || []}
              careersHint={data?.industry?.rolesHint || data?.careers?.live_api_hint}
            />
            <CareersSection rolesHint={data?.industry?.rolesHint || data?.careers?.live_api_hint} />
          </div>
        ),
      },
    ],
    [data]
  );

  async function handleGenerate() {
    try {
      setErr("");
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated.");
      if (!degree) throw new Error("No degree context.");

      const body = {
        recommendation_id: degree?.source === "hs_recommendation" ? degree?.id : undefined,
        degree_name: degree?.degree_name || degree?.program_name || undefined,
        country: "AU",
      };

      const res = await fetch("http://localhost:8000/roadmap/school", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || `Failed to generate roadmap (HTTP ${res.status}).`);
      setData(json.payload);
      setActiveIndex(0);
    } catch (e) {
      setErr(e.message || "Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  }

  const entry = data?.entry_requirements || {};
  const structure = data?.program_structure || {};
  const costs = data?.costs_and_scholarships || {};
  const life = data?.campus_life || {};
  const internships = data?.internships || {};
  const faq = Array.isArray(data?.faq) ? data.faq : [];
  const sources = Array.isArray(data?.sources) ? data.sources : [];

  return (
    <div className="roadmap-page">
      {/* Ambient glows */}
      <div aria-hidden>
        <div className="roadmap-glow-top" />
        <div className="roadmap-glow-bottom" />
      </div>

      <DashboardNavBar onMenuClick={() => setIsOpen(true)} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <div className="max-w-7xl mx-auto pt-20 pb-10 px-6">
        {/* Back */}
        <button
          onClick={() => nav("/roadmap")}
          className="group inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          <span>Back</span>
        </button>

        {/* Hero */}
        <GradientCard className="mt-6">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 rounded-t-3xl" />
            <div className="p-6 md:p-8 lg:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <SectionTitle icon={<SchoolIcon className="h-4 w-4 text-sky-600 dark:text-blue-400" />} subtitle="School Mode">
                {degree?.degree_name || degree?.program_name || "Selected degree"}
              </SectionTitle>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-medium text-white bg-gradient-to-br from-sky-600 via-blue-500 to-indigo-500 hover:shadow-xl hover:scale-[1.01] disabled:opacity-60 transition-all"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Generating…" : "Regenerate"}
                </button>
                <button
                  onClick={() => { setData(null); setActiveIndex(0); }}
                  className="rounded-2xl px-5 py-3 font-medium border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-primary transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Step rail */}
            <div className="px-4 pb-4">
              {data ? (
                <div className="mx-auto max-w-4xl">
                  <div className="flex items-center justify-center gap-2 rounded-2xl p-1 bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
                    {["Entry Requirements", "Program Structure", "Industry & Careers"].map((label, i) => (
                      <button
                        key={label}
                        onClick={() => setActiveIndex(i)}
                        className={`w-full md:w-auto px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          activeIndex === i
                            ? "bg-gradient-to-br from-sky-600 to-blue-500 text-white shadow"
                            : "text-secondary hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-4xl">
                  <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-4 text-sm text-secondary">
                    We’ll generate your roadmap automatically. If nothing appears, press <span className="font-medium">Regenerate</span>.
                  </div>
                </div>
              )}
            </div>
          </div>
        </GradientCard>

        {/* Content grid */}
        <div className="grid lg:grid-cols-[1fr,360px] gap-6 mt-6">
          {/* Left column */}
          <div className="space-y-6">
            <GradientCard>
              <div className="p-6">
                {!data && loading && <SkeletonCard lines={3} />}
                {err && !loading && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/70 dark:border-red-700 dark:bg-red-900/40 p-4 text-sm text-red-700 dark:text-red-300">
                    {err}
                  </div>
                )}
                {data && (
                  <div>
                    <h2 className="heading-md text-primary">Summary</h2>
                    <p className="mt-2 text-primary leading-relaxed">{data?.summary || "—"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Pill>Degree: <span className="font-medium ml-1">{degree?.degree_name || degree?.program_name || "—"}</span></Pill>
                      <Pill>Mode: <span className="font-medium ml-1">School (General)</span></Pill>
                      <Pill>Source: <span className="font-medium ml-1">{data?.source || degree?.source || "—"}</span></Pill>
                    </div>
                  </div>
                )}
              </div>
            </GradientCard>

            {/* Roadmap flow */}
            <GradientCard>
              <div className="p-6">
                {!data && loading && (
                  <>
                    <SkeletonCard lines={4} />
                    <SkeletonCard lines={6} />
                    <SkeletonCard lines={4} />
                  </>
                )}
                {data && <RoadmapFlow steps={steps} activeIndex={activeIndex} onChange={setActiveIndex} />}
                {!data && !loading && !err && (
                  <div className="text-center py-10 text-secondary">Ready when you are. We’re preparing your roadmap.</div>
                )}
              </div>
            </GradientCard>

            {data && sources.length > 0 && (
              <GradientCard>
                <div className="p-6">
                  <h2 className="heading-md text-primary">Sources</h2>
                  <ul className="mt-3 list-disc ml-5 text-sm text-secondary space-y-1">
                    {sources.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </GradientCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 h-max">
            <GradientCard>
              <div className="p-6">
                <h3 className="text-base font-semibold text-primary">Quick facts</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Fact label="ATAR" value={entry?.atar} />
                  <Fact label="Sel. Rank" value={entry?.selection_rank ?? entry?.selectionRank} />
                  <Fact label="Assumed" value={(entry?.assumed_knowledge || []).slice(0, 2).join(", ") || "—"} />
                  <Fact label="Electives" value={(structure?.recommended_electives || []).slice(0, 2).join(", ") || "—"} />
                  <Fact label="Clubs" value={(life?.clubs || []).slice(0, 2).join(", ") || "—"} />
                  <Fact label="Fees" value={costs?.indicative_fees || "—"} />
                </div>
              </div>
            </GradientCard>
          </div>
        </div>

        {/* Callout */}
        <div className="mt-8">
          <div className="roadmap-callout">
            Tip: If subjects or prerequisites look off, click <span className="font-medium">Regenerate</span> — the planner will retry with stricter validation.
          </div>
        </div>
      </div>
    </div>
  );
}

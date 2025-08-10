// RoadmapUNSWPage.jsx — Light Blue UI + Matches School Flow (object-safe)
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

import RoadmapFlow from "../components/roadmap/RoadmapFlow";
import EntryRequirementsCard from "../components/roadmap/EntryRequirementsCard";
import ProgramStructure from "../components/roadmap/ProgramStructure";
import HonoursRequirements from "../components/roadmap/HonoursRequirements";
import ProgramFlexibility from "../components/roadmap/ProgramFlexibility";
import IndustrySection from "../components/roadmap/IndustrySection";
import CareersSection from "../components/roadmap/CareersSection";
import SkeletonCard from "../components/roadmap/SkeletonCard";

/* ---------- Tiny inline icons (no deps) ---------- */
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
const UniIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M22 10L12 2 2 10l10 6 10-6z"/><path d="M6 12v6l6 4 6-4v-6"/>
  </svg>
);

/* ---------- Reusable UI primitives (match School page) ---------- */
function GradientCard({ children, className = "" }) {
  return (
    <div className={`rounded-3xl p-[1px] bg-gradient-to-br from-sky-400/40 via-blue-400/30 to-indigo-400/30 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${className}`}>
      <div className="rounded-3xl bg-white/90 backdrop-blur border border-white/60">
        {children}
      </div>
    </div>
  );
}
function SectionTitle({ icon, subtitle, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        {icon}
        {subtitle && (
          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
            {subtitle}
          </span>
        )}
      </div>
      <h1 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
        {children}
      </h1>
    </div>
  );
}
function Pill({ children }) {
  return (
    <span className="px-3 py-1 rounded-full text-sm bg-gradient-to-br from-sky-50 to-blue-50 text-slate-700 border border-slate-200">
      {children}
    </span>
  );
}
function Fact({ label, value }) {
  return (
    <div className="flex flex-col rounded-2xl p-3 bg-gradient-to-br from-white/80 to-white/60 border border-slate-200 shadow-sm">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-1 text-slate-900 font-semibold">{value ?? "—"}</span>
    </div>
  );
}

/* ---------- Helpers ---------- */
const courseToText = (c) =>
  typeof c === "string"
    ? c
    : c && (c.code || c.title)
      ? [c.code, c.title].filter(Boolean).join(" — ")
      : "";

/* =================================================================== */

export default function RoadmapUNSWPage() {
  const { state, search } = useLocation();
  const nav = useNavigate();

  // Preloaded context from loader
  const degree = state?.degree || null;
  const preloadedPayload = state?.payload || null;
  const preloadedRoadmapId = state?.roadmap_id || null;

  // Layout/data state
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(preloadedPayload);
  const [activeIndex, setActiveIndex] = useState(0);

  // Header fallback if we deep-link via roadmap_id (no state.degree provided)
  const [hdr, setHdr] = useState({
    program_name: degree?.degree_name || degree?.program_name || null,
    uac_code: degree?.uac_code || null,
  });

  // fetch by roadmap_id once if provided (parity with School page)
  useEffect(() => {
    const fetchByIdIfNeeded = async () => {
      if (!data && preloadedRoadmapId) {
        try {
          setLoading(true);
          const { data: row, error } = await supabase
            .from("unsw_roadmap")
            .select("payload, program_name, uac_code")
            .eq("id", preloadedRoadmapId)
            .maybeSingle();
          if (error) throw error;
          setData(row?.payload || null);
          setHdr((h) => ({
            program_name: h.program_name || row?.program_name || null,
            uac_code: h.uac_code || row?.uac_code || null,
          }));
        } catch (e) {
          setErr(e.message || "Failed to fetch UNSW roadmap by id.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchByIdIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedRoadmapId]);

  // Deep link step: ?step=1,2,3...
  useEffect(() => {
    const stepParam = new URLSearchParams(search).get("step");
    if (stepParam) {
      const idx = Math.max(0, parseInt(stepParam, 10) - 1);
      setActiveIndex(Number.isFinite(idx) ? idx : 0);
    }
  }, [search]);

  // Arrow-key nav
  useEffect(() => {
    const onKey = (e) => {
      if (!data) return;
      if (e.key === "ArrowRight") setActiveIndex((i) => Math.min(i + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setActiveIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data]); // eslint-disable-line

  /* ---------- Steps (same structure as School page, UNSW-specific content) ---------- */
  const steps = useMemo(() => ([
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
          unsw
          years={
            Array.isArray(data?.program_structure?.years)
              ? data.program_structure.years
              : Array.isArray(data?.program_structure)
                ? data.program_structure
                : []
          }
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
      key: "capstone",
      title: "Capstone & Honours",
      render: () => (
        <div className="grid md:grid-cols-2 gap-6">
          <GradientCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900">Capstone</h2>
              <div className="text-slate-700 mt-3">
                <div className="mb-1">
                  <span className="font-medium">Courses:</span>{" "}
                  {(data?.capstone?.courses || []).map(courseToText).filter(Boolean).join(", ") || "—"}
                </div>
                <div>
                  <span className="font-medium">Highlights:</span>{" "}
                  {data?.capstone?.highlights || "—"}
                </div>
              </div>
            </div>
          </GradientCard>
          <GradientCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900">Honours Requirements</h2>
              <div className="mt-3">
                <HonoursRequirements
                  classes={data?.honours?.classes || []}
                  requirements={data?.honours?.requirements}
                  wamRestrictions={data?.honours?.wamRestrictions}
                />
              </div>
            </div>
          </GradientCard>
        </div>
      ),
    },
    {
      key: "flex",
      title: "Flexibility",
      render: () => (
        <ProgramFlexibility
          switchOptions={data?.flexibility?.options || []}
          simulatorLink="/switching"
        />
      ),
    },
    {
      key: "industry",
      title: "Industry & Careers",
      render: () => (
        <div className="space-y-6">
          <IndustrySection
            trainingInfo={data?.industry?.trainingInfo}
            societies={data?.industry?.societies || []}
            careersHint={data?.industry?.rolesHint}
          />
          <CareersSection rolesHint={data?.industry?.rolesHint} />
        </div>
      ),
    },
  ]), [data]);

  /* ---------- Regenerate (UNSW only; initial generation happens in loader) ---------- */
  async function handleRegenerate() {
    try {
      setErr(""); setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated.");
      if (!degree && !hdr.program_name) throw new Error("No degree context.");

      const body = {
        degree_id: degree?.id ?? null,
        uac_code: degree?.uac_code ?? hdr.uac_code ?? null,
        program_name: degree?.degree_name || degree?.program_name || hdr.program_name || undefined,
        specialisation: degree?.specialisation || undefined,
      };

      const res = await fetch("http://localhost:8000/roadmap/unsw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || `Failed to regenerate roadmap (HTTP ${res.status}).`);
      setData(json.payload);
      setActiveIndex(0);

      // Refresh header fallbacks from server echo if present
      setHdr((h) => ({
        program_name: json?.payload?.program_name || h.program_name,
        uac_code: json?.payload?.uac_code || h.uac_code,
      }));
    } catch (e) {
      setErr(e.message || "Failed to regenerate roadmap.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Helpers for optional richer fields ---------- */
  const entry = data?.entry_requirements || {};
  const structure = data?.program_structure || {};
  const honours = data?.honours || {};
  const capstone = data?.capstone || {};

  // Normalize sources: backend may return `source` (string) or `sources` (array)
  const sources =
    Array.isArray(data?.sources) ? data.sources :
    (data?.source ? [data.source] : []);

  // Degree header fallbacks
  const headerProgramName = degree?.degree_name || degree?.program_name || hdr.program_name || "Selected degree";
  const headerUac = degree?.uac_code ?? hdr.uac_code ?? "—";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-sky-300/30 to-blue-300/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-blue-200/25 to-indigo-200/25 blur-3xl" />
      </div>

      <DashboardNavBar onMenuClick={() => setIsOpen(true)} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <div className="max-w-7xl mx-auto pt-20 pb-10 px-6">
        {/* Back + Hero */}
        <button onClick={() => nav("/roadmap")} className="group inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          <span>Back</span>
        </button>

        <GradientCard className="mt-6">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 rounded-t-3xl" />
            <div className="p-6 md:p-8 lg:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <SectionTitle icon={<UniIcon className="h-4 w-4 text-sky-600" />} subtitle="UNSW Mode">
                {headerProgramName}
              </SectionTitle>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-medium text-white shadow-lg transition-all
                             bg-gradient-to-br from-sky-600 to-blue-500 hover:shadow-xl hover:scale-[1.01] disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Regenerating…" : "Regenerate"}
                </button>
              </div>
            </div>

            {/* Step rail */}
            <div className="px-4 pb-4">
              {data ? (
                <div className="mx-auto max-w-4xl">
                  <div className="flex items-center justify-center gap-2 rounded-2xl p-1
                                  bg-gradient-to-br from-white/80 to-white/60 border border-slate-200 shadow-sm">
                    {["Entry Requirements", "Program Structure", "Capstone & Honours", "Flexibility", "Industry & Careers"].map((label, i) => (
                      <button
                        key={label}
                        onClick={() => setActiveIndex(i)}
                        className={`w-full md:w-auto px-4 py-2 rounded-xl text-sm font-medium transition-all
                          ${activeIndex === i
                            ? "bg-gradient-to-br from-sky-600 to-blue-500 text-white shadow"
                            : "text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-4xl">
                  <div className="rounded-2xl bg-white/70 border border-slate-200 p-4 text-sm text-slate-600">
                    Your UNSW roadmap was generated on the previous screen. If nothing appears, try <span className="font-medium">Regenerate</span>.
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
            {/* Summary */}
            <GradientCard>
              <div className="p-6">
                {!data && loading && <SkeletonCard lines={3} />}
                {err && !loading && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700">
                    {err}
                  </div>
                )}
                {data && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Summary</h2>
                    <p className="mt-2 text-slate-900 leading-relaxed">{data?.summary || "—"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Pill>Degree: <span className="font-medium ml-1">{headerProgramName}</span></Pill>
                      <Pill>Mode: <span className="font-medium ml-1">UNSW</span></Pill>
                      <Pill>UAC: <span className="font-medium ml-1">{headerUac}</span></Pill>
                      <Pill>Source: <span className="font-medium ml-1">{data?.source || "—"}</span></Pill>
                    </div>
                  </div>
                )}
              </div>
            </GradientCard>

            {/* Step content with subtle timeline spine */}
            <div className="relative">
              <div aria-hidden className="hidden md:block absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200/50 to-transparent" />
              <GradientCard>
                <div className="p-6">
                  {!data && loading && (
                    <>
                      <SkeletonCard lines={4} />
                      <SkeletonCard lines={6} />
                      <SkeletonCard lines={4} />
                    </>
                  )}
                  {data && (
                    <div>
                      <RoadmapFlow steps={steps} activeIndex={activeIndex} onChange={setActiveIndex} />
                    </div>
                  )}
                  {!data && !loading && !err && (
                    <div className="text-center py-10 text-slate-600">
                      Ready when you are. Your UNSW roadmap will appear here.
                    </div>
                  )}
                </div>
              </GradientCard>
            </div>

            {/* Sources (normalized) */}
            {data && Array.isArray(sources) && sources.length > 0 && (
              <GradientCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-slate-900">Sources</h2>
                  <ul className="mt-3 list-disc ml-5 text-sm text-slate-800 space-y-1">
                    {sources.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </GradientCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 h-max">
            {/* Quick facts */}
            <GradientCard>
              <div className="p-6">
                <h3 className="text-base font-semibold text-slate-900">Quick facts</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Fact label="ATAR" value={entry?.atar} />
                  <Fact label="Sel. Rank" value={entry?.selection_rank ?? entry?.selectionRank} />
                  <Fact label="UAC" value={headerUac} />
                  <Fact
                    label="Spec"
                    value={(structure?.suggested_specialisations || data?.specialisations || []).slice(0,1).join(", ") || "—"}
                  />
                  <Fact label="Honours" value={data?.honours?.requirements ? "Available" : "—"} />
                  <Fact
                    label="Capstone"
                    value={courseToText((capstone?.courses || [])[0]) || "—"}
                  />
                </div>
              </div>
            </GradientCard>

            {/* Actions */}
            <GradientCard>
              <div className="p-6">
                <h3 className="text-base font-semibold text-slate-900">Actions</h3>
                <div className="mt-4 flex flex-col gap-2">
                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 border bg-white hover:bg-slate-50 text-slate-700" disabled title="Coming soon">
                    <FileText className="h-4 w-4" /> Save
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 border bg-white hover:bg-slate-50 text-slate-700" disabled title="Coming soon">
                    <Download className="h-4 w-4" /> Export PDF
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={loading || (!degree && !hdr.program_name)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 border bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-60"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Regenerate
                  </button>
                </div>
              </div>
            </GradientCard>
          </div>
        </div>

        {/* Callout */}
        <div className="mt-8">
          <div className="rounded-3xl p-6 bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100/50 text-sm text-slate-700">
            Tip: If program rules or courses look off, click <span className="font-medium">Regenerate</span> — the planner will retry with stricter validation.
          </div>
        </div>
      </div>
    </div>
  );
}

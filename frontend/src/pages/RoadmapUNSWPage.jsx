// RoadmapUNSWPage.jsx — dark mode ready (uses global roadmap-page styles)

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

import GradientCard from "../components/GradientCard";
import SectionTitle from "../components/SectionTitle";
import Pill from "../components/Pill";
import Fact from "../components/Fact";

import { ArrowLeft, UniIcon } from "../components/icons/InlineIcons";

// Helpers
import { courseToText } from "../utils/formatters";

export default function RoadmapUNSWPage() {
  const { state, search } = useLocation();
  const nav = useNavigate();

  // Preloaded context
  const degree = state?.degree || null;
  const preloadedPayload = state?.payload || null;
  const preloadedRoadmapId = state?.roadmap_id || null;

  // Layout/data state
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(preloadedPayload);
  const [activeIndex, setActiveIndex] = useState(0);

  // Header fallback if we deep-link via roadmap_id
  const [hdr, setHdr] = useState({
    program_name: degree?.degree_name || degree?.program_name || null,
    uac_code: degree?.uac_code || null,
  });

  // Fetch by roadmap_id if provided
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
  }, [data]);

  /* ---------- Steps ---------- */
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
              <h2 className="heading-md text-primary">Capstone</h2>
              <div className="mt-3 text-secondary">
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
              <h2 className="heading-md text-primary">Honours Requirements</h2>
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

  /* ---------- Helpers ---------- */
  const entry = data?.entry_requirements || {};
  const structure = data?.program_structure || {};
  const honours = data?.honours || {};
  const capstone = data?.capstone || {};
  const sources =
    Array.isArray(data?.sources) ? data.sources :
    (data?.source ? [data.source] : []);
  const headerProgramName = degree?.degree_name || degree?.program_name || hdr.program_name || "Selected degree";
  const headerUac = degree?.uac_code ?? hdr.uac_code ?? "—";

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

        {/* Hero + Summary */}
        <GradientCard className="mt-6">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 rounded-t-3xl" />
            <div className="p-6 md:p-8 lg:p-10">
              <SectionTitle
                icon={<UniIcon className="h-4 w-4 text-sky-600 dark:text-blue-400" />}
                subtitle="UNSW Mode"
              >
                {headerProgramName}
              </SectionTitle>

              {data && (
                <div className="mt-8">
                  <h2 className="heading-md text-primary">Summary</h2>
                  <p className="mt-2 text-primary leading-relaxed">{data?.summary || "—"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>Degree: <span className="font-medium ml-1">{headerProgramName}</span></Pill>
                    <Pill>Mode: <span className="font-medium ml-1">UNSW</span></Pill>
                    <Pill>UAC: <span className="font-medium ml-1">{headerUac}</span></Pill>
                    <Pill>Source: <span className="font-medium ml-1">{data?.source || "—"}</span></Pill>
                  </div>
                  {Array.isArray(sources) && sources.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-primary">Sources</h3>
                      <ul className="mt-2 list-disc ml-5 text-sm text-secondary space-y-1">
                        {sources.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
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
                {!data && loading && (
                  <>
                    <SkeletonCard lines={4} />
                    <SkeletonCard lines={6} />
                    <SkeletonCard lines={4} />
                  </>
                )}
                {data && (
                  <RoadmapFlow steps={steps} activeIndex={activeIndex} onChange={setActiveIndex} />
                )}
                {!data && !loading && !err && (
                  <div className="text-center py-10 text-secondary">
                    Ready when you are. Your UNSW roadmap will appear here.
                  </div>
                )}
                {err && !loading && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/70 dark:border-red-700 dark:bg-red-900/40 p-4 text-sm text-red-700 dark:text-red-300 mt-4">
                    {err}
                  </div>
                )}
              </div>
            </GradientCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 h-max">
            <GradientCard>
              <div className="p-6">
                <h3 className="text-base font-semibold text-primary">Quick facts</h3>
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
          </div>
        </div>

        {/* Callout */}
        <div className="mt-8">
          <div className="roadmap-callout">
            Tip: Program rules and courses may evolve — always confirm with the official UNSW Handbook.
          </div>
        </div>
      </div>
    </div>
  );
}

// RoadmapUNSWPage.jsx — UNSW roadmap experience with narrative sections

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Layout
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import GradientCard from "../components/GradientCard";
import SectionTitle from "../components/SectionTitle";
import Pill from "../components/Pill";
import Fact from "../components/Fact";

// Roadmap sections
import RoadmapFlow from "../components/roadmap/RoadmapFlow";
import EntryRequirementsCard from "../components/roadmap/EntryRequirementsCard";
import ProgramStructure from "../components/roadmap/ProgramStructure";
import HonoursRequirements from "../components/roadmap/HonoursRequirements";
import ProgramFlexibility from "../components/roadmap/ProgramFlexibility";
import IndustrySection from "../components/roadmap/IndustrySection";
import CareersSection from "../components/roadmap/CareersSection";
import SkeletonCard from "../components/roadmap/SkeletonCard";

// Utilities
import { ArrowLeft, UniIcon } from "../components/icons/InlineIcons";
import { courseToText } from "../utils/formatters";

// Degree codes are inconsistent across payloads; probe every known field once
const resolveDegreeCode = (state, degree, data, header) => {
  const structureBlock = data?.program_structure;
  const structureCode =
    !Array.isArray(structureBlock) && typeof structureBlock === "object"
      ? structureBlock?.degree_code || structureBlock?.program_code
      : null;

  const candidates = [
    state?.degreeCode,
    degree?.program_code,
    degree?.degree_code,
    degree?.programCode,
    degree?.code,
    degree?.uac_code,
    degree?.id,
    state?.degree?.uac_code,
    data?.degree_code,
    data?.program_code,
    data?.program?.degree_code,
    data?.program?.code,
    structureCode,
    header?.uac_code,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim().length > 0) || null;
};

// Extract one item from state safely
const pickFrom = (value, fallback = null) => (value == null ? fallback : value);

export default function RoadmapUNSWPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const degree = pickFrom(location.state?.degree, null);
  const preloadedPayload = pickFrom(location.state?.payload, null);
  const preloadedRoadmapId = pickFrom(location.state?.roadmap_id, null);

  // UI shell state
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dynamic roadmap content
  const [payload, setPayload] = useState(preloadedPayload);
  const [activeIndex, setActiveIndex] = useState(0);

  // Header details fall back to initial navigation state
  const [header, setHeader] = useState({
    program_name: degree?.degree_name || degree?.program_name || null,
    uac_code: degree?.uac_code || null,
  });

  // Degree code is memoised so downstream hooks share a stable reference
  const degreeCode = useMemo(
    () => resolveDegreeCode(location.state, degree, payload, header),
    [location.state, degree, payload, header]
  );

  // When we deep-link via roadmap_id, fetch the saved payload once
  useEffect(() => {
    if (payload || !preloadedRoadmapId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("unsw_roadmap")
          .select("payload, program_name, uac_code")
          .eq("id", preloadedRoadmapId)
          .maybeSingle();
        if (fetchError) throw fetchError;
        if (cancelled) return;
        setPayload(data?.payload || null);
        setHeader((prev) => ({
          program_name: prev.program_name || data?.program_name || null,
          uac_code: prev.uac_code || data?.uac_code || null,
        }));
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to fetch UNSW roadmap by id.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload, preloadedRoadmapId]);

  // Reflect ?step query parameter so a link can open a specific section
  useEffect(() => {
    const stepParam = new URLSearchParams(location.search).get("step");
    if (!stepParam) return;
    const idx = Number.parseInt(stepParam, 10);
    if (Number.isFinite(idx)) setActiveIndex(Math.max(0, idx - 1));
  }, [location.search]);

  // Shared navigation handler so the button stays lean
  const handleViewGraph = useCallback(() => {
    if (!degreeCode) return;
    navigate(`/roadmap-graph/${encodeURIComponent(degreeCode)}`, {
      state: { degreeCode, degree },
    });
  }, [degreeCode, degree, navigate]);

  // Build the scrolling narrative for the flow component
  const steps = useMemo(() => ([
    {
      key: "entry",
      title: "Entry Requirements",
      render: () => (
        <EntryRequirementsCard
          atar={payload?.entry_requirements?.atar}
          selectionRank={
            payload?.entry_requirements?.selectionRank ?? payload?.entry_requirements?.selection_rank ?? null
          }
          subjects={payload?.entry_requirements?.subjects || []}
          notes={payload?.entry_requirements?.notes}
        />
      ),
    },
    {
      key: "structure",
      title: "Program Structure",
      render: () => (
        <div className="space-y-6">
          <ProgramStructure
            unsw
            years={
              Array.isArray(payload?.program_structure?.years)
                ? payload.program_structure.years
                : Array.isArray(payload?.program_structure)
                  ? payload.program_structure
                  : []
            }
            suggestedSpecialisations={
              payload?.program_structure?.suggested_specialisations ||
              payload?.suggested_specialisations ||
              payload?.specialisations ||
              []
            }
            flexibilityOptions={payload?.flexibility?.options || []}
          />

          <button
            type="button"
            onClick={handleViewGraph}
            disabled={!degreeCode}
            className={`button-base rounded-2xl font-semibold text-sm md:text-base shadow-lg transition-all duration-300 ${
              degreeCode
                ? "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white hover:shadow-xl hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 focus:ring-offset-slate-900"
                : "bg-slate-600/40 text-slate-300 cursor-not-allowed"
            }`}
          >
            Visualise Course Pathway
          </button>
        </div>
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
                  {(payload?.capstone?.courses || []).map(courseToText).filter(Boolean).join(", ") || "—"}
                </div>
                <div>
                  <span className="font-medium">Highlights:</span>{" "}
                  {payload?.capstone?.highlights || "—"}
                </div>
              </div>
            </div>
          </GradientCard>
          <GradientCard>
            <div className="p-6">
              <h2 className="heading-md text-primary">Honours Requirements</h2>
              <div className="mt-3">
                <HonoursRequirements
                  classes={payload?.honours?.classes || []}
                  requirements={payload?.honours?.requirements}
                  wamRestrictions={payload?.honours?.wamRestrictions}
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
          switchOptions={payload?.flexibility?.options || []}
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
            trainingInfo={payload?.industry?.trainingInfo}
            societies={payload?.industry?.societies || []}
            careersHint={payload?.industry?.rolesHint}
          />
          <CareersSection rolesHint={payload?.industry?.rolesHint} />
        </div>
      ),
    },
  ]), [payload, degreeCode, handleViewGraph]);

  const stepCount = steps.length;

  // Keyboard shortcuts keep the story feeling interactive
  useEffect(() => {
    if (!payload) return;

    const handleKey = (event) => {
      if (event.key === "ArrowRight") {
        setActiveIndex((idx) => Math.min(idx + 1, stepCount - 1));
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((idx) => Math.max(idx - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [payload, stepCount]);

  // Convenience helpers to keep JSX readable
  const entry = payload?.entry_requirements || {};
  const structure = payload?.program_structure || {};
  const honours = payload?.honours || {};
  const capstone = payload?.capstone || {};
  const sources = Array.isArray(payload?.sources) ? payload.sources : payload?.source ? [payload.source] : [];
  const headerProgramName = degree?.degree_name || degree?.program_name || header.program_name || "Selected degree";
  const headerUac = degree?.uac_code ?? header.uac_code ?? "—";

  return (
    <div className="roadmap-page">
      {/* Ambient backdrop behind the roadmap */}
      <div aria-hidden>
        <div className="roadmap-glow-top" />
        <div className="roadmap-glow-bottom" />
      </div>

      <DashboardNavBar onMenuClick={() => setIsOpen(true)} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <div className="max-w-7xl mx-auto pt-20 pb-10 px-6">
        {/* Back link mirrors the rest of the roadmap flow */}
        <button
          onClick={() => navigate("/roadmap")}
          className="group inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          <span>Back</span>
        </button>

        {/* Headline card summarises the degree */}
        <GradientCard className="mt-6">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 rounded-t-3xl" />
            <div className="p-6 md:p-8 lg:p-10">
              <SectionTitle icon={<UniIcon className="h-4 w-4 text-sky-600 dark:text-blue-400" />} subtitle="UNSW Mode">
                {headerProgramName}
              </SectionTitle>

              {payload && (
                <div className="mt-8">
                  <h2 className="heading-md text-primary">Summary</h2>
                  <p className="mt-2 text-primary leading-relaxed">{payload?.summary || "—"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>Degree: <span className="font-medium ml-1">{headerProgramName}</span></Pill>
                    <Pill>Mode: <span className="font-medium ml-1">UNSW</span></Pill>
                    <Pill>UAC: <span className="font-medium ml-1">{headerUac}</span></Pill>
                    <Pill>Source: <span className="font-medium ml-1">{payload?.source || "—"}</span></Pill>
                  </div>
                  {sources.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-primary">Sources</h3>
                      <ul className="mt-2 list-disc ml-5 text-sm text-secondary space-y-1">
                        {sources.map((sourceItem, index) => (
                          <li key={index}>{sourceItem}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </GradientCard>

        {/* Main layout splits the roadmap narrative from the quick facts */}
        <div className="grid lg:grid-cols-[1fr,360px] gap-6 mt-6">
          <div className="space-y-6">
            <GradientCard>
              <div className="p-6">
                {!payload && loading && (
                  <>
                    <SkeletonCard lines={4} />
                    <SkeletonCard lines={6} />
                    <SkeletonCard lines={4} />
                  </>
                )}

                {payload && (
                  <RoadmapFlow steps={steps} activeIndex={activeIndex} onChange={setActiveIndex} />
                )}

                {!payload && !loading && !error && (
                  <div className="text-center py-10 text-secondary">
                    Ready when you are. Your UNSW roadmap will appear here.
                  </div>
                )}

                {error && !loading && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/70 dark:border-red-700 dark:bg-red-900/40 p-4 text-sm text-red-700 dark:text-red-300 mt-4">
                    {error}
                  </div>
                )}
              </div>
            </GradientCard>
          </div>

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
                    value={(structure?.suggested_specialisations || payload?.specialisations || []).slice(0, 1).join(", ") || "—"}
                  />
                  <Fact label="Honours" value={honours?.requirements ? "Available" : "—"} />
                  <Fact label="Capstone" value={courseToText((capstone?.courses || [])[0]) || "—"} />
                </div>
              </div>
            </GradientCard>
          </div>
        </div>

        <div className="mt-8">
          <div className="roadmap-callout">
            Tip: Program rules and courses may evolve — always confirm with the official UNSW Handbook.
          </div>
        </div>
      </div>
    </div>
  );
}

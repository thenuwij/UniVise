import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import RoadmapFlow from "../components/roadmap/RoadmapFlow";
import EntryRequirementsCard from "../components/roadmap/EntryRequirementsCard";
import ProgramStructureUNSW from "../components/roadmap/ProgramStructureUNSW";
import CapstoneHonours from "../components/roadmap/CapstoneHonours";
import ProgramFlexibility from "../components/roadmap/ProgramFlexibility";
import IndustrySection from "../components/roadmap/IndustrySection";
import CareersSection from "../components/roadmap/CareersSection";
import SkeletonCard from "../components/roadmap/SkeletonCard";
import GradientCard from "../components/GradientCard";
import SectionTitle from "../components/SectionTitle";
import Pill from "../components/Pill";
import Fact from "../components/Fact";
import { ArrowLeft, UniIcon } from "../components/icons/InlineIcons";
import { courseToText } from "../utils/formatters";

// --- Constants ---
const DEFAULT_PROGRAM_NAME = "Selected degree";
const DEFAULT_UAC_CODE = "—";
const KEYBOARD_NAV_KEYS = {
  ARROW_RIGHT: "ArrowRight",
  ARROW_LEFT: "ArrowLeft"
};

// --- Helper Functions ---
const extractStepIndexFromUrl = (searchParams) => {
  const stepParam = new URLSearchParams(searchParams).get("step");
  if (!stepParam) return 0;
  
  const idx = Math.max(0, parseInt(stepParam, 10) - 1);
  return Number.isFinite(idx) ? idx : 0;
};

const normalizeSources = (data) => {
  if (Array.isArray(data?.sources)) return data.sources;
  if (data?.source) return [data.source];
  return [];
};

const extractDegreeCode = (degree) => {
  return degree?.code || degree?.degree_code || degree?.program_code || "3586";
};

const getSelectionRank = (entryRequirements) => {
  return entryRequirements?.selectionRank ?? 
         entryRequirements?.selection_rank ?? 
         null;
};

// --- Custom Hooks ---
const useRoadmapData = (preloadedPayload, preloadedRoadmapId) => {
  const [data, setData] = useState(preloadedPayload);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [header, setHeader] = useState({
    program_name: null,
    uac_code: null,
  });

  useEffect(() => {
    const fetchByIdIfNeeded = async () => {
      if (data || !preloadedRoadmapId) return;

      try {
        setLoading(true);
        const { data: row, error: fetchError } = await supabase
          .from("unsw_roadmap")
          .select("payload, program_name, uac_code")
          .eq("id", preloadedRoadmapId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setData(row?.payload || null);
        setHeader((prevHeader) => ({
          program_name: prevHeader.program_name || row?.program_name || null,
          uac_code: prevHeader.uac_code || row?.uac_code || null,
        }));
      } catch (err) {
        setError(err.message || "Failed to fetch UNSW roadmap by id.");
      } finally {
        setLoading(false);
      }
    };

    fetchByIdIfNeeded();
  }, [preloadedRoadmapId, data]);

  const updateHeader = useCallback((degree) => {
    setHeader({
      program_name: degree?.degree_name || degree?.program_name || null,
      uac_code: degree?.uac_code || null,
    });
  }, []);

  return { data, loading, error, header, updateHeader };
};

const useStepNavigation = (searchParams, stepsLength, hasData) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Handle URL-based step navigation
  useEffect(() => {
    const stepIndex = extractStepIndexFromUrl(searchParams);
    setActiveIndex(stepIndex);
  }, [searchParams]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!hasData) return;

    const handleKeyDown = (event) => {
      if (event.key === KEYBOARD_NAV_KEYS.ARROW_RIGHT) {
        setActiveIndex((current) => Math.min(current + 1, stepsLength - 1));
      }
      if (event.key === KEYBOARD_NAV_KEYS.ARROW_LEFT) {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasData, stepsLength]);

  return { activeIndex, setActiveIndex };
};

const IndustryCareersSection = ({ data }) => {
  return (
    <div className="space-y-6">
      <IndustrySection
        trainingInfo={data?.industry?.trainingInfo}
        societies={data?.industry?.societies || []}
        careersHint={data?.industry?.rolesHint}
      />
      <CareersSection rolesHint={data?.industry?.rolesHint} />
    </div>
  );
};

const ContentSection = ({ data, loading, error, steps, activeIndex, onIndexChange }) => {
  if (!data && loading) {
    return (
      <>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
        <SkeletonCard lines={4} />
      </>
    );
  }

  if (data) {
    return (
      <RoadmapFlow 
        steps={steps} 
        activeIndex={activeIndex} 
        onChange={onIndexChange} 
      />
    );
  }

  if (!data && !loading && !error) {
    return (
      <div className="text-center py-10 text-secondary">
        Ready when you are. Your UNSW roadmap will appear here.
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/70 dark:border-red-700 dark:bg-red-900/40 p-4 text-sm text-red-700 dark:text-red-300 mt-4">
        {error}
      </div>
    );
  }

  return null;
};

const QuickFactsSidebar = ({ entryRequirements, structure, data, headerUac }) => {
  const specialisations = (
    structure?.suggested_specialisations || 
    data?.specialisations || 
    []
  ).slice(0, 1).join(", ") || "—";

  const capstoneValue = courseToText((data?.capstone?.courses || [])[0]) || "—";

  return (
    <GradientCard>
      <div className="p-6">
        <h3 className="text-base font-semibold text-primary">Quick facts</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Fact label="ATAR" value={entryRequirements?.atar} />
          <Fact 
            label="Sel. Rank" 
            value={getSelectionRank(entryRequirements)} 
          />
          <Fact label="UAC" value={headerUac} />
          <Fact label="Spec" value={specialisations} />
          <Fact 
            label="Honours" 
            value={data?.honours?.requirements ? "Available" : "—"} 
          />
          <Fact label="Capstone" value={capstoneValue} />
        </div>
      </div>
    </GradientCard>
  );
};

// --- Main Component ---
// --- everything above unchanged (imports, hooks, helper functions, etc.) ---

export default function RoadmapUNSWPage() {
  // your same logic and hooks
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const degree = state?.degree || null;
  const preloadedPayload = state?.payload || null;
  const preloadedRoadmapId = state?.roadmap_id || null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data, loading, error, header, updateHeader } = useRoadmapData(
    preloadedPayload,
    preloadedRoadmapId
  );

  useEffect(() => {
    if (degree) updateHeader(degree);
  }, [degree, updateHeader]);

  const steps = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: "entry",
        title: "Entry Requirements",
        render: () => (
          <EntryRequirementsCard
            atar={data?.entry_requirements?.atar}
            selectionRank={getSelectionRank(data?.entry_requirements)}
            subjects={data?.entry_requirements?.subjects || []}
            notes={data?.entry_requirements?.notes}
          />
        ),
      },
      {
        key: "structure",
        title: "Program Structure",
        render: () => <ProgramStructureUNSW degreeCode={extractDegreeCode(degree)} />,
      },
      {
        key: "capstone",
        title: "Capstone & Honours",
        render: () => <CapstoneHonours data={data} />,
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
        render: () => <IndustryCareersSection data={data} />,
      },
    ];
  }, [data, degree]);

  const { activeIndex, setActiveIndex } = useStepNavigation(search, steps.length, !!data);

  const sources = normalizeSources(data);
  const headerProgramName =
    degree?.degree_name ||
    degree?.program_name ||
    header.program_name ||
    DEFAULT_PROGRAM_NAME;
  const headerUac = degree?.uac_code ?? header.uac_code ?? DEFAULT_UAC_CODE;

  const entryRequirements = data?.entry_requirements || {};
  const programStructure = data?.program_structure || {};

  const handleBackClick = useCallback(() => navigate("/roadmap"), [navigate]);
  const handleMenuToggle = useCallback((open) => setIsMenuOpen(open), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 
                    dark:from-slate-950 dark:to-slate-900 
                    text-primary transition-colors duration-500">
      {/* background glow */}
      <div aria-hidden>
        <div className="roadmap-glow-top" />
        <div className="roadmap-glow-bottom" />
      </div>

      <DashboardNavBar onMenuClick={() => handleMenuToggle(true)} />
      <MenuBar isOpen={isMenuOpen} handleClose={() => handleMenuToggle(false)} />

      <div className="max-w-7xl mx-auto pt-20 pb-10 px-6">
        {/* Back button */}
        <button
          onClick={handleBackClick}
          className="group inline-flex items-center gap-2 
                     text-slate-600 dark:text-slate-300 
                     hover:text-sky-600 dark:hover:text-sky-400 
                     transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          <span>Back</span>
        </button>

        {/* Hero section */}
        <GradientCard className="mt-6 shadow-lg hover:shadow-2xl 
                                 transition-all duration-300 
                                 bg-white/80 dark:bg-slate-900/70 
                                 border border-slate-200/70 dark:border-slate-700/60 
                                 backdrop-blur-md">
          <div className="relative p-8">
            <div className="absolute inset-x-0 top-0 h-[3px] 
                            bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 
                            rounded-t-3xl" />
            <SectionTitle
              icon={<UniIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
              subtitle="UNSW Mode"
            >
              <span className="bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 
                               bg-clip-text text-transparent font-bold">
                {headerProgramName}
              </span>
            </SectionTitle>

            {data && (
              <div className="mt-6 space-y-4 text-slate-700 dark:text-slate-300">
                <p className="text-base leading-relaxed">{data?.summary || "—"}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Pill>Degree: <span className="ml-1 font-medium">{headerProgramName}</span></Pill>
                  <Pill>Mode: <span className="ml-1 font-medium">UNSW</span></Pill>
                  <Pill>UAC: <span className="ml-1 font-medium">{headerUac}</span></Pill>
                  <Pill>Source: <span className="ml-1 font-medium">{data?.source || "—"}</span></Pill>
                </div>

                {sources.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                      Sources
                    </h3>
                    <ul className="mt-2 list-disc ml-6 text-sm space-y-1 text-slate-600 dark:text-slate-400">
                      {sources.map((src, i) => <li key={i}>{src}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </GradientCard>

        {/* Content grid */}
        <div className="grid lg:grid-cols-[1fr,360px] gap-6 mt-8">
          {/* Left column */}
          <div className="space-y-6">
            <GradientCard className="shadow-lg hover:shadow-xl 
                                     hover:scale-[1.01] transition-all duration-300 
                                     bg-white/70 dark:bg-slate-900/60 
                                     border border-slate-200/60 dark:border-slate-700/60 
                                     backdrop-blur-sm">
              <div className="p-6">
                <ContentSection
                  data={data}
                  loading={loading}
                  error={error}
                  steps={steps}
                  activeIndex={activeIndex}
                  onIndexChange={setActiveIndex}
                />
              </div>
            </GradientCard>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:sticky lg:top-6 h-max">
            <QuickFactsSidebar
              entryRequirements={entryRequirements}
              structure={programStructure}
              data={data}
              headerUac={headerUac}
            />
          </div>
        </div>

        {/* Footer callout */}
        <div className="mt-10 text-center">
          <div className="inline-block rounded-xl 
                          bg-sky-50/80 dark:bg-sky-900/20 
                          border border-sky-200/50 dark:border-sky-700/40 
                          px-4 py-3 text-sm font-medium 
                          text-sky-800 dark:text-sky-300 
                          shadow-sm backdrop-blur-sm">
            Tip: Program rules and courses may evolve — always confirm with the official UNSW Handbook.
          </div>
        </div>
      </div>
    </div>
  );
}

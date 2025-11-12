import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import RoadmapFlow from "../components/roadmap/RoadmapFlow";
import ProgramStructureUNSW from "../components/roadmap/ProgramStructureUNSW";
import CapstoneHonours from "../components/roadmap/CapstoneHonours";
import ProgramFlexibility from "../components/roadmap/ProgramFlexibility";
import SkeletonCard from "../components/roadmap/SkeletonCard";
import GradientCard from "../components/GradientCard";
import SectionTitle from "../components/SectionTitle";
import Pill from "../components/Pill";
import Fact from "../components/Fact";
import { ArrowLeft, UniIcon } from "../components/icons/InlineIcons";
import { courseToText } from "../utils/formatters";
import CareerPathways from "../components/roadmap/CareerPathways";
import GeneratingMessage from "../components/roadmap/GeneratingMessage";
import SocietiesCommunity from "../components/roadmap/SocietiesCommunity";
import IndustryExperience from "../components/roadmap/IndustryExperience";
import EntryRequirementsCardUnsw from "../components/roadmap/EntryRequirementsUnsw";
import SpecialisationUNSW from "../components/roadmap/SpecialisationUNSW";

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
const useRoadmapData = (
  preloadedPayload,
  preloadedRoadmapId,
  isRegenerating,
  setIsRegenerating
) => {
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



  // --- Polling effect for INITIAL generation (always runs) ---
  useEffect(() => {
    if (!preloadedRoadmapId) return;

    const interval = setInterval(async () => {
      try {
        const { data: row, error } = await supabase
          .from("unsw_roadmap")
          .select("payload")
          .eq("id", preloadedRoadmapId)
          .maybeSingle();

        if (error) throw error;

        const newFlex = row?.payload?.flexibility_detailed;
        const existingFlex = data?.payload?.flexibility_detailed;
        const newSocieties = row?.payload?.industry_societies;
        const newExperience = row?.payload?.industry_experience;
        const newCareers = row?.payload?.career_pathways;

        const existingSocieties = data?.payload?.industry_societies;
        const existingExperience = data?.payload?.industry_experience;
        const existingCareers = data?.payload?.career_pathways;

        if (
          (newSocieties && !existingSocieties) ||
          (newExperience && !existingExperience) ||
          (newCareers && !existingCareers) ||
          (newFlex && !existingFlex)
        ) {
          console.log("[Polling] New data detected! Updating...");
          setData((prev) => ({
            ...prev,
            payload: { ...prev?.payload, ...row.payload },
          }));
        }
      } catch (err) {
        console.warn("[Polling] Error:", err.message);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [preloadedRoadmapId, data]);

  // --- Polling effect for REGENERATION ---
  useEffect(() => {
    if (!preloadedRoadmapId || !isRegenerating) return;

    let baseline = null;
    let intervalId = null;

    const startPolling = async () => {
      try {
        const { data: initial, error: initError } = await supabase
          .from("unsw_roadmap")
          .select("updated_at")
          .eq("id", preloadedRoadmapId)
          .single();
        
        if (initError) throw initError;
        baseline = initial?.updated_at;
        console.log("Regeneration polling started, baseline:", baseline);

        intervalId = setInterval(async () => {
          try {
            const { data: row, error } = await supabase
              .from("unsw_roadmap")
              .select("payload, updated_at")
              .eq("id", preloadedRoadmapId)
              .single();
            
            if (error) throw error;

            if (baseline && row?.updated_at && row.updated_at !== baseline) {
              console.log("Regeneration complete! Updating...");
              setData((prev) => ({
                ...prev,
                payload: { ...prev?.payload, ...row.payload },
              }));
              setIsRegenerating(false);
              clearInterval(intervalId);
            }
          } catch (err) {
            console.warn("[Regeneration Polling] Error:", err.message);
          }
        }, 3000);
      } catch (err) {
        console.warn("[Regeneration Init] Error:", err.message);
      }
    };

    startPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [preloadedRoadmapId, isRegenerating, setIsRegenerating]);



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

// --- Main Component ---
export default function RoadmapUNSWPage() {

  const { state, search } = useLocation();
  const navigate = useNavigate();
  const degree = state?.degree || null;
  const preloadedPayload = state?.payload || null;
  const preloadedRoadmapId = state?.roadmap_id || null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { data, loading, error, header, updateHeader } = useRoadmapData(
    preloadedPayload,
    preloadedRoadmapId,
    isRegenerating,
    setIsRegenerating
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
          <EntryRequirementsCardUnsw 
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
        key: "specialisation",
        title: "Specialisations",
        render: () => (
          <SpecialisationUNSW 
            degreeCode={extractDegreeCode(degree)}
            roadmapId={preloadedRoadmapId}
            onRegenerationStart={() => setIsRegenerating(true)}
          />
        ),
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
            flexibility={data?.payload?.flexibility_detailed}
            simulatorLink="/switching"
          />
        ),
      },
      {
        key: "societies",
        title: "Societies & Community",
        render: () => {

          if (isRegenerating) {
            return (
              <GeneratingMessage
                title="Updating with Your Specialisation..."
                message="Personalising societies and community recommendations based on your selected major, minor, or honours."
              />
            );
          }

          const societies = data?.payload?.industry_societies;
          if (!societies || Object.keys(societies).length === 0) {
            return (
              <GeneratingMessage
                title="Generating Societies & Community..."
                message="Finding UNSW societies and community events for your program."
              />
            );
          }
          return <SocietiesCommunity societies={societies} />;
        },
      },
      {
        key: "industry_experience",
        title: "Industry Experience & Training",
        render: () => {

          if (isRegenerating) {
            return (
              <GeneratingMessage
                title="Updating with Your Specialisation..."
                message="Personalising internship, training, and WIL opportunities based on your selected specialisation."
              />
            );
          }
          const experience = data?.payload?.industry_experience;
          if (!experience || Object.keys(experience).length === 0) {
            return (
              <GeneratingMessage
                title="Generating Industry Experience..."
                message="Collecting internship programs, recruiting companies, and WIL opportunities."
              />
            );
          }
          return <IndustryExperience industryExperience={experience} />;
        },
      },
      {
        key: "career_pathways",
        title: "Career Pathways & Outcomes",
        render: () => {
          if (isRegenerating) {
            return (
              <GeneratingMessage
                title="Updating with Your Specialisation..."
                message="Re-mapping personalised career outcomes and graduate pathways for your selected major or honours."
              />
            );
          } 

          const careers = data?.payload?.career_pathways;
          if (!careers || Object.keys(careers).length === 0) {
            return (
              <GeneratingMessage
                title="Generating Career Pathways..."
                message="Mapping entry-level, mid-career, and senior roles for your field."
              />
            );
          }
          return <CareerPathways careerPathways={careers} />;
        },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200
                dark:from-slate-950 dark:via-slate-900 dark:to-slate-950
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
        <GradientCard className="mt-6 shadow-lg 
                                 bg-white/80 dark:bg-slate-900/70 
                                 border border-slate-200/70 dark:border-slate-700/60 
                                 backdrop-blur-md">
                                  
          <div className="relative p-8">
            <div className="absolute inset-x-0 top-0 h-[3px]
                bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-600
                dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400
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
                <p className="text-base leading-relaxed">
                  {degree?.overview_description || data?.summary || "—"}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {/* Mode always first */}
                  <Pill>
                    Mode: <span className="ml-1 font-medium">UNSW</span>
                  </Pill>

                  {/* Faculty */}
                  {degree?.faculty && (
                    <Pill>
                      Faculty:{" "}
                      <span className="ml-1 font-medium">
                        {degree.faculty.replace(/^Faculty of\s+/i, "")}
                      </span>
                    </Pill>
                  )}

                  {/* UAC code */}
                  {degree?.uac_code && (
                    <Pill>
                      UAC: <span className="ml-1 font-medium">{degree.uac_code}</span>
                    </Pill>
                  )}

                  {/* CRICOS */}
                  {degree?.cricos_code && (
                    <Pill>
                      CRICOS: <span className="ml-1 font-medium">{degree.cricos_code}</span>
                    </Pill>
                  )}

                  {/* Duration */}
                  {degree?.duration && (
                    <Pill>
                      Duration:{" "}
                      <span className="ml-1 font-medium">
                        {degree.duration.toString().includes("year")
                          ? degree.duration
                          : `${degree.duration} years`}
                      </span>
                    </Pill>
                  )}

                  {/* Degree Code (optional) */}
                  {degree?.degree_code && (
                    <Pill>
                      Code: <span className="ml-1 font-medium">{degree.degree_code}</span>
                    </Pill>
                  )}
                </div>

              </div>
            )}
          </div>
        </GradientCard>

        {/* Content */}
        <div className="mt-8">
          <GradientCard className="shadow-lg 
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

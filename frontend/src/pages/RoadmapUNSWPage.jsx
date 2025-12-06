import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import GradientCard from "../components/GradientCard";
import { ArrowLeft, UniIcon } from "../components/icons/InlineIcons";
import { MenuBar } from "../components/MenuBar";
import Pill from "../components/Pill";
import CapstoneHonours from "../components/roadmap/CapstoneHonours";
import CareerPathways from "../components/roadmap/CareerPathways";
import EntryRequirementsCardUnsw from "../components/roadmap/EntryRequirementsUnsw";
import GeneratingMessage from "../components/roadmap/GeneratingMessage";
import IndustryExperience from "../components/roadmap/IndustryExperience";
import ProgramFlexibility from "../components/roadmap/ProgramFlexibility";
import ProgramStructureUNSW from "../components/roadmap/ProgramStructureUNSW";
import RoadmapFlow from "../components/roadmap/RoadmapFlow";
import SkeletonCard from "../components/roadmap/SkeletonCard";
import SocietiesCommunity from "../components/roadmap/SocietiesCommunity";
import SpecialisationUNSW from "../components/roadmap/SpecialisationUNSW";
import SectionTitle from "../components/SectionTitle";
import { supabase } from "../supabaseClient";

const DEFAULT_PROGRAM_NAME = "Selected degree";
const DEFAULT_UAC_CODE = "—";
const KEYBOARD_NAV_KEYS = {
  ARROW_RIGHT: "ArrowRight",
  ARROW_LEFT: "ArrowLeft"
};

// Helper functions
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

const useDegreeData = (degreeCode) => {
  const [degreeData, setDegreeData] = useState(null);

  useEffect(() => {
    const fetchDegree = async () => {
      if (!degreeCode) return;

      try {
        const { data: degree, error } = await supabase
          .from("unsw_degrees_final")
          .select("*")
          .eq("degree_code", degreeCode)
          .maybeSingle();

        if (error) throw error;
        setDegreeData(degree);
      } catch (err) {
        console.warn("Failed to fetch degree:", err.message);
      }
    };

    fetchDegree();
  }, [degreeCode]);

  return degreeData;
};

const extractDegreeCode = (degree) => {
  if (!degree) return null;
  
  const finalCode = degree.code || degree.degree_code || degree.program_code || null;
  
  if (!finalCode) {
    console.warn("extractDegreeCode: No valid degree code found");
  }
  
  return finalCode;
};

const getSelectionRank = (entryRequirements) => {
  return entryRequirements?.selectionRank ?? 
         entryRequirements?.selection_rank ?? 
         null;
};

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
    degree_code: null, 
  });

  useEffect(() => {
    const fetchByIdIfNeeded = async () => {
      if (data || !preloadedRoadmapId) return;

      try {
        setLoading(true);
        const { data: row, error: fetchError } = await supabase
          .from("unsw_roadmap")
          .select("payload, program_name, uac_code, degree_code")
          .eq("id", preloadedRoadmapId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setData(row?.payload || null);
        setHeader((prevHeader) => ({
          program_name: prevHeader.program_name || row?.program_name || null,
          uac_code: prevHeader.uac_code || row?.uac_code || null,
          degree_code: prevHeader.degree_code || row?.degree_code || null,
        }));
      } catch (err) {
        setError(err.message || "Failed to fetch UNSW roadmap by id.");
      } finally {
        setLoading(false);
      }
    };

    fetchByIdIfNeeded();
  }, [preloadedRoadmapId, data]);



  // Polling effect 
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

  useEffect(() => {
    if (!preloadedRoadmapId || !isRegenerating) return;

    let updateCount = 0;
    let lastTimestamp = null;
    let intervalId = null;

    const startPolling = async () => {
      try {
        // get initial timestamp baseline
        const { data: initial } = await supabase
          .from("unsw_roadmap")
          .select("updated_at")
          .eq("id", preloadedRoadmapId)
          .single();

        lastTimestamp = initial?.updated_at;

        intervalId = setInterval(async () => {
          try {
            const { data: row, error } = await supabase
              .from("unsw_roadmap")
              .select("payload, updated_at")
              .eq("id", preloadedRoadmapId)
              .single();

            if (error) throw error;

            if (row?.updated_at && row.updated_at !== lastTimestamp) {
              updateCount++;
              lastTimestamp = row.updated_at;

              // Merge latest payload each time a new bump is detected
              setData((prev) => ({
                ...(prev || {}),
                payload: { ...prev?.payload, ...row.payload },
              }));
            }

            // Stop after 3 bumps (all threads done)
            if (updateCount >= 3) {
              setIsRegenerating(false);
              clearInterval(intervalId);
            }
          } catch (err) {
            console.warn("[Polling Error]:", err.message);
          }
        }, 3000);
      } catch (err) {
        console.warn("[Polling Init Error]:", err.message);
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
      degree_code: extractDegreeCode(degree),
    });
  }, []);

  return { data, loading, error, header, updateHeader };
};

const useStepNavigation = (searchParams, stepsLength, hasData, preloadedRoadmapId) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Handle URL-based step navigation on mount
  useEffect(() => {
    const stepIndex = extractStepIndexFromUrl(searchParams);
    setActiveIndex(stepIndex);
  }, [searchParams]);

  // Sync activeIndex to URL (without page reload)
  useEffect(() => {
    if (!hasData || !preloadedRoadmapId) return;
    
    const newUrl = `${window.location.pathname}?id=${preloadedRoadmapId}&step=${activeIndex + 1}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeIndex, hasData, preloadedRoadmapId]);

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
  const searchParams = new URLSearchParams(search);

  const degree = state?.degree || null;
  const preloadedPayload = state?.payload || null;
  const preloadedRoadmapId = state?.roadmap_id || searchParams.get('id') || null;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id);
  };
  getUser();
}, []);

  const { data, loading, error, header, updateHeader } = useRoadmapData(
    preloadedPayload,
    preloadedRoadmapId,
    isRegenerating,
    setIsRegenerating
  );

  const fetchedDegree = useDegreeData(header.degree_code);
  const activeDegree = degree || fetchedDegree;

  useEffect(() => {
    if (degree) { 
      updateHeader(degree);
    }
  }, [degree, updateHeader]);

  const steps = useMemo(() => {
    if (!data) return [];

    const degreeCodeValue = activeDegree ? extractDegreeCode(activeDegree) : header.degree_code;

    return [
      {
        key: "entry",
        title: "Entry Requirements",
        render: () => (
          <EntryRequirementsCardUnsw 
            atar={activeDegree?.lowest_atar ?? data?.entry_requirements?.atar}
            selectionRank={
              activeDegree?.lowest_selection_rank ??
              getSelectionRank(data?.entry_requirements)
            }
            subjects={data?.entry_requirements?.subjects || []}
            notes={data?.entry_requirements?.notes}
          />
        ),
      }, 
      {
        key: "structure",
        title: "Program Structure",
        render: () => {
          if (!degreeCodeValue) {
            return (
              <div className="text-center py-10 text-secondary">
                Unable to load program structure. Please try again.
              </div>
            );
          }
          
          return <ProgramStructureUNSW degreeCode={degreeCodeValue} />;
        },
      },
      {
        key: "specialisation",
        title: "Specialisations",
        render: () => {
          if (!degreeCodeValue) {
            return (
              <div className="text-center py-10 text-secondary">
                Unable to load specialisations. Please try again.
              </div>
            );
          }
          
          return <SpecialisationUNSW degreeCode={degreeCodeValue} />;
        },
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
            roadmapId={preloadedRoadmapId}
            degreeCode={degreeCodeValue}  
            userId={userId}
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
  }, [data, activeDegree, header, userId]);

  const { activeIndex, setActiveIndex } = useStepNavigation(
    search, 
    steps.length, 
    !!data, 
    preloadedRoadmapId
  );

  const sources = normalizeSources(data);
  const headerProgramName =
    activeDegree?.degree_name ||
    activeDegree?.program_name ||
    header.program_name ||
    DEFAULT_PROGRAM_NAME;
  const headerUac = activeDegree?.uac_code ?? header.uac_code ?? DEFAULT_UAC_CODE;

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

      <div className="max-w-[1600px] mx-auto pt-20 pb-10 px-4 md:px-6">
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
        <GradientCard className="w-full mt-6 shadow-lg 
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
              <span className="font-extrabold text-transparent bg-clip-text
                 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900
                 dark:from-white dark:via-slate-200 dark:to-white">
                {headerProgramName}
              </span>

            </SectionTitle>

            {data && (
              <div className="mt-6 space-y-4 text-slate-700 dark:text-slate-300">
                <p className="text-base leading-relaxed">
                  {activeDegree?.overview_description || data?.summary || "—"}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {/* Mode always first */}
                  <Pill>
                    Mode: <span className="ml-1 font-medium">UNSW</span>
                  </Pill>

                  {/* Faculty */}
                  {activeDegree?.faculty && (
                    <Pill>
                      Faculty:{" "}
                      <span className="ml-1 font-medium">
                        {activeDegree.faculty.replace(/^Faculty of\s+/i, "")}
                      </span>
                    </Pill>
                  )}

                  {/* UAC code */}
                  {activeDegree?.uac_code && (
                    <Pill>
                      UAC: <span className="ml-1 font-medium">{activeDegree.uac_code}</span>
                    </Pill>
                  )}

                  {/* CRICOS */}
                  {activeDegree?.cricos_code && (
                    <Pill>
                      CRICOS: <span className="ml-1 font-medium">{activeDegree.cricos_code}</span>
                    </Pill>
                  )}

                  {/* Duration */}
                  {activeDegree?.duration && (
                    <Pill>
                      Duration:{" "}
                      <span className="ml-1 font-medium">
                        {activeDegree.duration.toString().includes("year")
                          ? activeDegree.duration
                          : `${activeDegree.duration} years`}
                      </span>
                    </Pill>
                  )}

                  {/* Degree Code */}
                  {activeDegree?.degree_code && (
                    <Pill>
                      Code: <span className="ml-1 font-medium">{activeDegree.degree_code}</span>
                    </Pill>
                  )}
                </div>

              </div>
            )}
          </div>
        </GradientCard>

        {/* Content */}
        <div className="mt-8">
          <GradientCard className="w-full shadow-lg 
                                  bg-white/70 dark:bg-slate-900/60 
                                  border border-slate-200/60 dark:border-slate-700/60 
                                  backdrop-blur-sm">

            <div className="p-4 md:p-6">
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
      </div>
    </div>
  );
}

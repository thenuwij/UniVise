import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";
import { formatDuration } from "@/shared/lib/format";
import CapstoneHonours from "../components/CapstoneHonours";
import CareerPathways from "../components/CareerPathways";
import CourseProgress from "../components/CourseProgress";
import GeneratingMessage from "../components/GeneratingMessage";
import IndustryExperience from "../components/IndustryExperience";
import ProgramStructureUNSW from "../components/ProgramStructureUNSW";
import RoadmapFlow from "../components/RoadmapFlow";
import SkeletonCard from "../components/SkeletonCard";
import SocietiesCommunity from "../components/SocietiesCommunity";
import { useEnrolledProgram } from "../hooks/useEnrolledProgram";
import { fetchChosenSpecialisations } from "../utils/programCourses";
import { ROADMAP_STEPS } from "../utils/roadmapSteps";
import { supabase } from "@/shared/lib/supabase";
import { apiFetch } from "@/shared/lib/api";
import { UserAuth } from "@/app/AuthContext";

const DEFAULT_PROGRAM_NAME = "";
const DEFAULT_UAC_CODE = "—";

const INDUSTRY_KEYS = ["industry_societies", "industry_experience", "career_pathways"];
const SECTION_POLL_MS = 5000;
const SECTION_GIVE_UP_MS = 90000;

const hasSection = (payload, key) => {
  const value = payload?.[key];
  return !!value && Object.keys(value).length > 0;
};

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
      } catch {
        // degree fetch failed — component renders without degree data
      }
    };

    fetchDegree();
  }, [degreeCode]);

  return degreeData;
};

const HANDBOOK_PROGRAM_URL = "https://www.handbook.unsw.edu.au/undergraduate/programs/2026";

const handbookUrlFor = (degree, degreeCode) => {
  if (!degreeCode) return null;
  const sourceUrl = degree?.source_url;
  return sourceUrl && sourceUrl.includes(`/${degreeCode}`) ? sourceUrl : `${HANDBOOK_PROGRAM_URL}/${degreeCode}`;
};

const extractDegreeCode = (degree) => {
  if (!degree) return null;
  const finalCode = degree.code || degree.degree_code || degree.program_code || null;
  if (!finalCode) {
    // no degree code available — caller handles null return
  }
  return finalCode;
};

const useRoadmapData = (preloadedPayload, preloadedRoadmapId, accessToken) => {
  const [data, setData] = useState(preloadedPayload);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sectionsStatus, setSectionsStatus] = useState("loading");
  const [pollKey, setPollKey] = useState(0);
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

  useEffect(() => {
    if (!preloadedRoadmapId) return;

    let stopped = false;
    let intervalId = null;
    const startedAt = Date.now();

    const check = async () => {
      const { data: row, error: pollError } = await supabase
        .from("unsw_roadmap")
        .select("payload")
        .eq("id", preloadedRoadmapId)
        .maybeSingle();

      if (stopped) return true;
      const timedOut = Date.now() - startedAt > SECTION_GIVE_UP_MS;
      if (pollError || !row) {
        if (timedOut) setSectionsStatus("failed");
        return timedOut;
      }

      const payload = row.payload || {};
      setData((prev) => ({ ...(prev || {}), ...payload }));

      const failed = payload.industry_failed || [];
      if (INDUSTRY_KEYS.every((k) => hasSection(payload, k)) && failed.length === 0) {
        setSectionsStatus("done");
        return true;
      }
      if (failed.length > 0 || timedOut) {
        setSectionsStatus("failed");
        return true;
      }
      return false;
    };

    setSectionsStatus("loading");
    check().then((finished) => {
      if (finished || stopped) return;
      intervalId = setInterval(async () => {
        if (await check()) clearInterval(intervalId);
      }, SECTION_POLL_MS);
    });

    return () => {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [preloadedRoadmapId, pollKey]);

  const retrySections = useCallback(async () => {
    if (!preloadedRoadmapId) return;
    setSectionsStatus("loading");
    try {
      await apiFetch(`/roadmap/unsw/${preloadedRoadmapId}/industry`, {
        method: "POST",
        token: accessToken,
        credentials: "include",
      });
    } catch (err) {
      console.error("Retrying roadmap sections failed:", err);
    }
    setPollKey((k) => k + 1);
  }, [preloadedRoadmapId, accessToken]);

  const updateHeader = useCallback((degree) => {
    setHeader({
      program_name: degree?.degree_name || degree?.program_name || null,
      uac_code: degree?.uac_code || null,
      degree_code: extractDegreeCode(degree),
    });
  }, []);

  return { data, loading, error, header, updateHeader, sectionsStatus, retrySections };
};

function SectionError({ onRetry }) {
  return (
    <div className="rounded-xl border border-slate-200/30 dark:border-slate-700/30 
                    bg-white/70 dark:bg-slate-900/60 
                    p-6 text-center shadow-sm backdrop-blur-sm">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        This section couldn't be generated.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="button-primary mt-3 inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}

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

const ContentSection = ({ data, loading, error, steps, activeIndex, onIndexChange, header }) => {
  if (!data && loading) {
    return (
      <>
        {header}
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-12 space-y-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={6} />
          <SkeletonCard lines={4} />
        </div>
      </>
    );
  }

  if (data) {
    return (
      <RoadmapFlow 
        steps={steps} 
        activeIndex={activeIndex} 
        onChange={onIndexChange} 
        header={header}
      />
    );
  }

  if (!data && !loading && !error) {
    return (
      <>
        {header}
        <div className="text-center py-16 text-secondary">
          Ready when you are. Your UNSW roadmap will appear here.
        </div>
      </>
    );
  }

  if (error && !loading) {
    return (
      <>
        {header}
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50/70 dark:border-red-700 dark:bg-red-900/40 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        </div>
      </>
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
  const { session } = UserAuth();

  const { data, loading, error, header, updateHeader, sectionsStatus, retrySections } = useRoadmapData(
    preloadedPayload,
    preloadedRoadmapId,
    session?.access_token
  );


  const fetchedDegree = useDegreeData(header.degree_code);
  const activeDegree = degree || fetchedDegree;
  const { program: enrolledProgram } = useEnrolledProgram();
  const shownDegreeCode = activeDegree ? extractDegreeCode(activeDegree) : header.degree_code;
  const isOwnProgram = !!enrolledProgram && enrolledProgram.degree_code === shownDegreeCode;
  const [specNames, setSpecNames] = useState([]);

  useEffect(() => {
    let active = true;
    fetchChosenSpecialisations(shownDegreeCode, session?.user?.id).then((specs) => {
      if (active) setSpecNames(specs.map((s) => s.name));
    });
    return () => { active = false; };
  }, [shownDegreeCode, session?.user?.id]);

  useEffect(() => {
    if (degree) { 
      updateHeader(degree);
    }
  }, [degree, updateHeader]);

  const steps = useMemo(() => {
    if (!data) return [];

    const industrySection = (key, content, title, message) => {
      const failed = data?.industry_failed?.includes(key) || !hasSection(data, key);
      if (sectionsStatus === "loading" && failed) {
        return <GeneratingMessage title={title} message={message} />;
      }
      if (failed) return <SectionError onRetry={retrySections} />;
      return content();
    };

    const degreeCodeValue = activeDegree ? extractDegreeCode(activeDegree) : header.degree_code;

    const renderers = {
      overview: () => <CapstoneHonours data={data} handbookUrl={handbookUrlFor(activeDegree, degreeCodeValue)} faculty={activeDegree?.faculty} />,
      structure: () => {
        if (!degreeCodeValue) {
          return (
            <div className="text-center py-10 text-secondary">
              Unable to load program structure. Please try again.
            </div>
          );
        }
        return (
          <ProgramStructureUNSW
            degreeCode={degreeCodeValue}
            trackCompletion={isOwnProgram}
            onChangeSpecialisation={() => navigate(`/roadmap?program=${degreeCodeValue}`)}
          />
        );
      },
      careers: () => industrySection(
        "career_pathways",
        () => <CareerPathways careerPathways={data.career_pathways} personal={isOwnProgram} />,
        "Generating Career Pathways...",
        "Mapping entry-level, mid-career, and senior roles for your field."
      ),
      internships: () => industrySection(
        "industry_experience",
        () => <IndustryExperience industryExperience={data.industry_experience} />,
        "Generating Internships...",
        "Finding internship programs and placements for your program."
      ),
      societies: () => industrySection(
        "industry_societies",
        () => <SocietiesCommunity societies={data.industry_societies} />,
        "Generating Societies & Community...",
        "Finding UNSW societies and community events for your program."
      ),
    };

    return ROADMAP_STEPS.map((step) => ({ ...step, render: renderers[step.key] }));
  }, [data, activeDegree, header, isOwnProgram, sectionsStatus, retrySections, navigate]);

  const { activeIndex, setActiveIndex } = useStepNavigation(
    search, 
    steps.length, 
    !!data, 
    preloadedRoadmapId
  );

  const headerProgramName =
    activeDegree?.degree_name ||
    activeDegree?.program_name ||
    header.program_name ||
    DEFAULT_PROGRAM_NAME;

  const handleBackClick = useCallback(
    () => navigate(isOwnProgram ? "/dashboard" : "/roadmap-entryload"),
    [navigate, isOwnProgram]
  );
  const handleMenuToggle = useCallback((open) => setIsMenuOpen(open), []);

  const headerFacts = [
    ["Faculty", activeDegree?.faculty?.replace(/^Faculty of\s+/i, "")],
    ["Duration", formatDuration(activeDegree?.duration_years, activeDegree?.duration)],
    ["Program code", shownDegreeCode],
    ["UAC code", activeDegree?.uac_code],
  ].filter(([, value]) => value);

  const programHeader = (
    <PageHeader
      back={{ label: isOwnProgram ? "Back" : "Back to my roadmap", onClick: handleBackClick }}
      actions={
        <>
          <Link to="/saved" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-white hover:underline">
            <Bookmark className="h-4 w-4" />
            My shortlist
          </Link>
          <button onClick={() => navigate("/roadmap")} className="text-[15px] font-semibold text-white hover:underline">
            Explore a different degree
          </button>
        </>
      }
      eyebrow={isOwnProgram ? "Your degree" : "Exploring"}
      title={headerProgramName}
      subtitle={specNames.length > 0 ? specNames.join(" · ") : null}
      aside={isOwnProgram ? <CourseProgress degreeCode={shownDegreeCode} /> : null}
    >
      <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
        {headerFacts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[13px] text-band-soft">{label}</dt>
            <dd className="mt-1 text-[17px] font-semibold text-band-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </PageHeader>
  );

  return (
    <div className="min-h-screen app-page text-primary transition-colors duration-500">
      <DashboardNavBar onMenuClick={() => handleMenuToggle(true)} isMenuOpen={isMenuOpen} />
      <MenuBar isOpen={isMenuOpen} handleClose={() => handleMenuToggle(false)} />

      <ContentSection
        header={programHeader}
        data={data}
        loading={loading}
        error={error}
        steps={steps}
        activeIndex={activeIndex}
        onIndexChange={setActiveIndex}
      />
    </div>
  );
}

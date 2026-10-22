import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SpotlightGuide from "@/shared/ui/SpotlightGuide";
import { hasSeenGuide } from "@/shared/lib/guideSeen";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";

import { formatDuration } from "@/shared/lib/format";
import CapstoneHonours from "../components/CapstoneHonours";
import DegreeRequirements from "../components/DegreeRequirements";
import GeneratingMessage from "../components/GeneratingMessage";
import MakeMyProgramButton from "../components/MakeMyProgramButton";
import ProgramStructureUNSW from "../components/ProgramStructureUNSW";
import RoadmapFlow from "../components/RoadmapFlow";
import SkeletonCard from "../components/SkeletonCard";
import SocietiesCommunity from "../components/SocietiesCommunity";
import CourseMesh from "@/features/mindmesh/components/CourseMesh";
import CareersContent from "@/features/careers/components/CareersContent";
import { HeaderStats } from "@/features/careers/components/GraduateStats";
import { useEnrolledProgram } from "../hooks/useEnrolledProgram";
import { fetchChosenSpecialisations } from "../utils/programCourses";
import { ROADMAP_VIEWS, roadmapViewUrl } from "../utils/roadmapSteps";
import { supabase } from "@/shared/lib/supabase";
import { apiFetch } from "@/shared/lib/api";
import { UserAuth } from "@/app/AuthContext";

const bandLink = "inline-flex items-center px-1 py-2 text-[15px] font-semibold text-band-ink underline-offset-4 hover:underline";

const DEFAULT_PROGRAM_NAME = "";
const DEFAULT_UAC_CODE = "—";
const SECTION_GUIDE_TEXT = {
  overview: "Start with what you need to graduate. Use the section menu on the left, or the bar above the content on mobile, to switch sections any time.",
  structure: "See your courses and mark the ones you've completed. The Courses help button explains how to manage them.",
  coursemesh: "See how your courses connect, what your ticked courses unlock and what you can take next.",
  societies: "Discover student societies and professional communities. Return to any section whenever you need it.",
};
const sectionGuideSteps = (view) => ROADMAP_VIEWS[view].steps.map(({ key, title }) => ({
  targets: [`[data-tour="roadmap-section-${key}"]`],
  title,
  text: SECTION_GUIDE_TEXT[key],
}));
const VIEW_COPY = {
  degree: { own: "My Program", exploring: "Exploring a program", back: "Back to My Program" },
  careers: { own: "My Career", exploring: "Exploring careers", back: "Back to My Career" },
};

const INDUSTRY_KEYS = ["industry_societies", "industry_experience", "career_pathways"];
const SECTION_POLL_MS = 5000;
const SECTION_GIVE_UP_MS = 90000;

const hasSection = (payload, key) => {
  const value = payload?.[key];
  return !!value && Object.keys(value).length > 0;
};

// Helper functions
const extractStepIndexFromUrl = (searchParams) => {
  const stepParam = new URLSearchParams(searchParams).get("step");
  const step = Number(stepParam);
  return Number.isInteger(step) && step >= 1 && step <= ROADMAP_VIEWS.degree.steps.length ? step - 1 : 0;
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

const useStepNavigation = (searchParams, hasData, preloadedRoadmapId) => {
  const [activeIndex, setActiveIndex] = useState(() => extractStepIndexFromUrl(searchParams));

  // Handle URL-based step navigation on mount
  useEffect(() => {
    const stepIndex = extractStepIndexFromUrl(searchParams);
    setActiveIndex(stepIndex);
  }, [searchParams]);

  // Sync activeIndex to URL (without page reload)
  useEffect(() => {
    if (!hasData || !preloadedRoadmapId) return;

    const section = new URLSearchParams(window.location.search).get("section");
    const sectionQuery = section ? `&section=${encodeURIComponent(section)}` : "";
    const newUrl = `${window.location.pathname}?id=${preloadedRoadmapId}&step=${activeIndex + 1}${sectionQuery}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeIndex, hasData, preloadedRoadmapId]);

  return { activeIndex, setActiveIndex };
};

const ContentSection = ({ data, loading, error, steps, activeIndex, onIndexChange, header, content = null }) => {
  if (!data && loading) {
    return (
      <>
        {header}
        <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-12 space-y-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={6} />
          <SkeletonCard lines={4} />
        </div>
      </>
    );
  }

  if (data && content) {
    return (
      <>
        {header}
        {content}
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
        sectionNavigation
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
        <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-12">
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
export default function RoadmapUNSWPage({ view = "degree" }) {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(search);

  const degree = state?.degree || null;
  const preloadedPayload = state?.payload || null;
  const preloadedRoadmapId = state?.roadmap_id || searchParams.get('id') || null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { session } = UserAuth();
  const [showSectionGuide, setShowSectionGuide] = useState(false);
  const sectionGuideKey = `univise-${view}-sections-guide-v2-${session?.user?.id || "guest"}`;
  const copy = VIEW_COPY[view];

  const { data, loading, error, header, updateHeader, sectionsStatus, retrySections } = useRoadmapData(
    preloadedPayload,
    preloadedRoadmapId,
    session?.access_token
  );


  const fetchedDegree = useDegreeData(header.degree_code);
  const roadmapReady = !!data;
  const isCareers = view === "careers";
  const [careersFocus] = useState(() => searchParams.get("section") || (searchParams.get("step") === "2" ? "internships" : null));
  useEffect(() => {
    if (isCareers || !roadmapReady || !session?.user?.id || hasSeenGuide(sectionGuideKey)) return;
    const timer = setTimeout(() => setShowSectionGuide(true), 500);
    return () => clearTimeout(timer);
  }, [isCareers, roadmapReady, sectionGuideKey, session?.user?.id]);
  const activeDegree = degree || fetchedDegree;
  const { program: enrolledProgram, loading: enrolledLoading } = useEnrolledProgram();
  const shownDegreeCode = activeDegree ? extractDegreeCode(activeDegree) : header.degree_code;
  const isOwnProgram = !!enrolledProgram && enrolledProgram.degree_code === shownDegreeCode;
  const [specNames, setSpecNames] = useState([]);
  const [meshFocus, setMeshFocus] = useState(() => searchParams.get("focus"));

  useEffect(() => {
    let active = true;
    fetchChosenSpecialisations(shownDegreeCode, session?.user?.id).then((specs) => {
      if (active) setSpecNames(specs.map((s) => s.name));
    });
    return () => { active = false; };
  }, [shownDegreeCode, session?.user?.id]);

  const { activeIndex, setActiveIndex } = useStepNavigation(
    search,
    !!data,
    preloadedRoadmapId
  );
  const stepIndex = useCallback((key) => ROADMAP_VIEWS[view].steps.findIndex((s) => s.key === key), [view]);
  const openCourseMesh = useCallback((code) => {
    setMeshFocus(code || null);
    setActiveIndex(stepIndex("coursemesh"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setActiveIndex, stepIndex]);

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
      overview: () => (
        <CapstoneHonours data={data} handbookUrl={handbookUrlFor(activeDegree, degreeCodeValue)} faculty={activeDegree?.faculty}>
          {degreeCodeValue && (
            <DegreeRequirements
              degreeCode={degreeCodeValue}
              onChangeSpecialisation={() => navigate(`/roadmap?program=${degreeCodeValue}`)}
            />
          )}
        </CapstoneHonours>
      ),
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
            onOpenCourseMesh={openCourseMesh}
          />
        );
      },
      coursemesh: () => (
        <CourseMesh
          programCode={degreeCodeValue}
          focus={meshFocus}
          onOpenCourses={() => {
            setMeshFocus(null);
            setActiveIndex(stepIndex("structure"));
          }}
        />
      ),
      societies: () => industrySection(
        "industry_societies",
        () => <SocietiesCommunity societies={data.industry_societies} />,
        "Generating Societies & Community...",
        "Finding UNSW societies and community events for your program."
      ),
    };

    return ROADMAP_VIEWS[view].steps.map((step) => ({ ...step, render: renderers[step.key] }));
  }, [data, activeDegree, header, isOwnProgram, sectionsStatus, retrySections, navigate, view, meshFocus, openCourseMesh, setActiveIndex, stepIndex]);

  const headerProgramName =
    activeDegree?.degree_name ||
    activeDegree?.program_name ||
    header.program_name ||
    DEFAULT_PROGRAM_NAME;

  const handleBackClick = useCallback(
    () => navigate(isOwnProgram ? "/dashboard" : roadmapViewUrl(view)),
    [navigate, isOwnProgram, view]
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
      back={isOwnProgram ? undefined : { label: copy.back, onClick: handleBackClick }}
      actions={
        <>
          {data && !isCareers && (
            <button
              type="button"
              onClick={() => setShowSectionGuide(true)}
              className={bandLink}
              aria-label="Show roadmap section tour"
            >
              Section tour
            </button>
          )}
          {!isCareers && !enrolledLoading && !isOwnProgram && shownDegreeCode && headerProgramName && (
            <MakeMyProgramButton degreeCode={shownDegreeCode} programName={activeDegree?.program_name || headerProgramName} view={view} />
          )}
          <Link to="/saved" className={bandLink}>
            My shortlist
          </Link>
          <button onClick={() => navigate(view === "careers" ? "/roadmap?view=careers" : "/roadmap")} className={bandLink}>
            Explore a different degree
          </button>
        </>
      }
      eyebrow={isOwnProgram ? copy.own : copy.exploring}
      title={
        isCareers && specNames.length > 0 ? (
          <>
            {headerProgramName}
            <span className="ml-2 align-middle text-base font-semibold text-band-soft md:text-lg">· {specNames.join(" · ")}</span>
          </>
        ) : headerProgramName
      }
      subtitle={!isCareers && specNames.length > 0 ? specNames.join(" · ") : null}
      compact
      slim={isCareers}
      wide={isCareers}
    >
      {isCareers && <HeaderStats outlook={data?.career_pathways?.outlook} />}
      {!isCareers && (
        <p className="mt-2 text-[15px] text-band-soft">
          {headerFacts.map(([label, value]) => (label === "Program code" ? `Program ${value}` : label === "UAC code" ? `UAC ${value}` : value)).join(" · ")}
        </p>
      )}
    </PageHeader>
  );

  return (
    <div className="min-h-screen app-page text-primary transition-colors duration-500">
      <DashboardNavBar onMenuClick={() => handleMenuToggle(true)} isMenuOpen={isMenuOpen} />
      <MenuBar isOpen={isMenuOpen} handleClose={() => handleMenuToggle(false)} />
      {showSectionGuide && data && !isCareers && (
        <SpotlightGuide
          steps={sectionGuideSteps(view)}
          seenKey={sectionGuideKey}
          onClose={() => setShowSectionGuide(false)}
        />
      )}

      <ContentSection
        header={programHeader}
        data={data}
        loading={loading}
        error={error}
        steps={steps}
        content={isCareers ? (
          <CareersContent
            roadmapId={preloadedRoadmapId}
            data={data}
            sectionsStatus={sectionsStatus}
            onRetry={retrySections}
            personal={isOwnProgram}
            focusSection={careersFocus}
          />
        ) : null}
        activeIndex={activeIndex}
        onIndexChange={(index) => {
          setMeshFocus(null);
          setActiveIndex(index);
        }}
      />
    </div>
  );
}

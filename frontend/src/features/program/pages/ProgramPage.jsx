import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserAuth } from "@/app/AuthContext";
import { ExternalLink } from "lucide-react";
import AppNav from "@/shared/layout/AppNav";
import PageHeader from "@/shared/layout/PageHeader";
import { formatDuration } from "@/shared/lib/format";
import { hasSeenGuide } from "@/shared/lib/guideSeen";
import { handbookUrl } from "@/shared/lib/handbook";
import SpotlightGuide from "@/shared/ui/SpotlightGuide";
import CoursesPanel from "../components/CoursesPanel";
import CoursesStrip from "../components/CoursesStrip";
import { useUocProgress } from "../hooks/useUocProgress";
import GeneratingMessage from "../components/GeneratingMessage";
import MakeMyProgramButton from "../components/MakeMyProgramButton";
import MyCoursesTab from "../components/MyCoursesTab";
import ProgramHeaderMenu from "../components/ProgramHeaderMenu";
import ProgramTabs from "../components/ProgramTabs";
import RoadmapStatus from "../components/RoadmapStatus";
import SaveProgramButton from "../components/SaveProgramButton";
import SocietiesTab from "../components/SocietiesTab";
import NextCoursesTab from "../components/NextCoursesTab";
import CourseMesh from "../coursemesh/components/CourseMesh";
import { useDegree } from "../hooks/useDegree";
import { useEnrolledProgram } from "../hooks/useEnrolledProgram";
import { hasSection, useRoadmap } from "../hooks/useRoadmap";
import { useSpecialisationNames } from "../hooks/useSpecialisationNames";
import { useStepNavigation } from "../hooks/useStepNavigation";
import { ROADMAP_VIEWS, roadmapViewUrl } from "../utils/roadmapSteps";

const STEPS = ROADMAP_VIEWS.degree.steps;
const SECTION_GUIDE_TEXT = {
  structure: "Tick the courses you've finished. Use these tabs to switch sections.",
  next: "Courses you can take now, with the skills and careers each one builds.",
  coursemesh: "A map of how your courses connect and what they unlock.",
  societies: "Student societies and professional groups for your degree.",
};
const sectionGuideSteps = (steps) => steps.map(({ key, title }) => ({
  targets: [`[data-tour="roadmap-section-${key}"]`],
  title,
  text: SECTION_GUIDE_TEXT[key],
}));
const stepIndex = (key) => STEPS.findIndex((s) => s.key === key);

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

export default function ProgramPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(search);
  const roadmapId = searchParams.get("id");

  const { session } = UserAuth();
  const [showSectionGuide, setShowSectionGuide] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [ticksVersion, setTicksVersion] = useState(0);
  const sectionGuideKey = `univise-degree-sections-guide-v2-${session?.user?.id || "guest"}`;

  const { data, loading, error, header, sectionsStatus, retrySections } = useRoadmap(roadmapId, session?.access_token);
  const activeDegree = useDegree(header.degree_code);
  const { program: enrolledProgram, loading: enrolledLoading } = useEnrolledProgram();
  const specNames = useSpecialisationNames(header.degree_code, session?.user?.id);
  const degreeCode = header.degree_code;
  const isOwnProgram = !!enrolledProgram && enrolledProgram.degree_code === degreeCode;
  const visibleSteps = useMemo(() => STEPS.filter((step) => (step.key !== "next" || isOwnProgram) && (step.key !== "structure" || !isOwnProgram)), [isOwnProgram]);
  const [meshFocus, setMeshFocus] = useState(() => searchParams.get("focus"));

  useEffect(() => {
    if (!data || !session?.user?.id || hasSeenGuide(sectionGuideKey)) return;
    const timer = setTimeout(() => setShowSectionGuide(true), 500);
    return () => clearTimeout(timer);
  }, [data, sectionGuideKey, session?.user?.id]);

  const { activeIndex, setActiveIndex } = useStepNavigation(search, !!data, roadmapId);
  // Keep the existing URL step numbers stable when Next courses is hidden.
  const activeStepKey = STEPS[activeIndex]?.key;
  const visibleActiveIndex = Math.max(0, visibleSteps.findIndex((step) => step.key === activeStepKey));
  useEffect(() => {
    if (degreeCode && !enrolledLoading && !isOwnProgram && activeStepKey === "next") setActiveIndex(0);
  }, [degreeCode, enrolledLoading, isOwnProgram, activeStepKey, setActiveIndex]);
  const tickProgress = useUocProgress(isOwnProgram ? degreeCode : null, session?.user?.id, ticksVersion);
  const autoOpened = useRef(false);
  const [firstVisit, setFirstVisit] = useState(false);
  useEffect(() => {
    if (!data || !isOwnProgram || tickProgress?.count !== 0 || autoOpened.current) return;
    autoOpened.current = true;
    setFirstVisit(true);
    setCoursesOpen(true);
  }, [data, isOwnProgram, tickProgress]);
  const closeCourses = useCallback(() => {
    setFirstVisit(false);
    setCoursesOpen(false);
    setTicksVersion((version) => version + 1);
  }, []);
  useEffect(() => {
    if (!degreeCode || enrolledLoading || !isOwnProgram || activeStepKey !== "structure") return;
    setActiveIndex(stepIndex("next"));
    if (new URLSearchParams(search).get("step") === "1") setCoursesOpen(true);
  }, [degreeCode, enrolledLoading, isOwnProgram, activeStepKey, search, setActiveIndex]);
  const openCourseMesh = useCallback((code) => {
    setCoursesOpen(false);
    setTicksVersion((version) => version + 1);
    setMeshFocus(code || null);
    setActiveIndex(stepIndex("coursemesh"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setActiveIndex]);

  useEffect(() => {
    if (activeIndex !== stepIndex("coursemesh")) setMeshFocus(null);
  }, [activeIndex]);

  const steps = useMemo(() => {
    if (!data) return [];

    const generatedSection = (key, content, title, message) => {
      const failed = data?.industry_failed?.includes(key) || !hasSection(data, key);
      if (sectionsStatus === "loading" && failed) {
        return <GeneratingMessage title={title} message={message} />;
      }
      if (failed) return <SectionError onRetry={retrySections} />;
      return content();
    };

    const renderers = {
      structure: () => {
        if (!degreeCode) {
          return (
            <div className="text-center py-10 text-secondary">
              Unable to load program structure. Please try again.
            </div>
          );
        }
        return (
          <MyCoursesTab
            degreeCode={degreeCode}
            trackCompletion={isOwnProgram}
            onChangeSpecialisation={() => navigate(`/roadmap?program=${degreeCode}`)}
            onOpenCourseMesh={openCourseMesh}
          />
        );
      },
      next: () => (
        <>
        {isOwnProgram && <CoursesStrip degreeCode={degreeCode} version={ticksVersion} onOpen={() => setCoursesOpen(true)} />}
        <NextCoursesTab
          key={ticksVersion}
          degreeCode={degreeCode}
          isOwnProgram={isOwnProgram}
          onOpenCourses={() => setCoursesOpen(true)}
          onOpenCourseMesh={openCourseMesh}
        />
        </>
      ),
      coursemesh: () => (
        <>
        {isOwnProgram && <CoursesStrip degreeCode={degreeCode} version={ticksVersion} onOpen={() => setCoursesOpen(true)} />}
        <CourseMesh
          key={ticksVersion}
          programCode={degreeCode}
          focus={meshFocus}
        />
        </>
      ),
      societies: () => generatedSection(
        "industry_societies",
        () => <SocietiesTab societies={data.industry_societies} />,
        "Generating Societies & Community...",
        "Finding UNSW societies and community events for your program."
      ),
    };

    return visibleSteps.map((step) => ({ ...step, render: renderers[step.key] }));
  }, [data, degreeCode, isOwnProgram, sectionsStatus, retrySections, navigate, visibleSteps, meshFocus, openCourseMesh, ticksVersion]);

  const programName = activeDegree?.program_name || header.program_name || "";
  const handbookLink = degreeCode ? handbookUrl("programs", degreeCode, activeDegree?.source_url) : null;
  const headerFacts = [
    activeDegree?.faculty?.replace(/^Faculty of\s+/i, ""),
    formatDuration(activeDegree?.duration_years, activeDegree?.duration),
    degreeCode && `Program ${degreeCode}`,
    activeDegree?.uac_code && `UAC ${activeDegree.uac_code}`,
  ].filter(Boolean);

  const programHeader = (
    <PageHeader
      back={isOwnProgram ? undefined : { label: "Back to My Program", onClick: () => navigate(roadmapViewUrl("degree")) }}
      actions={
        <>
          {!enrolledLoading && !isOwnProgram && (
            <SaveProgramButton degreeCode={degreeCode} degree={activeDegree} programName={programName} />
          )}
          {!enrolledLoading && !isOwnProgram && degreeCode && programName && (
            <MakeMyProgramButton degreeCode={degreeCode} programName={programName} />
          )}
          <ProgramHeaderMenu
            onTour={data ? () => setShowSectionGuide(true) : null}
            onExplore={() => navigate("/roadmap")}
          />
        </>
      }
      eyebrow={isOwnProgram ? "My Program" : "Exploring a program"}
      title={programName}
      subtitle={specNames.length > 0 ? specNames.join(" · ") : null}
      compact
    >
      <div className="mt-2 flex flex-col gap-2 text-[15px] text-band-soft">
        <p className="min-w-0">{headerFacts.join(" · ")}</p>
        {handbookLink && (
          <p>
            <a href={handbookLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-band-ink underline underline-offset-4">
              Full program rules on UNSW Handbook <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </p>
        )}
      </div>
    </PageHeader>
  );

  return (
    <div className="min-h-screen app-page text-primary transition-colors duration-500">
      <AppNav />
      {showSectionGuide && data && (
        <SpotlightGuide
          steps={sectionGuideSteps(visibleSteps)}
          seenKey={sectionGuideKey}
          onClose={() => setShowSectionGuide(false)}
        />
      )}
      {isOwnProgram && degreeCode && (
        <CoursesPanel open={coursesOpen} onClose={closeCourses} intro={firstVisit ? "Tick the courses you've completed so your suggestions are accurate." : null}>
          <MyCoursesTab
            degreeCode={degreeCode}
            trackCompletion
            onChangeSpecialisation={() => navigate(`/roadmap?program=${degreeCode}`)}
            onOpenCourseMesh={openCourseMesh}
          />
        </CoursesPanel>
      )}
      {data ? (
        <ProgramTabs
          steps={steps}
          activeIndex={visibleActiveIndex}
          onChange={(index) => {
            setMeshFocus(null);
            setActiveIndex(stepIndex(visibleSteps[index].key));
          }}
          header={programHeader}
          sectionNavigation
        />
      ) : (
        <>
          {programHeader}
          <RoadmapStatus loading={loading} error={error} />
        </>
      )}
    </div>
  );
}

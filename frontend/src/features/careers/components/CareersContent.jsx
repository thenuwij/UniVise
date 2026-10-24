import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, Briefcase, Building2, Route, Users } from "lucide-react";
import { useCareersFeed } from "../hooks/useCareersFeed";
import { useSavedAds } from "../hooks/useSavedAds";
import { mergeListings } from "../utils/careersListings";
import { CalendarLinks, EventRows } from "./AdRows";
import CareerPathsSection from "./CareerPathsSection";
import SectionNavigation from "@/shared/ui/SectionNavigation";
import CareersSection, { SubLabel } from "./CareersSection";
import CareerCertifications from "./CareerCertifications";
import CertificationsList from "./CertificationsList";
import GraduateStats from "./GraduateStats";
import InternshipsSection from "./InternshipsSection";
import JobsSection from "./JobsSection";
import ProfessionalBodies from "./ProfessionalBodies";
import "../careers.css";

const SOURCE_LABELS = { adzuna: "Adzuna", ai_jobs: "Top picks", ai_internships: "Top picks", ai_networking: "Web search" };

const TOP_PICKS = ["ai_jobs", "ai_internships"];

const hasPart =(data, key) => !!data?.[key] && Object.keys(data[key]).length > 0;

const aiStatus = (data, key, sectionsStatus) => {
  if (hasPart(data, key) && !data?.industry_failed?.includes(key)) return "done";
  return sectionsStatus === "loading" ? "loading" : "failed";
};

const SECTION_IDS = ["jobs", "internships", "networking", "certifications", "career-outlook"];

export default function CareersContent({ roadmapId, data, sectionsStatus, onRetry, personal }) {
  const careersState = aiStatus(data, "career_pathways", sectionsStatus);
  const internshipsState = aiStatus(data, "industry_experience", sectionsStatus);
  const careersReady = careersState === "done";
  const { sources, loadFailed, retryLoad, refresh } = useCareersFeed(careersReady && personal ? roadmapId : null);

  const { savedIds, toggleSave } = useSavedAds();
  const feedLoading = !sources && !loadFailed && careersState !== "failed";

  const feed = (key) => sources?.[key];
  const items = (key, kind) => (feed(key)?.items || []).filter((item) => !kind || item.kind === kind);
  const ready = (...keys) => !!sources && keys.every((key) => feed(key)?.status !== "running" || items(key).length > 0);

  const jobs = sources ? mergeListings(items("ai_jobs"), items("adzuna", "job")) : null;
  const openAds = sources ? mergeListings(items("ai_internships"), items("adzuna", "internship")) : null;
  const events = items("ai_networking").filter((item) => item.kind !== "calendar");
  const calendars = items("ai_networking").filter((item) => item.kind === "calendar");

  const sourceStatus = (key) => {
    const state = feed(key);
    if (!state || state.status === "never") return null;
    if (TOP_PICKS.includes(key) && state.status === "failed") return null;
    return { label: SOURCE_LABELS[key], status: state.status, refreshedAt: state.refreshed_at, onRetry: () => refresh(key) };
  };
  const statuses = (...keys) => keys.map(sourceStatus).filter(Boolean);
  const programCount = data?.industry_experience?.internship_programs?.length || 0;
  const certifications = data?.career_pathways?.certifications || [];

  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("section") || (searchParams.get("step") === "2" ? "internships" : null);
  const section = SECTION_IDS.includes(requested) ? requested : "jobs";
  const openSection = useCallback(
    (id) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("step", "1");
        if (id) next.set("section", id);
        else next.delete("section");
        return next;
      });
      window.scrollTo({ top: 0 });
    },
    [setSearchParams]
  );

  const internshipCount = (openAds?.length || 0) + programCount;
  const sections = [
    { id: "jobs", title: "Jobs", icon: Briefcase, meta: jobs ? String(jobs.length) : null },
    { id: "internships", title: "Internships", icon: Building2, meta: internshipsState === "done" ? String(internshipCount) : null },
    { id: "networking", title: "Networking", mobileTitle: "Network", icon: Users, meta: sources ? String(events.length) : null },
    { id: "certifications", title: "Certifications", mobileTitle: "Certs", icon: Award, meta: careersReady && !personal ? String(certifications.length) : null },
    { id: "career-outlook", title: "Career outlook", navTitle: "Outlook", icon: Route },
  ];
  const activeIndex = SECTION_IDS.indexOf(section);

  const certificationsSection = (
    <CareersSection
      id="certifications"
      title="Certifications"
      count={careersReady && !personal ? certifications.length : null}
      description={personal ? "Industry certifications employers value for each of your careers, with where to start." : "Industry certifications that strengthen your applications, with how long each takes."}
      status={careersReady ? null : careersState}
      loadingText="Finding certifications for your field."
      onRetry={onRetry}
    >
      {careersReady && (personal ? <CareerCertifications roadmapId={roadmapId} /> : <CertificationsList certifications={certifications} />)}
    </CareersSection>
  );

  const careerPaths = (
    <CareersSection
      id="career-outlook"
      title="Career outlook"
      description="The roles your degree leads to, from first job to senior, with typical salaries."
      status={careersReady ? null : careersState}
      loadingText="Mapping entry-level, mid-career and senior roles for your field."
      onRetry={onRetry}
    >
      {careersReady && (
        <>
          <GraduateStats outlook={data.career_pathways.outlook} />
          <CareerPathsSection careerPathways={data.career_pathways} personal={personal} jobs={jobs} />
        </>
      )}
    </CareersSection>
  );

  if (!personal) {
    return (
      <div className="careers-page mx-auto max-w-[1680px] px-5 md:px-10 pb-16">
        <p className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink-muted">
          Jobs, internships and networking events show for your own program. Make this your program to see them.
        </p>
        {certificationsSection}
        {careerPaths}
      </div>
    );
  }

  const banner = loadFailed && (
    <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
      Today's jobs, internships and events couldn't load.{" "}
      <button type="button" onClick={retryLoad} className="font-semibold underline hover:no-underline">
        Try again
      </button>
    </p>
  );

  const sectionContent = {
    jobs: (
      <CareersSection
        id="jobs"
        title="Jobs hiring now"
        count={jobs?.length}
        description="Graduate and junior roles for your degree: top picks chosen from SEEK, plus Adzuna's latest ads."
        status={careersReady ? (feedLoading ? "loading" : null) : careersState}
        sources={statuses("adzuna", "ai_jobs")}
        loadingText="Finding the best graduate jobs for your degree. The first time takes about a minute."
        onRetry={onRetry}
      >
        {careersState !== "failed" && (
          <JobsSection
            jobs={ready("adzuna", "ai_jobs") ? jobs : null}
            savedIds={savedIds}
            onToggleSave={toggleSave}
          />
        )}
      </CareersSection>
    ),
    internships: (
      <CareersSection
        id="internships"
        title="Internships"
        count={internshipsState === "done" ? internshipCount : null}
        description="Internships open now, programs that open each year, and placements in your degree."
        status={internshipsState === "done" ? (feedLoading ? "loading" : null) : internshipsState}
        sources={statuses("adzuna", "ai_internships")}
        loadingText="Finding internships for your degree. The first time takes about a minute."
        onRetry={onRetry}
      >
        {internshipsState === "done" && (
          <InternshipsSection
            industryExperience={data.industry_experience}
            openAds={ready("adzuna", "ai_internships") ? openAds : null}
            savedIds={savedIds}
            onToggleSave={toggleSave}
            personal={personal}
          />
        )}
      </CareersSection>
    ),
    networking: (
      <CareersSection
        id="networking"
        title="Networking"
        count={sources ? events.length : null}
        description="Career fairs, industry nights and society events where you can meet people in your field."
        status={feedLoading ? "loading" : null}
        sources={statuses("ai_networking")}
        loadingText="Looking for upcoming events in Sydney for your field. This takes up to a minute."
      >
        {!ready("ai_networking") ? (
          <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" aria-hidden />
        ) : (
          <div className="space-y-12">
            <div>
              <SubLabel hint="The next 8 weeks, in Sydney and online">Upcoming events</SubLabel>
              <div className="mt-4">
                {events.length > 0 ? (
                  <EventRows events={events} />
                ) : (
                  <p className="text-[15px] text-ink-muted">No upcoming events found today. We look again each day for events in your field.</p>
                )}
              </div>
            </div>
            {calendars.length > 0 && (
              <div>
                <SubLabel hint="Organisations that run events in your field">Event calendars to keep an eye on</SubLabel>
                <div className="mt-4">
                  <CalendarLinks calendars={calendars} />
                </div>
              </div>
            )}
            <ProfessionalBodies societies={data?.industry_societies} />
          </div>
        )}
      </CareersSection>
    ),
    certifications: certificationsSection,
    "career-outlook": careerPaths,
  };

  return (
    <div className="careers-page mx-auto grid max-w-[1680px] items-start gap-6 px-5 pb-16 md:px-10 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-8 lg:pt-8">
      <SectionNavigation
        sections={sections.map((item) => ({ ...item, key: item.id }))}
        activeIndex={activeIndex}
        onChange={(index) => openSection(sections[index].id)}
        label="Career sections"
        heading="IN MY CAREER"
      />
      <div className="min-w-0 [&>.careers-section]:pt-0">
        {banner}
        {sectionContent[section]}
      </div>
    </div>
  );
}

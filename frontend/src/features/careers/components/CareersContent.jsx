import { useEffect } from "react";
import { Award, Briefcase, Building2, CalendarDays, CalendarRange, Route, Users } from "lucide-react";
import { useCareersFeed } from "../hooks/useCareersFeed";
import { mergeListings } from "../utils/careersListings";
import { CalendarLinks, EventRows } from "./AdRows";
import CareerPathsSection from "./CareerPathsSection";
import CareersSection, { SubLabel } from "./CareersSection";
import CertificationsList from "./CertificationsList";
import GraduateStats from "./GraduateStats";
import InternshipsSection from "./InternshipsSection";
import JobsSection from "./JobsSection";
import "../careers.css";

const SOURCE_LABELS = { adzuna: "Adzuna", ai_jobs: "Top picks", ai_internships: "Top picks", ai_networking: "Web search" };

const hasPart = (data, key) => !!data?.[key] && Object.keys(data[key]).length > 0;

const aiStatus = (data, key, sectionsStatus) => {
  if (hasPart(data, key) && !data?.industry_failed?.includes(key)) return "done";
  return sectionsStatus === "loading" ? "loading" : "failed";
};

function SectionNav({ sections }) {
  return (
    <nav aria-label="Careers sections">
      <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map(({ id, title, icon: Icon, meta }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium text-ink border border-line bg-surface hover:border-blue-300 hover:text-link transition-colors"
            >
              <Icon className="h-4 w-4 text-ink-muted" />
              <span>{title}</span>
              {meta && <span className="text-xs font-normal text-ink-muted">{meta}</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function CareersContent({ roadmapId, data, sectionsStatus, onRetry, personal, focusSection }) {
  const entryRoles = data?.career_pathways?.entry_level?.roles;
  const careersState = aiStatus(data, "career_pathways", sectionsStatus);
  const internshipsState = aiStatus(data, "industry_experience", sectionsStatus);
  const careersReady = careersState === "done";
  const { sources, loadFailed, refresh } = useCareersFeed(careersReady && personal ? roadmapId : null);

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
    return { label: SOURCE_LABELS[key], status: state.status, refreshedAt: state.refreshed_at, onRetry: () => refresh(key) };
  };
  const statuses = (...keys) => keys.map(sourceStatus).filter(Boolean);
  const programCount = data?.industry_experience?.internship_programs?.length || 0;
  const certifications = data?.career_pathways?.certifications || [];

  const sections = [
    { id: "jobs", title: "Jobs", icon: Briefcase, meta: jobs ? String(jobs.length) : null },
    { id: "internships", title: "Internships", icon: Building2, meta: internshipsState === "done" ? String((openAds?.length || 0) + programCount) : null },
    { id: "networking", title: "Networking", icon: Users, meta: sources ? String(events.length) : null },
    { id: "certifications", title: "Certifications", icon: Award, meta: careersReady ? String(certifications.length) : null },
    { id: "career-outlook", title: "Career outlook", icon: Route, meta: null },
  ];

  useEffect(() => {
    if (!focusSection) return;
    document.getElementById(focusSection)?.scrollIntoView({ behavior: "smooth" });
  }, [focusSection]);

  const certificationsSection = (
    <CareersSection
      id="certifications"
      icon={Award}
      title="Certifications"
      description="Industry certifications that strengthen your applications, with how long each takes."
      status={careersReady ? null : careersState}
      loadingText="Finding certifications for your field."
      onRetry={onRetry}
    >
      {careersReady && <CertificationsList certifications={certifications} />}
    </CareersSection>
  );

  const careerPaths = (
    <CareersSection
      id="career-outlook"
      icon={Route}
      title="Career outlook"
      description="The roles your degree leads to, from first job to senior, with typical salaries."
      status={careersReady ? null : careersState}
      loadingText="Mapping entry-level, mid-career and senior roles for your field."
      onRetry={onRetry}
    >
      {careersReady && <CareerPathsSection careerPathways={data.career_pathways} personal={personal} jobs={jobs} />}
    </CareersSection>
  );

  if (!personal) {
    return (
      <div className="careers-page px-5 md:px-10 pb-16">
        <GraduateStats outlook={data?.career_pathways?.outlook} />
        <p className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
          Jobs, internships and networking events show for your own program. Make this your program to see them.
        </p>
        {certificationsSection}
        {careerPaths}
      </div>
    );
  }

  return (
    <div className="careers-page px-5 md:px-10 pb-16">
      <div className="sticky top-0 z-20 -mx-5 md:-mx-10 px-5 md:px-10 py-3 bg-page/95 backdrop-blur border-b border-line">
        <SectionNav sections={sections} />
      </div>
      <GraduateStats outlook={data?.career_pathways?.outlook} />

      <div>
        {loadFailed && (
          <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Today's jobs, internships and events couldn't load. Refresh the page to try again.
          </p>
        )}

        <CareersSection
          id="jobs"
          icon={Briefcase}
          title="Jobs hiring now"
          description="Graduate and junior roles for your degree: top picks chosen from SEEK, plus Adzuna's latest ads."
          status={careersReady ? null : careersState}
          sources={statuses("adzuna", "ai_jobs")}
          loadingText="Finding the best graduate jobs for your degree. The first time takes about a minute."
          onRetry={onRetry}
        >
          {careersState !== "failed" && <JobsSection jobs={ready("adzuna", "ai_jobs") ? jobs : null} roles={entryRoles} />}
        </CareersSection>

        <CareersSection
          id="internships"
          icon={Building2}
          title="Internships"
          description="Internships open now, programs that open each year, and placements in your degree."
          status={internshipsState === "done" ? null : internshipsState}
          sources={statuses("adzuna", "ai_internships")}
          loadingText="Finding internships for your degree. The first time takes about a minute."
          onRetry={onRetry}
        >
          {internshipsState === "done" && (
            <InternshipsSection
              industryExperience={data.industry_experience}
              openAds={ready("adzuna", "ai_internships") ? openAds : null}
            />
          )}
        </CareersSection>

        <CareersSection
          id="networking"
          icon={Users}
          title="Networking"
          description="Career fairs, industry nights and society events where you can meet people in your field."
          sources={statuses("ai_networking")}
          loadingText="Looking for upcoming events in Sydney for your field. This takes up to a minute."
        >
          {!ready("ai_networking") ? (
            <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" aria-hidden />
          ) : (
            <div className="space-y-10 [&>*+*]:border-t [&>*+*]:border-line [&>*+*]:pt-10">
              <div>
                <SubLabel icon={CalendarDays} hint="The next 8 weeks, in Sydney and online">Upcoming events</SubLabel>
                <div className="mt-4">
                  {events.length > 0 ? (
                    <EventRows events={events} />
                  ) : (
                    <p className="text-sm text-ink-muted">No upcoming events found today. We look again each day for events in your field.</p>
                  )}
                </div>
              </div>
              {calendars.length > 0 && (
                <div>
                  <SubLabel icon={CalendarRange} hint="Organisations that run events in your field">Event calendars to keep an eye on</SubLabel>
                  <div className="mt-4">
                    <CalendarLinks calendars={calendars} />
                  </div>
                </div>
              )}
            </div>
          )}
        </CareersSection>

        {certificationsSection}
        {careerPaths}
      </div>
    </div>
  );
}

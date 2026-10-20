import { useEffect, useMemo } from "react";
import { Briefcase, Building2, Route, Users } from "lucide-react";
import { useJobAds } from "@/features/roadmap/hooks/useHiringNow";
import { splitAds } from "@/features/roadmap/utils/hiringNow";
import CareerPathsSection from "./CareerPathsSection";
import CareersSection from "./CareersSection";
import InternshipsSection from "./InternshipsSection";
import JobsSection from "./JobsSection";
import "../careers.css";

const hasPart = (data, key) => !!data?.[key] && Object.keys(data[key]).length > 0;

const aiStatus = (data, key, sectionsStatus) => {
  if (hasPart(data, key) && !data?.industry_failed?.includes(key)) return "done";
  return sectionsStatus === "loading" ? "loading" : "failed";
};

function SectionNav({ sections }) {
  return (
    <nav aria-label="Careers sections">
      <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:gap-0.5">
        {sections.map(({ id, title, icon: Icon, meta }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink border border-line bg-surface lg:border-transparent lg:bg-transparent hover:bg-surface-tint hover:text-link transition-colors"
            >
              <Icon className="h-4 w-4 text-ink-muted" />
              <span className="flex-1">{title}</span>
              {meta && <span className="hidden lg:inline text-xs font-normal text-ink-muted">{meta}</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function CareersContent({ data, sectionsStatus, onRetry, personal, focusSection }) {
  const entryRoles = data?.career_pathways?.entry_level?.roles;
  const ads = useJobAds(entryRoles);
  const split = useMemo(() => (ads ? splitAds(ads) : null), [ads]);
  const careersState = aiStatus(data, "career_pathways", sectionsStatus);
  const internshipsState = aiStatus(data, "industry_experience", sectionsStatus);
  const careersReady = careersState === "done";
  const jobs = careersReady ? split?.jobs ?? null : null;
  const openAds = careersReady ? split?.internships ?? null : [];
  const programCount = data?.industry_experience?.internship_programs?.length || 0;

  const sections = [
    { id: "jobs", title: "Jobs", icon: Briefcase, meta: jobs ? String(jobs.length) : null },
    { id: "internships", title: "Internships", icon: Building2, meta: internshipsState === "done" ? String((openAds?.length || 0) + programCount) : null },
    { id: "networking", title: "Networking", icon: Users, meta: "Soon" },
    { id: "career-paths", title: "Career paths", icon: Route, meta: null },
  ];

  useEffect(() => {
    if (!focusSection) return;
    document.getElementById(focusSection)?.scrollIntoView({ behavior: "smooth" });
  }, [focusSection]);

  return (
    <div className="careers-page max-w-[1280px] mx-auto px-5 md:px-10 pt-6 pb-16 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <aside className="sticky top-0 z-20 -mx-5 px-5 py-3 mb-4 bg-page/95 backdrop-blur lg:mx-0 lg:px-0 lg:py-0 lg:mb-0 lg:top-6 lg:self-start lg:bg-transparent lg:backdrop-blur-none">
        <p className="hidden lg:block px-3 mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">On this page</p>
        <SectionNav sections={sections} />
      </aside>

      <div className="space-y-6">
        <CareersSection
          id="jobs"
          icon={Briefcase}
          title="Jobs hiring now"
          description="Graduate and junior roles for your degree's entry-level careers."
          status={careersReady ? null : careersState}
          loadingText="Checking for new graduate jobs for your degree's roles."
          onRetry={onRetry}
        >
          {careersState !== "failed" && <JobsSection jobs={jobs} roles={entryRoles} />}
        </CareersSection>

        <CareersSection
          id="internships"
          icon={Building2}
          title="Internships"
          description="Ads open now, programs that open each year, and placements in your degree."
          status={internshipsState === "done" ? null : internshipsState}
          loadingText="Finding internship programs and placements for your degree."
          onRetry={onRetry}
        >
          {internshipsState === "done" && <InternshipsSection industryExperience={data.industry_experience} openAds={openAds} />}
        </CareersSection>

        <CareersSection
          id="networking"
          icon={Users}
          title="Networking"
          description="Career fairs, industry nights and society events where you can meet people in your field."
        >
          <div className="rounded-xl border border-dashed border-line px-5 py-6 text-center">
            <p className="text-[15px] font-medium text-ink-strong">Coming soon</p>
            <p className="mt-1 text-sm text-ink-muted">Upcoming events for your degree will show here.</p>
          </div>
        </CareersSection>

        <CareersSection
          id="career-paths"
          icon={Route}
          title="Career paths"
          description="Where your degree can take you, from first job to senior roles."
          status={careersReady ? null : careersState}
          loadingText="Mapping entry-level, mid-career and senior roles for your field."
          onRetry={onRetry}
        >
          {careersReady && <CareerPathsSection careerPathways={data.career_pathways} personal={personal} jobs={jobs} />}
        </CareersSection>
      </div>
    </div>
  );
}

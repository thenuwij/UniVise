import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, BriefcaseBusiness, ChevronRight, CircleCheck, TriangleAlert } from "lucide-react";
import { careerSectionUrl, roadmapStepUrl, roadmapViewUrl } from "@/features/roadmap/utils/roadmapSteps";
import { useDashboardPreview } from "../hooks/useDashboardPreview";
import DegreeEditMenu from "./DegreeEditMenu";

const tag = "rounded-md px-2 py-0.5 text-xs font-semibold";
const USEFULNESS = { high: "Highly useful", medium: "Useful", general: "Less career-relevant" };

function Skeleton({ lines = 2 }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => <div key={i} className="h-5 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
    </div>
  );
}

function nextStep(facts, picks) {
  if (!facts.doneCount) {
    return {
      title: "Tick the courses you've done",
      detail: "Next courses, CourseMesh and your suggestions all work from your ticks.",
      action: "Update my courses",
      to: roadmapStepUrl("structure"),
    };
  }
  const top = picks?.picks?.[0];
  if (top) {
    const fit = [top.core && "Core course", USEFULNESS[top.usefulness]?.toLowerCase()].filter(Boolean).join(", ");
    const career = top.careers?.[0];
    return {
      title: `Take ${top.code} ${top.name} next`,
      detail: [fit && `${fit.charAt(0).toUpperCase()}${fit.slice(1)}${career ? ` for ${career}` : ""}.`, top.unlocks?.length && `Unlocks ${top.unlocks.length} course${top.unlocks.length === 1 ? "" : "s"}.`].filter(Boolean).join(" "),
      action: "See next courses",
      to: roadmapStepUrl("next"),
    };
  }
  return {
    title: "See where your degree can take you",
    detail: "Jobs, internships and events picked for your degree, updated daily.",
    action: "Open My Career",
    to: roadmapViewUrl("careers"),
  };
}

function NextStep({ facts, picks }) {
  const waiting = facts.doneCount > 0 && !picks;
  const step = waiting ? null : nextStep(facts, picks);
  return (
    <section className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/70 p-5 ring-1 ring-blue-200 dark:from-blue-950/60 dark:to-blue-900/30 dark:ring-blue-900 sm:p-6" data-tour="dash-next" aria-labelledby="dash-next-title">
      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Your next step</p>
      {waiting ? (
        <div className="mt-3"><Skeleton /></div>
      ) : (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 id="dash-next-title" className="text-xl font-semibold leading-snug text-ink-strong">{step.title}</h2>
            {step.detail && <p className="mt-1 text-[15px] text-ink-muted">{step.detail}</p>}
          </div>
          <Link to={step.to} className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
            {step.action} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}

function PreviewCard({ icon: Icon, title, summary, to, tour, children }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-6" data-tour={tour} aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-strong">
          <Icon className="h-5 w-5 text-ink-muted" aria-hidden="true" /> {title}
        </h2>
        <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
          Open <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {summary && <p className="mt-1 text-sm text-ink-muted">{summary}</p>}
      <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">{children}</ul>
    </section>
  );
}

function Row({ to, label, detail }) {
  return (
    <li>
      <Link to={to} className="group flex items-center justify-between gap-3 py-3 text-[15px]">
        <span className="min-w-0 flex-shrink truncate text-ink-strong group-hover:text-link">{label}</span>
        <span className="flex min-w-0 items-center justify-end gap-2">
          {detail}
          <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

function ProgramPreview({ facts, picks, roadmap }) {
  const available = picks?.available ?? facts.canTakeNext;
  const summary = facts.doneCount ? `${facts.doneCount} courses ticked · ${available} you can take next` : "No courses ticked yet";
  return (
    <PreviewCard icon={BookOpen} title="My Program" summary={summary} to={roadmapViewUrl("degree")} tour="dash-program">
      {facts.doneCount > 0 && !picks && <li className="py-3"><Skeleton /></li>}
      {(picks?.picks || []).slice(0, 2).map((pick) => (
        <Row
          key={pick.code}
          to={roadmapStepUrl("next")}
          label={`${pick.code} ${pick.name}`}
          detail={
            <>
              {pick.core && <span className={`${tag} ring-1 ring-slate-900 text-slate-900 dark:ring-white dark:text-white`}>Core</span>}
              {pick.usefulness === "high" && <span className={`${tag} bg-slate-900 text-white dark:bg-white dark:text-slate-900`}>Highly useful</span>}
            </>
          }
        />
      ))}
      {!facts.doneCount && <Row to={roadmapStepUrl("next")} label="Next courses" detail={<span className="text-sm text-ink-muted">Tick courses first</span>} />}
      {roadmap?.societies?.length > 0 && (
        <Row
          to={roadmapStepUrl("societies")}
          label="Societies to join"
          detail={<span className="truncate text-sm text-ink-muted">{roadmap.societies.length} matched to your degree</span>}
        />
      )}
    </PreviewCard>
  );
}

function CareerPreview({ roadmap, career }) {
  const ready = career && !career.failed && !career.missing;
  const summary = ready ? `${career.jobs} jobs · ${career.internships} internships · ${career.events} events` : null;
  return (
    <PreviewCard icon={BriefcaseBusiness} title="My Career" summary={summary} to={roadmapViewUrl("careers")} tour="dash-career">
      {!career && <li className="py-3"><Skeleton /></li>}
      {ready && career.families.map((f) => (
        <Row key={f.title} to={careerSectionUrl("jobs")} label={f.title} detail={<span className="text-sm text-ink-muted">{f.count} job{f.count === 1 ? "" : "s"}</span>} />
      ))}
      {roadmap?.placement && (
        <Row
          to={careerSectionUrl("internships")}
          label={`Required placement ${roadmap.placement.code}`}
          detail={
            roadmap.placement.done ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 dark:text-green-400"><CircleCheck className="h-4 w-4" aria-hidden="true" /> Completed</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-400"><TriangleAlert className="h-4 w-4" aria-hidden="true" /> Not done</span>
            )
          }
        />
      )}
      {career && !ready && <Row to={roadmapViewUrl("careers")} label="See jobs, internships and events for your degree" />}
    </PreviewCard>
  );
}

export default function DashboardHome({ facts }) {
  const { picks, roadmap, career } = useDashboardPreview(facts);
  const { program, specNames = [] } = facts;
  const canChangeSpecialisation = !facts.failed && facts.hasSpecOptions;
  const degree = [program.program_name, ...specNames].join(" · ");

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2" data-tour="dash-degree">
        <p className="text-[15px] text-ink-muted">{degree}</p>
        <div data-tour="dash-edit">
          <DegreeEditMenu degreeCode={program.degree_code} canChangeSpecialisation={canChangeSpecialisation} />
        </div>
      </div>
      {facts.failed ? (
        <p className="mt-6 rounded-2xl bg-slate-50 px-5 py-4 text-[15px] text-ink-muted dark:bg-slate-800/50" role="status">
          Your details couldn't be loaded. You can still open <Link to={roadmapViewUrl("degree")} className="font-semibold text-link hover:underline">My Program</Link> or <Link to={roadmapViewUrl("careers")} className="font-semibold text-link hover:underline">My Career</Link>.
        </p>
      ) : (
        <>
          <NextStep facts={facts} picks={picks} />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ProgramPreview facts={facts} picks={picks} roadmap={roadmap} />
            <CareerPreview roadmap={roadmap} career={career} />
          </div>
        </>
      )}
    </>
  );
}

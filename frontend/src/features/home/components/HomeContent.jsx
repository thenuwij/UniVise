import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, GraduationCap, HelpCircle, MessageCircle } from "lucide-react";
import { careerSectionUrl, roadmapStepUrl, roadmapViewUrl } from "@/features/program/utils/roadmapSteps";
import { useHomePreview } from "../hooks/useHomePreview";
import DegreeEditMenu from "./DegreeEditMenu";

const display = "font-['Plus_Jakarta_Sans',ui-sans-serif,system-ui] tracking-tight";

function Shimmer({ className = "h-5" }) {
  return <div className={`${className} rounded bg-slate-100 dark:bg-slate-800 animate-pulse`} aria-hidden="true" />;
}

function EntryCard({ to, icon: Icon, eyebrow, title, text, action, tour, tone }) {
  return (
    <Link
      to={to}
      data-tour={tour}
      className={`group block rounded-3xl bg-gradient-to-br ${tone.card} p-7 text-white transition hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white/85">
        <Icon className="h-5 w-5" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className={`${display} mt-3 text-[28px] font-extrabold leading-tight`}>{title}</h2>
      <p className="mt-2 text-base text-white/90">{text}</p>
      <span className={`mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-semibold ${tone.button} group-hover:bg-slate-50`}>
        {action}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function PreviewList({ title, rows, loading, empty }) {
  return (
    <div>
      <h3 className="text-base font-bold text-ink-strong">{title}</h3>
      <ul className="mt-2">
        {loading && [0, 1, 2].map((i) => <li key={i} className="border-t border-slate-200 py-3.5 dark:border-slate-800"><Shimmer /></li>)}
        {rows.map(({ key, to, main, sub }) => (
          <li key={key} className="border-t border-slate-200 dark:border-slate-800">
            <Link to={to} className="group block py-3">
              <span className="block truncate font-semibold text-ink-strong group-hover:text-link">{main}</span>
              {sub && <span className="mt-0.5 block truncate text-[13px] text-slate-500 dark:text-slate-400">{sub}</span>}
            </Link>
          </li>
        ))}
        {!loading && !rows.length && <li className="border-t border-slate-200 py-3.5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">{empty}</li>}
      </ul>
    </div>
  );
}

function ProgramColumn({ facts, picks }) {
  const ticked = facts.doneCount > 0;
  const nextUrl = roadmapStepUrl("next");
  const coursesUrl = roadmapStepUrl("structure");
  return (
    <section className="min-w-0 space-y-5" aria-label="My Program">
      <EntryCard
        to={ticked ? nextUrl : coursesUrl}
        icon={GraduationCap}
        eyebrow="My Program"
        title="Plan your next courses"
        text={ticked ? "See what you can take next, and what each course leads to." : "Tick the courses you've done, and we'll show what you can take next."}
        action={ticked ? "See my next courses" : "Update my courses"}
        tour="dash-program"
        tone={{ card: "from-brand-navy to-brand-blue", button: "text-brand-navy" }}
      />
      <PreviewList
        title="Suggested next"
        loading={!picks}
        rows={(picks?.picks || []).slice(0, 3).map((pick) => ({ key: pick.code, to: nextUrl, main: `${pick.code} · ${pick.name}`, sub: pick.skills?.join(", ") }))}
        empty="Open Next courses to see what you can take."
      />
    </section>
  );
}

function CareerColumn({ career, onRetry }) {
  const ready = career && !career.failed && !career.missing;
  const failed = career?.failed || (ready && ["jobs", "internships"].some((row) => career[row].state === "failed"));
  const jobsUrl = careerSectionUrl("jobs");
  return (
    <section className="min-w-0 space-y-5" aria-label="My Career">
      <EntryCard
        to={jobsUrl}
        icon={BriefcaseBusiness}
        eyebrow="My Career"
        title="Find jobs and internships"
        text="Jobs, internships and events picked for your degree."
        action="Explore My Career"
        tour="dash-career"
        tone={{ card: "from-brand-blue to-brand-indigo", button: "text-brand-indigo" }}
      />
      {failed && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Some of this couldn't load. <button type="button" onClick={onRetry} className="font-semibold text-link hover:underline">Try again</button>
        </p>
      )}
      <PreviewList
        title="Latest jobs"
        loading={!career || (ready && !career.latestJobs.length && career.jobs.state === "loading")}
        rows={(career?.latestJobs || []).map((job) => ({ key: job.url, to: jobsUrl, main: job.title, sub: job.organisation }))}
        empty="Open My Career to see what's available."
      />
    </section>
  );
}

export default function HomeContent({ facts, greeting, today, onHelp }) {
  const { picks, career, retryCareer } = useHomePreview(facts);
  const { program, specNames = [] } = facts;
  const degree = [program.program_name, ...specNames].join(" · ");

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4" aria-labelledby="home-hello">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{today}</p>
          <h1 id="home-hello" className={`${display} mt-1 text-[28px] font-extrabold leading-tight text-ink-strong sm:text-[34px]`}>{greeting}</h1>
          <p className="mt-3 text-lg text-ink-strong" data-tour="dash-degree"><span className="text-ink-muted">Your degree:</span> <span className="font-semibold">{degree}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div data-tour="dash-edit">
            <DegreeEditMenu degreeCode={program.degree_code} canChangeSpecialisation={!facts.failed && facts.hasSpecOptions} />
          </div>
          <button type="button" onClick={onHelp} aria-label="How Home works" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </section>
      {facts.failed && (
        <p className="rounded-2xl bg-white px-5 py-4 text-[15px] text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800" role="status">
          Your details couldn't be loaded. You can still open <Link to={roadmapViewUrl("degree")} className="font-semibold text-link hover:underline">My Program</Link> or <Link to={roadmapViewUrl("careers")} className="font-semibold text-link hover:underline">My Career</Link>.
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-2">
        <ProgramColumn facts={facts} picks={picks} />
        <CareerColumn career={career} onRetry={retryCareer} />
      </div>
      <Link to="/chat" className="group flex items-center gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200 hover:ring-blue-300 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-blue-700">
        <MessageCircle className="h-5 w-5 flex-shrink-0 text-link" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-[15px] text-ink-strong">Not sure where to start? <span className="font-semibold group-hover:text-link">Ask Eunice</span>, your academic and career adviser.</span>
      </Link>
    </div>
  );
}

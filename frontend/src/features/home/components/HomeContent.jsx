import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, GraduationCap, HelpCircle, MessageCircle } from "lucide-react";
import { careerSectionUrl, roadmapStepUrl, roadmapViewUrl } from "@/features/program/utils/roadmapSteps";
import { useHomePreview } from "../hooks/useHomePreview";
import DegreeEditMenu from "./DegreeEditMenu";

const display = "font-['Plus_Jakarta_Sans',ui-sans-serif,system-ui] tracking-tight";

function Shimmer({ className = "h-5" }) {
  return <div className={`${className} rounded bg-slate-200/70 dark:bg-slate-800 animate-pulse`} aria-hidden="true" />;
}

const CARD_STYLES = {
  light: {
    card: "bg-white text-ink-strong ring-1 ring-blue-100 shadow-[0_18px_40px_-20px_rgba(30,58,138,0.35)] dark:bg-slate-900 dark:ring-slate-700",
    shape: "bg-blue-100/70 dark:bg-blue-900/30",
    icon: "bg-gradient-to-br from-brand-blue to-brand-indigo text-white",
    eyebrow: "text-brand-blue dark:text-blue-300",
    text: "text-slate-600 dark:text-slate-300",
    button: "button-primary text-white",
  },
  dark: {
    card: "bg-gradient-to-br from-brand-navy via-brand-blue to-brand-indigo text-white shadow-[0_18px_40px_-16px_rgba(30,58,138,0.6)]",
    shape: "bg-white/10",
    icon: "bg-white/15 text-white ring-1 ring-white/25",
    eyebrow: "text-blue-100",
    text: "text-blue-50",
    button: "bg-white text-brand-navy group-hover:bg-blue-50",
  },
};

function EntryCard({ to, icon: Icon, eyebrow, title, text, action, tour, tone }) {
  const style = CARD_STYLES[tone];
  return (
    <Link
      to={to}
      data-tour={tour}
      className={`home-card group relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl p-7 transition duration-200 hover:-translate-y-1 sm:p-8 ${style.card}`}
    >
      <span className={`home-shape absolute -right-14 -top-14 h-52 w-52 rounded-full ${style.shape}`} aria-hidden="true" />
      <span className={`home-shape absolute -bottom-20 right-16 h-40 w-40 rounded-full ${style.shape}`} aria-hidden="true" />
      <span className="relative flex flex-1 flex-col items-start">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.icon}`} aria-hidden="true">
          <Icon className="h-6 w-6" />
        </span>
        <span className={`mt-5 text-sm font-semibold ${style.eyebrow}`}>{eyebrow}</span>
        <h2 className={`${display} mt-1 text-[30px] font-extrabold leading-tight`}>{title}</h2>
        <span className={`mt-2 max-w-md text-base ${style.text}`}>{text}</span>
        <span className={`mt-auto inline-flex h-12 items-center gap-2 rounded-xl px-6 text-base font-semibold ${style.button}`}>
          {action}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

function PreviewList({ title, rows, loading, empty }) {
  return (
    <div className="px-1">
      <h3 className="text-base font-bold text-ink-strong">{title}</h3>
      <ul className="mt-2">
        {loading && [0, 1, 2].map((i) => <li key={i} className="border-t border-slate-200/70 py-3.5 dark:border-slate-800"><Shimmer /></li>)}
        {rows.map(({ key, to, main, sub }) => (
          <li key={key} className="border-t border-slate-200/70 dark:border-slate-800">
            <Link to={to} className="group block py-3">
              <span className="block truncate font-semibold text-ink-strong group-hover:text-link">{main}</span>
              {sub && <span className="mt-0.5 block truncate text-[13px] text-slate-500 dark:text-slate-400">{sub}</span>}
            </Link>
          </li>
        ))}
        {!loading && !rows.length && <li className="border-t border-slate-200/70 py-3.5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">{empty}</li>}
      </ul>
    </div>
  );
}

function ProgramColumn({ facts, picks }) {
  const ticked = facts.doneCount > 0;
  const nextUrl = roadmapStepUrl("next");
  return (
    <section className="home-rise home-rise-2 min-w-0 space-y-6" aria-label="My Program">
      <EntryCard
        to={ticked ? nextUrl : roadmapStepUrl("structure")}
        icon={GraduationCap}
        eyebrow="My Program"
        title="Plan your next courses"
        text={ticked ? "See what you can take next, and what each course leads to." : "Tick the courses you've done, and we'll show what you can take next."}
        action={ticked ? "See my next courses" : "Update my courses"}
        tour="dash-program"
        tone="light"
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
    <section className="home-rise home-rise-3 min-w-0 space-y-6" aria-label="My Career">
      <EntryCard
        to={jobsUrl}
        icon={BriefcaseBusiness}
        eyebrow="My Career"
        title="Find jobs and internships"
        text="Jobs, internships and events picked for your degree."
        action="Explore My Career"
        tour="dash-career"
        tone="dark"
      />
      {failed && (
        <p className="px-1 text-sm text-slate-600 dark:text-slate-300">
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

  return (
    <div className="space-y-8">
      <section className="home-rise flex flex-wrap items-start justify-between gap-4" aria-labelledby="home-hello">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{today}</p>
          <h1 id="home-hello" className={`${display} mt-1 text-[28px] font-extrabold leading-tight text-ink-strong sm:text-[34px]`}>{greeting}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2" data-tour="dash-degree">
            <p className="text-lg font-semibold text-ink-strong">{program.program_name}</p>
            {specNames.map((name) => (
              <span key={name} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-900">{name}</span>
            ))}
          </div>
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
      <Link to="/chat" className="home-rise home-rise-3 home-card group relative flex flex-wrap items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 p-6 ring-1 ring-blue-100 shadow-[0_18px_40px_-24px_rgba(30,58,138,0.4)] transition duration-200 hover:-translate-y-1 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 dark:ring-slate-700 sm:px-8">
        <span className="home-shape absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/60 dark:bg-indigo-900/30" aria-hidden="true" />
        <span className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-indigo text-white" aria-hidden="true">
          <MessageCircle className="h-6 w-6" />
        </span>
        <span className="relative min-w-[220px] flex-1">
          <span className={`${display} block text-xl font-extrabold text-ink-strong`}>Not sure where to start?</span>
          <span className="mt-1 block text-[15px] text-slate-600 dark:text-slate-300">Ask Eunice, your academic and career adviser, about your degree, courses or jobs.</span>
        </span>
        <span className="button-primary relative inline-flex h-12 items-center gap-2 rounded-xl px-6 text-base font-semibold text-white">
          Ask Eunice
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}

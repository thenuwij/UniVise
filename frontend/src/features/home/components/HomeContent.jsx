import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, ChevronRight, GraduationCap, MessageCircle } from "lucide-react";
import { careerSectionUrl, roadmapStepUrl, roadmapViewUrl } from "@/features/program/utils/roadmapSteps";
import { useHomePreview } from "../hooks/useHomePreview";
import StudyGuide from "./StudyGuide";
import DegreeEditMenu from "./DegreeEditMenu";

const STUDY_GUIDE_KEY = "univise-study-guide-seen";
const EUNICE_QUESTIONS = [
  "What can I take next term?",
  "Which electives suit the career I want?",
  "What jobs fit my degree?",
];
const display = "font-['Plus_Jakarta_Sans',ui-sans-serif,system-ui] tracking-tight";

function Shimmer({ className = "h-5" }) {
  return <div className={`${className} rounded bg-slate-200/70 dark:bg-slate-800 animate-pulse`} aria-hidden="true" />;
}

const CARD_STYLES = {
  light: {
    card: "bg-white text-ink-strong ring-1 ring-blue-100 shadow-[0_18px_40px_-20px_rgba(30,58,138,0.35)] dark:bg-slate-900 dark:ring-slate-700",
    shape: "bg-blue-100/70 dark:bg-blue-900/30",
    circles: ["-right-14 -top-14 h-52 w-52", "-bottom-20 right-16 h-40 w-40"],
    icon: "bg-gradient-to-br from-brand-blue to-brand-indigo text-white",
    text: "text-slate-600 dark:text-slate-300",
    button: "button-primary text-white",
    label: "text-ink-strong",
    percent: "text-brand-blue dark:text-blue-300",
    track: "bg-blue-100 dark:bg-blue-900/40",
    fill: "bg-gradient-to-r from-brand-blue to-brand-indigo",
  },
  dark: {
    card: "bg-gradient-to-br from-brand-navy via-brand-blue to-brand-indigo text-white shadow-[0_18px_40px_-16px_rgba(30,58,138,0.6)]",
    shape: "bg-white/10",
    circles: ["-bottom-24 -left-16 h-60 w-60", "-top-12 right-28 h-32 w-32"],
    icon: "bg-white/15 text-white ring-1 ring-white/25",
    text: "text-blue-50",
    button: "bg-white text-brand-navy shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] hover:bg-blue-50 hover:shadow-[0_16px_30px_-10px_rgba(0,0,0,0.5)]",
    label: "text-white",
    percent: "text-blue-100",
    track: "bg-white/20",
    fill: "bg-white",
  },
};

function EntryCard({ to, icon: Icon, title, text, action, tour, tone, progress, stats }) {
  const style = CARD_STYLES[tone];
  const percent = progress ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;
  return (
    <div
      data-tour={tour}
      className={`home-card relative flex min-h-[260px] flex-col overflow-hidden rounded-3xl p-6 transition duration-200 sm:p-7 ${style.card}`}
    >
      {style.circles.map((position) => (
        <span key={position} className={`home-shape absolute ${position} rounded-full ${style.shape}`} aria-hidden="true" />
      ))}
      <span className="relative flex flex-1 flex-col items-start">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.icon}`} aria-hidden="true">
          <Icon className="h-6 w-6" />
        </span>
        <h2 className={`${display} mt-4 text-[26px] font-bold leading-tight`}>{title}</h2>
        {text && <span className={`mt-2 max-w-md text-base ${style.text}`}>{text}</span>}
        {stats?.length > 0 && (
          <span className="mb-5 mt-4 flex w-full max-w-md flex-wrap gap-2">
            {stats.map((stat) => (
              <span key={stat} className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/25">{stat}</span>
            ))}
          </span>
        )}
        {progress && (
          <span className="mb-5 mt-4 block w-full max-w-md">
            <span className={`flex items-baseline justify-between text-sm font-semibold ${style.label}`}>
              <span><strong>{progress.done}</strong> of {progress.total} UOC completed</span>
              <span className={style.percent}>{percent}%</span>
            </span>
            <span role="progressbar" aria-label="Degree progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className={`mt-2 block h-2 overflow-hidden rounded-full ${style.track}`}>
              <span className={`block h-full rounded-full ${style.fill} transition-[width] duration-700`} style={{ width: `${percent}%` }} />
            </span>
          </span>
        )}
        <Link to={to} className={`group mt-auto inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl px-8 sm:w-72 text-lg font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${style.button}`}>
          {action}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </span>
    </div>
  );
}

function PreviewList({ title, rows, loading, empty, seeAll }) {
  return (
    <div className="px-1">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-strong">{title}</h3>
        {seeAll && <Link to={seeAll} className="text-sm font-semibold text-link hover:underline">See all</Link>}
      </div>
      <ul className="mt-2">
        {loading && [0, 1, 2].map((i) => <li key={i} className="border-t border-slate-200/70 py-3.5 dark:border-slate-800"><Shimmer /></li>)}
        {rows.map(({ key, to, main, sub }) => (
          <li key={key} className="border-t border-slate-200/70 dark:border-slate-800">
            <Link to={to} className="group -mx-3 flex min-h-[60px] items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/70">
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink-strong group-hover:text-link">{main}</span>
                {sub && <span className="mt-0.5 block truncate text-[13px] text-slate-500 dark:text-slate-400">{sub}</span>}
              </span>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-link" aria-hidden="true" />
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
    <section className="home-rise home-rise-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12 lg:row-span-2 lg:grid-rows-subgrid" aria-label="My Program">
      <EntryCard
        to={ticked ? nextUrl : roadmapStepUrl("structure")}
        icon={GraduationCap}
        title="Plan your next courses"
        progress={facts.minimumUoc ? { done: facts.uocDone || 0, total: facts.minimumUoc } : null}
        text={ticked ? "See what you can take next, and what each course leads to." : "Tick the courses you've done, and we'll show what you can take next."}
        action={ticked ? "See my next courses" : "Update my courses"}
        tour="dash-program"
        tone="light"
      />
      <PreviewList
        title="Suggested next"
        seeAll={nextUrl}
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
  const careerStats = ready
    ? [["jobs", "job"], ["internships", "internship"], ["events", "event"]]
        .filter(([row]) => career[row].state === "ready")
        .map(([row, label]) => `${career[row].count} ${label}${career[row].count === 1 ? "" : "s"}`)
    : [];
  return (
    <section className="home-rise home-rise-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12 lg:row-span-2 lg:grid-rows-subgrid" aria-label="My Career">
      <EntryCard
        to={jobsUrl}
        icon={BriefcaseBusiness}
        title="Build your career"
        text="Jobs, internships and networking."
        action="Explore My Career"
        tour="dash-career"
        stats={careerStats}
        tone="dark"
      />
      <div className="space-y-4">
        {failed && (
          <p className="px-1 text-sm text-slate-600 dark:text-slate-300">
            Some of this couldn't load. <button type="button" onClick={onRetry} className="font-semibold text-link hover:underline">Try again</button>
          </p>
        )}
        <PreviewList
          title="Latest jobs"
          seeAll={jobsUrl}
          loading={!career || (ready && !career.latestJobs.length && career.jobs.state === "loading")}
          rows={(career?.latestJobs || []).map((job) => ({ key: job.url, to: jobsUrl, main: job.title, sub: job.organisation }))}
          empty="Open My Career to see what's available."
        />
      </div>
    </section>
  );
}

export default function HomeContent({ facts, greeting, onHelp }) {
  const { picks, career, retryCareer } = useHomePreview(facts);
  const [showStudyGuide, setShowStudyGuide] = useState(() => {
    try {
      return !localStorage.getItem(STUDY_GUIDE_KEY);
    } catch {
      return true;
    }
  });
  const closeStudyGuide = useCallback(() => {
    setShowStudyGuide(false);
    try {
      localStorage.setItem(STUDY_GUIDE_KEY, "1");
    } catch {
      return;
    }
  }, []);
  const { program, specNames = [] } = facts;

  return (
    <div className="space-y-12">
      <section className="home-rise relative z-20 flex flex-wrap items-start justify-between gap-4" aria-labelledby="home-hello">
        <div className="min-w-0">
          <h1 id="home-hello" className={`${display} bg-gradient-to-r from-slate-800 to-brand-blue bg-clip-text text-[30px] font-bold leading-tight text-transparent dark:from-white dark:to-blue-300 sm:text-[36px]`}>{greeting}</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted" data-tour="dash-degree">{[program.program_name, ...specNames].join(" · ")}</p>
        </div>
        <div data-tour="dash-edit">
          <DegreeEditMenu
            degreeCode={program.degree_code}
            canChangeSpecialisation={!facts.failed && facts.hasSpecOptions}
            onHelp={onHelp}
            onStudyGuide={() => setShowStudyGuide(true)}
          />
        </div>
      </section>
      {facts.failed && (
        <p className="rounded-2xl bg-white px-5 py-4 text-[15px] text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800" role="status">
          Your details couldn't be loaded. You can still open <Link to={roadmapViewUrl("degree")} className="font-semibold text-link hover:underline">My Program</Link> or <Link to={roadmapViewUrl("careers")} className="font-semibold text-link hover:underline">My Career</Link>.
        </p>
      )}
      {showStudyGuide && <StudyGuide onClose={closeStudyGuide} />}
      <div className="grid gap-10 lg:grid-cols-2 lg:grid-rows-[auto_auto]">
        <ProgramColumn facts={facts} picks={picks} />
        <CareerColumn career={career} onRetry={retryCareer} />
      </div>
      <div className="home-rise home-rise-3 relative border-t border-slate-200 pt-8 dark:border-slate-800">
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-indigo text-white" aria-hidden="true">
            <MessageCircle className="h-6 w-6" />
          </span>
          <span className="min-w-[220px] flex-1">
            <span className={`${display} block text-xl font-extrabold text-ink-strong`}>Not sure where to start?</span>
            <span className="mt-1 block text-[15px] text-slate-600 dark:text-slate-300">Ask Eunice, your academic and career adviser, about your degree, courses or jobs.</span>
          </span>
          <Link to="/chat" className="button-primary group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl px-8 text-lg font-semibold text-white sm:w-72">
            Ask Eunice
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2" aria-label="Suggested questions">
          {EUNICE_QUESTIONS.map((question) => (
            <Link
              key={question}
              to="/chat"
              state={{ ask: question }}
              className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-blue-900 ring-1 ring-blue-200 transition hover:bg-white hover:ring-blue-400 dark:bg-slate-800 dark:text-blue-100 dark:ring-slate-600 dark:hover:ring-blue-400"
            >
              {question}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

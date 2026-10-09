import { Link } from "react-router-dom";
import { ArrowRight, Compass, Repeat } from "lucide-react";
import { card } from "@/shared/ui/cardStyles";
import AtAGlance from "./AtAGlance";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";

const STEP_LINKS = [
  { key: "overview", title: "Overview", text: "What your degree covers and requires" },
  { key: "structure", title: "Courses", text: "Tick what you've done, add courses" },
  { key: "careers", title: "Careers", text: "Roles, pay and job ads" },
  { key: "internships", title: "Internships", text: "Programs open now" },
  { key: "societies", title: "Societies", text: "Clubs and professional bodies" },
];

export default function ProgramCard({ facts }) {
  if (!facts) {
    return <div className="h-[300px] rounded-2xl bg-white/70 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 animate-pulse" />;
  }

  if (!facts.program) {
    return (
      <section className={`${card} p-6 md:p-8`}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-link">Your program</p>
        <p className="mt-3 text-[19px] font-bold text-ink-strong">No program chosen yet</p>
        <p className="mt-1 text-[15px] text-ink-muted">Search every UNSW degree, major and course in the Handbook.</p>
        <Link to="/handbook" className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-link hover:underline">
          Explore degrees in the Handbook
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  const { program, specNames = [], minimumUoc } = facts;
  const details = [`Program ${program.degree_code}`, minimumUoc ? `${minimumUoc} UOC` : null].filter(Boolean);

  return (
    <section className="rounded-3xl border border-blue-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xl shadow-blue-900/10 dark:shadow-black/40">
      <div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-link">Your program</p>
          <h2 className="mt-2 text-2xl md:text-[28px] font-extrabold leading-tight text-ink-strong">{program.program_name}</h2>
          <p className="mt-2 text-[15px] text-ink-muted">
            {[specNames.length ? specNames.join(" · ") : "No specialisation chosen yet", ...details].join("  ·  ")}
          </p>
        </div>
      </div>

      <div data-tour="dash-glance">
        <AtAGlance facts={facts} />
      </div>

      <p className="mt-7 text-sm font-semibold text-ink-muted">Jump straight to</p>
      <nav aria-label="Roadmap steps" data-tour="dash-steps" className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STEP_LINKS.map(({ key, title, text }, i) => (
          <Link
            key={key}
            to={roadmapStepUrl(key)}
            className="group flex flex-col gap-2 rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-slate-900 p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-600/15 hover:border-blue-400 dark:hover:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="h-7 w-7 flex-shrink-0 rounded-full inline-flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-blue-600 to-indigo-600">
                {i + 1}
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-blue-500 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <span className="text-base font-semibold text-ink-strong group-hover:text-blue-700 dark:group-hover:text-blue-300">{title}</span>
            <span className="text-sm text-ink-muted">{text}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 pt-5 border-t border-line flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/progress"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700 shadow-sm hover:bg-blue-200 dark:hover:bg-blue-900 hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <Repeat className="h-5 w-5" />
            Compare programs
          </Link>
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700 shadow-sm hover:bg-blue-200 dark:hover:bg-blue-900 hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <Compass className="h-5 w-5" />
            Explore other programs
          </Link>
        </div>
        <Link
          to="/roadmap-entryload"
          data-tour="dash-open"
          className="group flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/35 ring-4 ring-blue-100 dark:ring-blue-900/50 hover:-translate-y-0.5 hover:shadow-2xl transition-all"
        >
          Open roadmap
          <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

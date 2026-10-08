import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Briefcase, GraduationCap, Layers, Users } from "lucide-react";
import { card, clickable } from "@/shared/ui/cardStyles";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";

const STEP_LINKS = [
  { key: "overview", title: "Overview", text: "What your degree covers and requires", icon: GraduationCap },
  { key: "structure", title: "Courses", text: "Tick what you've done, add electives", icon: Layers },
  { key: "careers", title: "Careers", text: "Roles, pay and job ads", icon: Briefcase },
  { key: "internships", title: "Internships", text: "Programs open now", icon: BookOpen },
  { key: "societies", title: "Societies", text: "Clubs and professional bodies", icon: Users },
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
    <section className={`${card} p-6 md:p-8`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-link">Your program</p>
          <h2 className="mt-2 text-2xl md:text-[28px] font-extrabold leading-tight text-ink-strong">{program.program_name}</h2>
          <p className="mt-2 text-[15px] text-ink-muted">
            {[specNames.length ? specNames.join(" · ") : "No specialisation chosen yet", ...details].join("  ·  ")}
          </p>
        </div>
        <Link
          to="/roadmap-entryload"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
        >
          Open my roadmap
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      <p className="mt-7 text-sm font-semibold text-ink-muted">Jump straight to</p>
      <nav aria-label="Roadmap steps" className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STEP_LINKS.map(({ key, title, text, icon: Icon }, i) => (
          <Link
            key={key}
            to={roadmapStepUrl(key)}
            className={`${clickable} group flex flex-col gap-2 rounded-xl border border-line bg-surface p-4`}
          >
            <span className="flex items-center gap-2">
              <span className="h-7 w-7 flex-shrink-0 rounded-full inline-flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50">
                {i + 1}
              </span>
              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </span>
            <span className="text-base font-semibold text-ink-strong group-hover:text-blue-700 dark:group-hover:text-blue-300">{title}</span>
            <span className="text-sm text-ink-muted">{text}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}

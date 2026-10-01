import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { card, clickable } from "@/shared/ui/cardStyles";

const STEPS = ["Overview", "Structure", "Societies", "Careers", "Internships"];
const roadmapStep = (n) => `/roadmap-entryload?step=${n}`;

function nextStep(facts) {
  if (!facts.program) {
    return { label: "Explore degrees in the Handbook", reason: "Search every UNSW degree, major and course.", to: "/handbook" };
  }
  if (facts.hasSpecOptions && !facts.specNames.length) {
    return {
      label: "Choose your specialisation",
      reason: "Your course list, CourseMesh and course picks then include its courses.",
      to: `/roadmap?program=${facts.program.degree_code}`,
    };
  }
  if (!facts.doneCount) {
    return {
      label: "Tick the courses you've done",
      reason: "Your progress, what you can take next and your course picks all come from these ticks.",
      to: roadmapStep(2),
    };
  }
  return { label: "Explore your career paths", reason: "See the roles your degree leads to and how your courses get you there.", to: roadmapStep(4) };
}

export default function JourneyCard({ facts }) {
  const navigate = useNavigate();

  if (!facts) {
    return <div className="h-[260px] rounded-2xl bg-white/70 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 animate-pulse" />;
  }

  const next = nextStep(facts);

  return (
    <section className={`${card} relative overflow-hidden p-6 md:p-8`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-link">Your journey</p>

      {facts.program && (
        <nav aria-label="Roadmap steps" className="mt-7 flex items-center">
          {STEPS.map((title, i) => (
            <Fragment key={title}>
              <button onClick={() => navigate(roadmapStep(i + 1))} className="group flex-shrink-0 flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-full inline-flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-slate-800 transition-colors">
                  {i + 1}
                </span>
                <span className="hidden md:inline text-base font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  {title}
                </span>
              </button>
              {i < STEPS.length - 1 && <span aria-hidden className="flex-1 h-1 mx-2 md:mx-4 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-slate-700 dark:to-slate-700" />}
            </Fragment>
          ))}
        </nav>
      )}

      <div className="mt-7 pt-6 border-t border-line flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[19px] font-bold text-ink-strong">Next: {next.label.charAt(0).toLowerCase() + next.label.slice(1)}</p>
          <p className="mt-1 text-[15px] text-ink-muted">{next.reason}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          {facts.program && (
            <button
              onClick={() => navigate("/roadmap-entryload")}
              className={`${clickable} inline-flex items-center px-5 py-3.5 rounded-2xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800`}
            >
              Open my roadmap
            </button>
          )}
          <button
            onClick={() => navigate(next.to)}
            className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
          >
            {next.label}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, Layers } from "lucide-react";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";

function Tile({ icon: Icon, label, action, to, children }) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-ink-muted">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        {label}
      </p>
      <div className="mt-2 flex-1">{children}</div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 dark:text-blue-300">
        {action}
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </p>
    </Link>
  );
}

export default function AtAGlance({ facts }) {
  if (!facts?.program || facts.failed) return null;

  const pct = facts.minimumUoc ? Math.min(100, Math.round((facts.uocDone / facts.minimumUoc) * 100)) : null;
  const programCode = facts.program.degree_code;

  return (
    <div className="mt-6 grid sm:grid-cols-3 gap-3">
      <Tile icon={GraduationCap} label="UOC completed" action="Tick courses" to={roadmapStepUrl("structure")}>
        <p className="text-2xl font-bold text-ink-strong">
          {facts.uocDone}
          {facts.minimumUoc && <span className="text-base font-semibold text-ink-muted"> of {facts.minimumUoc} UOC</span>}
        </p>
        {pct !== null && (
          <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${pct}%` }} />
          </div>
        )}
      </Tile>
      <Tile
        icon={BookOpen}
        label="Specialisation"
        action={facts.hasSpecOptions ? (facts.specNames.length ? "Change" : "Choose one") : "See your program"}
        to={facts.hasSpecOptions ? `/roadmap?program=${programCode}` : roadmapStepUrl("overview")}
      >
        <p className="text-lg font-bold text-ink-strong line-clamp-2">
          {facts.specNames.length ? facts.specNames.join(", ") : facts.hasSpecOptions ? "Not chosen yet" : "None for this program"}
        </p>
      </Tile>
      <Tile
        icon={Layers}
        label="Courses you can take next"
        action={facts.doneCount ? "See them in CourseMesh" : "Tick your courses"}
        to={facts.doneCount ? `/coursemesh?program=${programCode}` : roadmapStepUrl("structure")}
      >
        {facts.doneCount ? (
          <p className="text-2xl font-bold text-ink-strong">{facts.canTakeNext}</p>
        ) : (
          <p className="text-base font-semibold text-ink-muted">Tick the courses you've done to see what's next</p>
        )}
      </Tile>
    </div>
  );
}

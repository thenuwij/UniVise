import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Layers } from "lucide-react";
import { card, clickable } from "@/shared/ui/cardStyles";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";

function Tile({ icon: Icon, label, children, to }) {
  const body = (
    <>
      <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </>
  );
  return to ? (
    <Link to={to} className={`${card} ${clickable} block p-5`}>{body}</Link>
  ) : (
    <div className={`${card} p-5`}>{body}</div>
  );
}

export default function AtAGlance({ facts }) {
  if (!facts) {
    return (
      <div className="grid sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[112px] rounded-2xl bg-white/70 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!facts.program || facts.failed) return null;

  const pct = facts.minimumUoc ? Math.min(100, Math.round((facts.uocDone / facts.minimumUoc) * 100)) : null;
  const programCode = facts.program.degree_code;

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">At a glance</h2>
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <Tile icon={GraduationCap} label="UOC completed" to={roadmapStepUrl("structure")}>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {facts.uocDone}
            {facts.minimumUoc && <span className="text-base font-semibold text-slate-500 dark:text-slate-400"> of {facts.minimumUoc} UOC</span>}
          </p>
          {pct !== null && (
            <div className="mt-2 h-2 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500" style={{ width: `${pct}%` }} />
            </div>
          )}
        </Tile>
        <Tile icon={BookOpen} label="Specialisation" to={`/roadmap?program=${programCode}`}>
          <p className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
            {facts.specNames.length ? facts.specNames.join(", ") : facts.hasSpecOptions ? "Not chosen yet" : "None for this program"}
          </p>
          {facts.hasSpecOptions && (
            <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">{facts.specNames.length ? "Change" : "Choose one"}</p>
          )}
        </Tile>
        <Tile icon={Layers} label="Courses you can take next" to={`/coursemesh?program=${programCode}`}>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{facts.canTakeNext}</p>
          <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">See them in CourseMesh</p>
        </Tile>
      </div>
    </section>
  );
}

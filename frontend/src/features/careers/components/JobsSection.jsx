import { useMemo, useState } from "react";
import AdRows from "./AdRows";
import { SubLabel } from "./CareersSection";
import { groupJobs } from "../utils/jobFamilies";

const pill = (active) =>
  `rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
    active
      ? "bg-blue-600 text-white ring-1 ring-blue-600 dark:bg-blue-500 dark:ring-blue-500"
      : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-blue-50 hover:ring-blue-300 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800"
  }`;

export default function JobsSection({ jobs, savedIds, onToggleSave }) {
  const [role, setRole] = useState(null);

  const groups = useMemo(() => groupJobs(jobs), [jobs]);

  if (jobs === null) {
    return (
      <div className="space-y-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-5 py-6 text-center">
        <p className="text-base font-medium text-ink-strong">No graduate job ads found today</p>
        <p className="mt-1 text-[15px] text-ink-muted">We check again each day for your degree's entry roles.</p>
      </div>
    );
  }

  const shown = role ? groups.filter((g) => g.title === role) : groups;

  return (
    <div>
      {groups.length > 1 && (
        <>
          <p className="mb-2 text-sm font-semibold text-ink-strong">Show jobs for</p>
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter jobs by type">
            <button type="button" aria-pressed={!role} onClick={() => setRole(null)} className={pill(!role)}>
              All jobs
            </button>
            {groups.map((g) => (
              <button key={g.title} type="button" aria-pressed={role === g.title} onClick={() => setRole(g.title)} className={pill(role === g.title)}>
                {g.title} <span className="opacity-70">{g.ads.length}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="space-y-10">
        {shown.map((group) => (
          <section key={group.title}>
            <SubLabel hint={`${group.ads.length} open ad${group.ads.length === 1 ? "" : "s"}, newest first`}>{group.title}</SubLabel>
            <div className="mt-3">
              <AdRows ads={group.ads} savedIds={savedIds} onToggleSave={onToggleSave} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

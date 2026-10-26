import { useMemo, useState } from "react";
import AdRows from "./AdRows";
import { SubLabel } from "./CareersSection";
import { groupJobs } from "../utils/jobFamilies";
import { filterPill } from "@/shared/ui/cardStyles";

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
            <button type="button" aria-pressed={!role} onClick={() => setRole(null)} className={filterPill(!role)}>
              All jobs
            </button>
            {groups.map((g) => (
              <button key={g.title} type="button" aria-pressed={role === g.title} onClick={() => setRole(g.title)} className={filterPill(role === g.title)}>
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

import { useMemo, useState } from "react";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import { chipClass } from "../utils/careersStyles";
import AdRows from "./AdRows";

const SHOWN_JOBS = 5;

export default function JobsSection({ jobs, roles }) {
  const [role, setRole] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const roleChips = useMemo(
    () => (roles || []).filter((r) => r.ad_search && jobs?.some((ad) => ad.role === r.ad_search)),
    [roles, jobs]
  );

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

  const filtered = role ? jobs.filter((ad) => ad.role === role) : jobs;
  const shown = showAll ? filtered : filtered.slice(0, SHOWN_JOBS);

  return (
    <div>
      {roleChips.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter jobs by role">
          <button type="button" aria-pressed={!role} onClick={() => setRole(null)} className={chipClass(!role)}>
            All
          </button>
          {roleChips.map((r) => (
            <button
              key={r.ad_search}
              type="button"
              aria-pressed={role === r.ad_search}
              onClick={() => setRole(r.ad_search)}
              className={chipClass(role === r.ad_search)}
            >
              {r.title}
            </button>
          ))}
        </div>
      )}
      <AdRows ads={shown} />
      {filtered.length > SHOWN_JOBS && (
        <ExpandToggle wide open={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show all ${filtered.length} jobs`}
        </ExpandToggle>
      )}
    </div>
  );
}

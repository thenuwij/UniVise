import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { updatedLabel } from "../utils/careersDates";

const EXPECTED_MS = 60000;

function useTimedProgress(active) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!active) {
      setPct(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setPct(Math.min(95, ((Date.now() - start) / EXPECTED_MS) * 100)), 500);
    return () => clearInterval(id);
  }, [active]);

  return pct;
}

function SectionStatus({ status, updatedAt, onRetry, label: name }) {
  const prefix = name ? `${name} · ` : "";
  if (status === "loading" || status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {prefix}Updating
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 dark:text-red-300">
        <AlertCircle className="h-3.5 w-3.5" />
        {prefix}Couldn't update
        {onRetry && (
          <button type="button" onClick={onRetry} className="underline hover:no-underline">
            Try again
          </button>
        )}
      </span>
    );
  }
  const label = updatedLabel(updatedAt);
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {prefix}{label}
    </span>
  );
}

export function SubLabel({ hint, children, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="text-[20px] font-semibold leading-7 text-ink-strong">{children}</h3>
        {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export default function CareersSection({ id, title, count, description, status, updatedAt, loadingText, onRetry, sources = [], children }) {
  const loading = status === "loading" || sources.some((s) => s.status === "running");
  const pct = useTimedProgress(loading);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="careers-section scroll-mt-20 py-10"
    >
      <div className="mb-6">
        <h2 id={`${id}-title`} className="text-[32px] font-semibold leading-tight tracking-tight text-ink-strong">
          {title}
          {count != null && <> <span className="ml-2 text-xl font-medium text-ink-muted">({count})</span></>}
        </h2>
        {description && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
          <SectionStatus status={status} updatedAt={updatedAt} onRetry={onRetry} />
          {sources.map((s) => (
            <SectionStatus key={s.label} label={s.label} status={s.status} updatedAt={s.refreshedAt} onRetry={s.onRetry} />
          ))}
        </div>
      </div>
      <div className="min-w-0">
        {loading && (
          <div className="mb-6" role="status">
            <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-brand-blue transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            {loadingText && <p className="mt-2 text-sm text-ink-muted">{loadingText}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

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
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-link">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {prefix}Updating
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-red-700 dark:text-red-300">
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
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {prefix}{label}
    </span>
  );
}

export function SubLabel({ children, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="border-l-[3px] border-brand-blue pl-2.5 text-[15px] font-semibold leading-5 text-ink-strong">{children}</h3>
      {action}
    </div>
  );
}

export default function CareersSection({ id, icon: Icon, title, description, status, updatedAt, loadingText, onRetry, sources = [], children }) {
  const loading = status === "loading" || sources.some((s) => s.status === "running");
  const pct = useTimedProgress(loading);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 border-t border-line py-10 first:border-t-0 first:pt-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12"
    >
      <div className="mb-6 lg:mb-0 lg:sticky lg:top-20 lg:self-start">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-tint text-link">
          <Icon className="h-5 w-5" />
        </span>
        <h2 id={`${id}-title`} className="mt-3 text-2xl font-semibold text-ink-strong">{title}</h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{description}</p>}
        <div className="mt-3 flex flex-col items-start gap-1">
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
            {loadingText && <p className="mt-2 text-[13px] text-ink-muted">{loadingText}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

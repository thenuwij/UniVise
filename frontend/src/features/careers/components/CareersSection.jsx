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

function SectionStatus({ status, updatedAt, onRetry }) {
  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-link">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Updating
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-red-700 dark:text-red-300">
        <AlertCircle className="h-3.5 w-3.5" />
        Couldn't update
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
      {label}
    </span>
  );
}

export function SubLabel({ children, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{children}</h3>
      {action}
    </div>
  );
}

export default function CareersSection({ id, icon: Icon, title, description, status, updatedAt, loadingText, onRetry, children }) {
  const pct = useTimedProgress(status === "loading");

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 rounded-2xl border border-line bg-surface p-5 md:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-tint text-link">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 id={`${id}-title`} className="text-lg font-semibold text-ink-strong">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
        </div>
        <SectionStatus status={status} updatedAt={updatedAt} onRetry={onRetry} />
      </div>
      {status === "loading" && (
        <div className="mt-4" role="status">
          <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-brand-blue transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {loadingText && <p className="mt-2 text-[13px] text-ink-muted">{loadingText}</p>}
        </div>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

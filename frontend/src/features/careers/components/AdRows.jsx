import { ExternalLink } from "lucide-react";
import { postedAgo } from "@/features/roadmap/utils/hiringNow";
import { isRecent } from "../utils/careersDates";

function SourceBadge({ site }) {
  if (!site) return null;
  return (
    <span className="px-2 py-0.5 rounded-md text-xs font-medium text-ink-muted bg-slate-100 dark:bg-slate-800">{site}</span>
  );
}

function SourceTag({ ad }) {
  const topPick = (ad.id || "").startsWith("ai_");
  return (
    <span
      className={`mr-2 inline-block px-1.5 py-px rounded text-[11px] font-semibold align-[1px] ${
        topPick ? "text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50" : "text-ink-muted bg-slate-100 dark:bg-slate-800"
      }`}
    >
      {topPick ? `Top pick · ${ad.source_site || "Web"}` : ad.source_site || "Adzuna"}
    </span>
  );
}

export default function AdRows({ ads }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {ads.map((ad) => (
        <li key={ad.id}>
          <a
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-4 px-2 py-3 hover:bg-surface-tint transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-ink-strong group-hover:text-link">{ad.title}</span>
              <span className="block mt-0.5 text-[13px] text-ink-muted">
                <SourceTag ad={ad} />
                {[ad.organisation, ad.location].filter(Boolean).join(" · ")}
              </span>
              {ad.summary && <span className="block mt-1 text-[13px] text-ink line-clamp-1">{ad.summary}</span>}
            </span>
            <span className="flex flex-shrink-0 items-center gap-2.5 text-[13px] text-ink-muted">
              {isRecent(ad.posted_at) && (
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/50">New</span>
              )}
              <span className="hidden sm:inline">{ad.posted_at ? postedAgo(ad.posted_at) : ad.date_label}</span>
              <ExternalLink className="h-4 w-4 group-hover:text-link" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function EventRows({ events }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {events.map((event) => (
        <li key={event.id}>
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group grid gap-x-5 gap-y-1 px-2 py-3 hover:bg-surface-tint transition-colors sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="text-[13px] font-semibold text-link">{event.date_label}</span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-ink-strong group-hover:text-link">{event.title}</span>
              <span className="block mt-0.5 text-[13px] text-ink-muted">{[event.organisation, event.location].filter(Boolean).join(" · ")}</span>
              {event.summary && <span className="block mt-1 text-[13px] text-ink line-clamp-1">{event.summary}</span>}
            </span>
            <span className="flex items-center gap-2.5 text-[13px] text-ink-muted">
              {event.category && <SourceBadge site={event.category} />}
              <ExternalLink className="h-4 w-4 group-hover:text-link" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const siteName = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export function CalendarLinks({ calendars }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {calendars.map((calendar) => (
        <a
          key={calendar.id}
          href={calendar.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 hover:border-blue-300 hover:bg-surface-tint transition-colors"
        >
          <span className="min-w-0">
            <span className="block text-[15px] font-medium text-ink-strong group-hover:text-link">{calendar.organisation || calendar.title}</span>
            <span className="block text-[13px] text-ink-muted">Events calendar · {siteName(calendar.url)}</span>
          </span>
          <ExternalLink className="h-4 w-4 flex-shrink-0 text-ink-muted group-hover:text-link" />
        </a>
      ))}
    </div>
  );
}

export function AdzunaCredit() {
  return (
    <a href="https://www.adzuna.com.au" target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-muted hover:underline">
      Jobs by Adzuna
    </a>
  );
}

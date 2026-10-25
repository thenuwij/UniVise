import SaveButton from "@/shared/ui/SaveButton";
import { Bookmark, BookmarkCheck, CalendarDays, ChevronRight, ExternalLink } from "lucide-react";
import { postedAgo } from "../utils/hiringNow";
import { cleanDateLabel, isRecent } from "../utils/careersDates";

const sourceLabel = (ad) =>
  (ad.id || "").startsWith("ai_") ? `Top pick from ${ad.source_site || "the web"}` : ad.source_site || "Adzuna";

function SaveAdButton({ ad, saved, onToggle }) {
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      onClick={() => onToggle(ad)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${ad.title} from your shortlist` : `Save ${ad.title} to your shortlist`}
      title={saved ? "Saved to your shortlist" : "Save to your shortlist"}
      className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${
        saved
          ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500"
          : "border-line bg-surface text-ink-muted hover:border-blue-400 hover:text-link"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

export default function AdRows({ ads, savedIds, onToggleSave }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {ads.map((ad) => (
        <li key={ad.id} className="flex items-center gap-2">
          <a
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-w-0 flex-1 items-center justify-between gap-4 px-2 py-3 hover:bg-surface-tint transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-ink-strong group-hover:text-link">{ad.title}</span>
              <span className="block mt-0.5 text-sm text-ink-muted">
                {[ad.organisation, ad.location, sourceLabel(ad)].filter(Boolean).join(" · ")}
              </span>
              {ad.summary && <span className="block mt-1 text-sm text-ink line-clamp-1">{ad.summary}</span>}
            </span>
            <span className="flex flex-shrink-0 items-center gap-2.5 text-[13px] text-ink-muted">
              {isRecent(ad.posted_at) && (
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/50">New</span>
              )}
              <span className="hidden sm:inline">{ad.posted_at ? postedAgo(ad.posted_at) : cleanDateLabel(ad.date_label)}</span>
            </span>
          </a>
          {onToggleSave && <SaveAdButton ad={ad} saved={!!savedIds?.has(ad.id)} onToggle={onToggleSave} />}
        </li>
      ))}
    </ul>
  );
}

export function EventRows({ events }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-2">
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group min-w-0 flex-1 grid gap-x-5 gap-y-1 px-2 py-3 hover:bg-surface-tint transition-colors sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="text-sm font-semibold text-link">{event.date_label}</span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-ink-strong group-hover:text-link">{event.title}</span>
              <span className="block mt-0.5 truncate text-sm text-ink-muted">
                {[event.organisation, event.location, event.summary].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-ink-muted">
              {event.category}
              <ChevronRight className="h-4 w-4" />
            </span>
          </a>
          <SaveButton itemType="event" itemId={event.id || event.url} itemName={event.title} itemData={event} />
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
        <div key={calendar.id} className="flex items-center gap-2">
        <a
          href={calendar.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50 hover:ring-blue-400 dark:bg-slate-900 dark:ring-blue-800 dark:hover:bg-blue-950/40 transition-colors"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white dark:bg-blue-500">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-ink-strong group-hover:text-link">{calendar.organisation || calendar.title}</span>
              <span className="block text-[13px] text-ink-muted">Events calendar · {siteName(calendar.url)}</span>
            </span>
          </span>
          <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
        </a>
        <SaveButton itemType="calendar" itemId={calendar.id || calendar.url} itemName={calendar.organisation || calendar.title} itemData={calendar} />
        </div>
      ))}
    </div>
  );
}

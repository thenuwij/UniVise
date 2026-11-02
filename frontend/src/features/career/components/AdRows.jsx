import SaveButton from "@/shared/ui/SaveButton";
import { HiBookmark, HiOutlineBookmark } from "react-icons/hi";
import { CalendarDays, ExternalLink } from "lucide-react";
import { postedAgo } from "../utils/hiringNow";
import { cleanDateLabel, isRecent } from "../utils/careersDates";

function SaveAdButton({ ad, saved, onToggle }) {
  const Icon = saved ? HiBookmark : HiOutlineBookmark;
  return (
    <button
      type="button"
      onClick={() => onToggle(ad)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${ad.title} from your shortlist` : `Save ${ad.title} to your shortlist`}
      title={saved ? "Remove from shortlist" : "Save to shortlist"}
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-xl border p-2 transition-colors ${
        saved
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "border-line text-ink-muted hover:border-blue-400 hover:text-link"
      }`}
    >
      <Icon className="h-5 w-5" />
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
                {[ad.organisation, ad.location].filter(Boolean).join(" · ")}
              </span>
              {ad.summary && <span className="block mt-1 text-sm text-ink line-clamp-1">{ad.summary}</span>}
            </span>
            <span className="flex flex-shrink-0 items-center gap-2.5 text-[13px] text-ink-muted">
              {isRecent(ad.posted_at) && (
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50">New</span>
              )}
              <span className="hidden sm:inline">{ad.posted_at ? postedAgo(ad.posted_at) : cleanDateLabel(ad.date_label)}</span>
              <ExternalLink className="h-4 w-4 text-link" aria-hidden="true" />
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
    <ul className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="group flex items-center gap-2 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/50 pr-3 transition-colors hover:to-blue-100/70 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 grid gap-x-5 gap-y-1 px-4 py-3.5 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center"
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
              <ExternalLink className="h-4 w-4 text-link" aria-hidden="true" />
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
        <div key={calendar.id} className="group flex items-center gap-2 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/50 pr-3 transition-colors hover:to-blue-100/70 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
        <a
          href={calendar.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3.5"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
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

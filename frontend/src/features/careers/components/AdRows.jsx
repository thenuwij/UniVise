import { ExternalLink } from "lucide-react";
import { postedAgo } from "@/features/roadmap/utils/hiringNow";
import { isRecent } from "../utils/careersDates";

export default function AdRows({ ads }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {ads.map((ad) => (
        <li key={ad.ad_id}>
          <a
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-4 px-2 py-3 hover:bg-surface-tint transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-ink-strong group-hover:text-link">{ad.title}</span>
              <span className="block mt-0.5 text-[13px] text-ink-muted">{[ad.company, ad.location].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-3 text-[13px] text-ink-muted">
              {isRecent(ad.posted_at) && (
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/50">New</span>
              )}
              <span className="hidden sm:inline">{ad.posted_at && postedAgo(ad.posted_at)}</span>
              <ExternalLink className="h-4 w-4 group-hover:text-link" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function AdzunaCredit() {
  return (
    <a href="https://www.adzuna.com.au" target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-muted hover:underline">
      Jobs by Adzuna
    </a>
  );
}

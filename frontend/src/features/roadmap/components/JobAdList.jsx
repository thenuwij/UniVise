import { ExternalLink, Megaphone } from "lucide-react";
import { postedAgo } from "../utils/hiringNow";

export default function JobAdList({ title, ads, large = false }) {
  return (
    <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`flex items-center gap-2 text-slate-900 dark:text-white ${large ? "text-xl font-bold" : "text-base font-semibold"}`}>
          <Megaphone className={`${large ? "h-6 w-6" : "h-5 w-5"} text-blue-600 dark:text-blue-400`} /> {title}
        </p>
        <a href="https://www.adzuna.com.au" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:underline">
          Jobs by Adzuna
        </a>
      </div>
      <ul className="mt-3 space-y-2">
        {ads.map((ad) => (
          <li key={ad.ad_id}>
            <a
              href={ad.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 ring-1 ring-blue-100 dark:ring-slate-700 hover:ring-blue-400 dark:hover:ring-blue-500 transition"
            >
              <span className="min-w-0">
                <span className="block text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">{ad.title}</span>
                <span className="block mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {[ad.company, ad.location, ad.posted_at && `posted ${postedAgo(ad.posted_at)}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <ExternalLink className="h-4 w-4 flex-shrink-0 mt-1 text-slate-400 group-hover:text-blue-600" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

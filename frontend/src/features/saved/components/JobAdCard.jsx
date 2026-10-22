import { AlertTriangle, ArrowRight, Building2, ExternalLink, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { postedAgo } from "@/features/roadmap/utils/hiringNow";
import { careerSectionUrl } from "@/features/roadmap/utils/roadmapSteps";
import { cleanDateLabel } from "@/features/careers/utils/careersDates";

export default function JobAdCard({ data, expired }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
        {data.organisation && (
          <p className="flex items-center gap-1.5 font-medium">
            <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            {data.organisation}
          </p>
        )}
        {data.location && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" />
            {data.location}
          </p>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {[data.source_site || "Adzuna", data.posted_at ? postedAgo(data.posted_at) : cleanDateLabel(data.date_label)].filter(Boolean).join(" · ")}
      </p>
      {expired && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            This ad has probably closed. Ads usually come down about four weeks after they're listed.
          </p>
          <Link
            to={careerSectionUrl(data.kind === "internship" ? "internships" : "jobs")}
            className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
          >
            {data.kind === "internship" ? "Find current internships" : "Find current jobs"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
      {data.url && !expired && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-100 dark:hover:bg-blue-900"
        >
          Open the ad
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

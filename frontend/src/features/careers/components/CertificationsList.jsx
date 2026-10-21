import { useState } from "react";
import { ExternalLink } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";

const SHOWN_CERTS = 3;

const importanceClass = (importance) =>
  importance === "Required"
    ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
    : importance === "Highly Recommended"
    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

export default function CertificationsList({ certifications }) {
  const [showAll, setShowAll] = useState(false);

  if (!certifications.length) {
    return <p className="text-[15px] text-ink-muted">No certifications suggested for this degree yet.</p>;
  }

  const shown = showAll ? certifications : certifications.slice(0, SHOWN_CERTS);

  return (
    <div>
      <ul className="divide-y divide-line border-y border-line">
        {shown.map((cert) => (
          <li key={cert.name} className="flex items-start justify-between gap-4 px-2 py-3">
            <div className="min-w-0">
              <p className="text-base font-medium text-ink-strong">{cert.name}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{[cert.provider, cert.timeline].filter(Boolean).join(" · ")}</p>
              {cert.notes && <p className="mt-1 text-sm text-ink-muted">{cert.notes}</p>}
              {cert.url && (
                <a href={cert.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">
                  Learn more <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {cert.importance && (
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[13px] font-semibold ${importanceClass(cert.importance)}`}>
                {cert.importance}
              </span>
            )}
          </li>
        ))}
      </ul>
      {certifications.length > SHOWN_CERTS && (
        <ExpandToggle wide open={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show ${certifications.length - SHOWN_CERTS} more certifications`}
        </ExpandToggle>
      )}
    </div>
  );
}

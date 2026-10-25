import SaveButton from "@/shared/ui/SaveButton";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";

const SHOWN_CERTS = 3;

const importanceLabel = (importance) => importance.charAt(0) + importance.slice(1).toLowerCase();

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
          <li key={cert.name} className="flex items-center gap-2">
            <a
              {...(cert.url ? { href: cert.url, target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex min-w-0 flex-1 items-start justify-between gap-4 px-2 py-3 hover:bg-surface-tint transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-ink-strong group-hover:text-link">{cert.name}</span>
                <span className="block mt-0.5 text-[13px] text-ink-muted">{[cert.provider, cert.timeline].filter(Boolean).join(" · ")}</span>
                {cert.notes && <span className="block mt-1 text-[13px] text-ink-muted">{cert.notes}</span>}
              </span>
              <span className="flex flex-shrink-0 items-center gap-2.5">
                {cert.importance && (
                  <span className={`text-sm ${cert.importance === "Required" ? "font-bold text-ink-strong" : "text-ink-muted"}`}>
                    {importanceLabel(cert.importance)}
                  </span>
                )}
                {cert.url && <ChevronRight className="h-4 w-4 text-ink-muted" />}
              </span>
            </a>
            <SaveButton itemType="certification" itemId={`${cert.provider}:${cert.name}`} itemName={cert.name} itemData={cert} />
          </li>
        ))}
      </ul>
      {certifications.length > SHOWN_CERTS && (
        <ExpandToggle quiet open={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show ${certifications.length - SHOWN_CERTS} more certifications`}
        </ExpandToggle>
      )}
    </div>
  );
}

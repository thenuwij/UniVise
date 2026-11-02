import SaveButton from "@/shared/ui/SaveButton";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useCareerCertifications } from "../hooks/useCareerCertifications";
import { SubLabel } from "./CareersSection";
import { filterPill } from "@/shared/ui/cardStyles";

function CertRow({ cert, career }) {
  const meta = [cert.level, cert.cost, cert.time, `Best ${cert.when.toLowerCase()}`].filter(Boolean).join(" · ");
  return (
    <li className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-6 py-5 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-snug text-ink-strong">
            {cert.name} <span className="font-normal text-ink-muted">· {cert.provider}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            {cert.start_here && <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-blue-500">Start here</span>}
            {meta}
          </p>
        </div>
        <SaveButton itemType="certification" itemId={`${cert.provider}:${cert.name}`} itemName={cert.name} itemData={{ ...cert, career }} />
      </div>
      <p className="mt-2 text-[15px] text-ink">{cert.why}</p>
      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline">
        Official page <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </li>
  );
}

function CareersBasis({ savedCareers }) {
  const [, setSearchParams] = useSearchParams();
  const openOutlook = () => {
    setSearchParams((params) => {
      params.set("section", "career-outlook");
      return params;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-5 py-4 text-[15px] text-ink-muted dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
      <p>
        {savedCareers.length
          ? <>Based on the careers you saved: <span className="font-semibold text-ink-strong">{savedCareers.join(", ")}</span>. Saving or removing a career updates this list.</>
          : "Based on careers your degree leads to. Save the careers you're interested in and this list follows them."}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
        <button type="button" onClick={openOutlook} className="text-link hover:underline">
          {savedCareers.length ? "Change careers in Career outlook" : "Save careers in Career outlook"}
        </button>
        <Link to="/saved" className="text-link hover:underline">Manage your shortlist</Link>
      </div>
    </div>
  );
}

export default function CareerCertifications({ roadmapId }) {
  const { loading, groups, savedCareers, failed, retry } = useCareerCertifications(roadmapId);
  const [career, setCareer] = useState(null);

  if (loading) {
    return (
      <div role="status" className="space-y-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
        </div>
        <p className="text-[15px] text-ink-muted">Finding certifications employers value for your careers. The first time takes about 20 seconds.</p>
      </div>
    );
  }
  if (failed) {
    return (
      <div className="rounded-2xl bg-slate-50 px-6 py-5 dark:bg-slate-800/50">
        <p className="text-lg font-semibold text-ink-strong">Couldn't load certifications</p>
        <button type="button" onClick={retry} className="mt-3 text-sm font-semibold text-link hover:underline">Try again</button>
      </div>
    );
  }
  if (!groups.length) {
    return (
      <div>
        <CareersBasis savedCareers={savedCareers} />
        <p className="text-[15px] text-ink-muted">No certifications to suggest for your careers yet.</p>
      </div>
    );
  }

  const shown = career ? groups.filter((g) => g.career === career) : groups;

  return (
    <div>
      <CareersBasis savedCareers={savedCareers} />
      <p className="mb-2 text-sm font-semibold text-ink-strong">Show certifications for</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by career">
        <button type="button" className={filterPill(!career)} aria-pressed={!career} onClick={() => setCareer(null)}>All careers</button>
        {groups.map((g) => (
          <button key={g.career} type="button" className={filterPill(career === g.career)} aria-pressed={career === g.career} onClick={() => setCareer(g.career)}>
            {g.career}
          </button>
        ))}
      </div>
      <div className="mt-8 space-y-10">
        {shown.map((group) => (
          <section key={group.career}>
            <SubLabel hint={`${group.certifications.length} certification${group.certifications.length === 1 ? "" : "s"} employers value`}>{group.career}</SubLabel>
            <ul className="mt-4 space-y-3">
              {group.certifications.map((cert) => (
                <CertRow key={cert.name} cert={cert} career={group.career} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

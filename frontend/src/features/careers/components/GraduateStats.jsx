import { SourceLink } from "@/features/roadmap/components/SourceTags";

const formatStats = (area) =>
  [
    ["in full-time work after graduating", area.full_time_employment_rate != null ? `${area.full_time_employment_rate}%` : null],
    ["median starting salary", area.median_salary != null ? `$${area.median_salary.toLocaleString()}` : null],
  ].filter(([, value]) => value);

export default function GraduateStats({ outlook }) {
  if (!outlook?.length) return null;
  const source = outlook[0];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-line bg-surface px-5 py-3">
      {outlook.map((area) => (
        <div key={area.study_area} className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          {outlook.length > 1 && <span className="text-[13px] font-medium text-ink">{area.study_area}</span>}
          {formatStats(area).map(([label, value]) => (
            <span key={label} className="text-sm text-ink-muted">
              <span className="mr-1.5 text-xl font-semibold text-ink-strong">{value}</span>
              {label}
            </span>
          ))}
        </div>
      ))}
      <span className="text-xs text-ink-muted sm:ml-auto">
        All Australian graduates in {outlook.length > 1 ? "each study area" : source.study_area} ·{" "}
        <SourceLink href={source.source_url}>QILT {source.survey_year}</SourceLink>
      </span>
    </div>
  );
}

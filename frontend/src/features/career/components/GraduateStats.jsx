const formatStats = (area) =>
  [
    ["in full-time work after graduating", area.full_time_employment_rate != null ? `${area.full_time_employment_rate}%` : null],
    ["median starting salary", area.median_salary != null ? `$${area.median_salary.toLocaleString()}` : null],
  ].filter(([, value]) => value);

export default function GraduateStats({ outlook }) {
  if (!outlook?.length) return null;
  const area = outlook[0];
  const stats = formatStats(area);
  if (!stats.length) return null;
  return (
    <div className="mb-8">
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface px-5 py-4">
            <p className="text-[28px] font-semibold leading-tight text-ink-strong">{value}</p>
            <p className="mt-1 text-sm text-ink-muted">{label.charAt(0).toUpperCase() + label.slice(1)}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        QILT {area.survey_year}, all {area.study_area} graduates
      </p>
    </div>
  );
}

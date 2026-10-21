const formatStats = (area) =>
  [
    ["in full-time work after graduating", area.full_time_employment_rate != null ? `${area.full_time_employment_rate}%` : null],
    ["median starting salary", area.median_salary != null ? `$${area.median_salary.toLocaleString()}` : null],
  ].filter(([, value]) => value);

export function HeaderStats({ outlook }) {
  if (!outlook?.length) return null;
  const area = outlook[0];
  const parts = formatStats(area).map(([label, value]) => `${value} ${label}`);
  if (!parts.length) return null;
  return (
    <p className="mt-1 text-sm text-band-soft">
      {parts.join(" · ")} · QILT {area.survey_year}, all {area.study_area} graduates
    </p>
  );
}

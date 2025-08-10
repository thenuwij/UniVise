import RoadmapCard from "./RoadmapCard";

/**
 * CareersSection
 * - roles: array of strings to show concrete roles, e.g. ["Software Engineer", "Data Analyst"]
 * - rolesHint: fallback hint if you’re not passing full roles yet (e.g., "developer, analyst")
 * - sources: optional array of job-board/salary links to display (title + href)
 */
export default function CareersSection({ roles = [], rolesHint, sources = [] }) {
  const hasAnything = (roles && roles.length) || rolesHint || (sources && sources.length);

  return (
    <RoadmapCard title="Careers" subtitle="Example roles and places to explore. Live data coming soon.">
      {!hasAnything ? (
        <div className="text-slate-500">—</div>
      ) : (
        <div className="space-y-4">
          {!!roles.length && (
            <div>
              <div className="text-sm uppercase tracking-wide text-slate-500 mb-2">Common roles</div>
              <div className="flex flex-wrap gap-2">
                {roles.map((r, i) => (
                  <span key={i} className="px-3 py-1 rounded-full border border-slate-200 bg-white">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {rolesHint && !roles.length && (
            <div className="text-slate-700">
              Try roles like <span className="font-medium">{rolesHint}</span>.
            </div>
          )}

          {!!sources.length && (
            <div>
              <div className="text-sm uppercase tracking-wide text-slate-500 mb-2">Explore</div>
              <ul className="list-disc ml-5 space-y-1">
                {sources.map((s, i) => (
                  <li key={i}>
                    <a className="text-sky-700 hover:underline" href={s.href} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </RoadmapCard>
  );
}

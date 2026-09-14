
export default function SectionTitle({ icon, subtitle, tags, children }) {
  return (
    <div>
      {/* Top row: icon, subtitle pill, and optional tags */}
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-secondary">
        <div className="flex items-center gap-2">
          {icon}
          {subtitle && (
            <span className="px-2 py-0.5 rounded-full bg-accent text-primary border border-border-light dark:border-border-medium">
              {subtitle}
            </span>
          )}
        </div>
        {tags && <div className="flex flex-wrap gap-2">{tags}</div>}
      </div>

      {/* Main heading */}
      <h1 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight text-primary">
        {children}
      </h1>
    </div>
  );
}

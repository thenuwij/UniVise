
export default function SectionTitle({ icon, subtitle, children }) {
  return (
    <div>
      {/* Top row: icon and subtitle pill */}
      <div className="flex items-center gap-2 text-xs font-medium text-secondary">
        {icon}
        {subtitle && (
          <span className="px-2 py-0.5 rounded-full bg-accent text-primary border border-border-light dark:border-border-medium">
            {subtitle}
          </span>
        )}
      </div>

      {/* Main heading */}
      <h1 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight text-primary">
        {children}
      </h1>
    </div>
  );
}

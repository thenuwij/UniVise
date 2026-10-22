export default function SectionHeading({ children, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-[24px] md:text-[26px] font-bold tracking-tight text-ink-strong">{children}</h2>
        {subtitle && <p className="mt-1.5 text-base text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function SectionHeading({ children, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{children}</h2>
        <span aria-hidden className="mt-2.5 block h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-400" />
        {subtitle && <p className="mt-3 text-base text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

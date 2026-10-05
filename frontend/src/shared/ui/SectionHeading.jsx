export default function SectionHeading({ children, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-[22px] md:text-2xl font-bold text-slate-700 dark:text-slate-200">{children}</h2>
        <span aria-hidden className="mt-2 block h-1 w-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-400" />
        {subtitle && <p className="mt-2 text-base text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

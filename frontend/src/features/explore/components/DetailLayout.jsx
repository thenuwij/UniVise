import SectionHeading from "@/shared/ui/SectionHeading";

export const bandButton =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-white/10 border border-white/35 hover:bg-white/20 transition-colors";

export const bandButtonSolid =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-brand-blue bg-white shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all";

export const courseTile =
  "flex items-center justify-between gap-3 py-3.5 px-4 rounded-xl border border-line bg-gradient-to-br from-surface to-surface-tint hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer";

export function DetailSection({ title, children }) {
  return (
    <section className="py-8 first:pt-0 border-b border-line last:border-0">
      <SectionHeading>{title}</SectionHeading>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function FactRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-semibold text-ink-strong text-right">{value}</span>
    </div>
  );
}

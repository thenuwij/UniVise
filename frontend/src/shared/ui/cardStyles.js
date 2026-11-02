export const card =
  "rounded-2xl border border-line bg-gradient-to-br from-surface via-surface to-surface-tint shadow-sm";

export const bandButton =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-brand-blue bg-white/95 shadow-sm cursor-pointer hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] dark:bg-slate-100 dark:text-blue-900 dark:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue transition-all";

export const filterPill = (active) =>
  `rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
    active
      ? "bg-blue-600 text-white ring-1 ring-blue-600 dark:bg-blue-500 dark:ring-blue-500"
      : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-blue-50 hover:ring-blue-300 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800"
  }`;

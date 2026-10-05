import { ArrowLeft } from "lucide-react";

export default function PageHeader({ eyebrow, title, subtitle, back, actions, aside, children, compact = false }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-brand-navy via-brand-blue to-brand-indigo dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div aria-hidden className="absolute -top-36 -right-20 h-[480px] w-[480px] rounded-full bg-blue-300/15 dark:bg-blue-400/10" />
      <div aria-hidden className="absolute -bottom-44 left-1/3 h-[420px] w-[420px] rounded-full bg-indigo-300/15 dark:bg-indigo-400/10" />
      <div className={`relative max-w-[1440px] mx-auto px-5 md:px-10 ${compact ? "pt-4 pb-5" : "pt-5 pb-7"}`}>
        {(back || actions) && (
          <div className="flex items-center justify-between gap-4">
            {back ? (
              <button
                onClick={back.onClick}
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white/85 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {back.label}
              </button>
            ) : <span />}
            {actions && <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">{actions}</div>}
          </div>
        )}

        <div className={`${back || actions ? (compact ? "mt-3" : "mt-5") : ""} flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8`}>
          <div className="min-w-0">
            {eyebrow && <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-band-soft">{eyebrow}</p>}
            {title ? (
              <h1 className={`mt-2 font-extrabold text-band-ink ${compact ? "text-2xl md:text-3xl" : "text-4xl md:text-[42px] md:leading-[1.1]"}`}>
                {title}
              </h1>
            ) : (
              <div className="mt-2 h-11 w-80 max-w-full bg-white/20 rounded-xl animate-pulse" />
            )}
            {subtitle && <p className={`mt-2 text-band-soft ${compact ? "text-base" : "text-lg md:text-xl"}`}>{subtitle}</p>}
          </div>
          {aside && <div className="flex-shrink-0">{aside}</div>}
        </div>

        {children}
      </div>
    </section>
  );
}

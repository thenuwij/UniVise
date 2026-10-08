import { ArrowLeft } from "lucide-react";

const BACK_CLASS = "items-center gap-2 text-[15px] font-medium text-white/85 hover:text-white transition-colors";

function BackButton({ back, className = "" }) {
  return (
    <button onClick={back.onClick} className={`${BACK_CLASS} ${className}`}>
      <ArrowLeft className="h-4 w-4" />
      {back.label}
    </button>
  );
}

function TitleBlock({ eyebrow, title, subtitle, compact, back }) {
  return (
    <>
      {(eyebrow || back) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {back && (
            <span className="min-[1700px]:hidden inline-flex items-center gap-4">
              <BackButton back={back} className="inline-flex" />
              {eyebrow && <span aria-hidden className="h-4 w-px bg-white/30" />}
            </span>
          )}
          {eyebrow && <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-band-soft">{eyebrow}</p>}
        </div>
      )}
      {title ? (
        <h1 className={`mt-2 font-extrabold text-band-ink ${compact ? "text-2xl md:text-3xl" : "text-4xl md:text-[42px] md:leading-[1.1]"}`}>
          {title}
        </h1>
      ) : (
        <div className="mt-2 h-11 w-80 max-w-full bg-white/20 rounded-xl animate-pulse" />
      )}
      {subtitle && <p className={`mt-2 text-band-soft ${compact ? "text-base" : "text-lg md:text-xl"}`}>{subtitle}</p>}
    </>
  );
}

export default function PageHeader({ eyebrow, title, subtitle, back, actions, aside, children, compact = false }) {
  const padding = compact ? "pt-4 pb-5" : "pt-5 pb-7";
  const side = actions || aside;

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-brand-navy via-brand-blue to-brand-indigo dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div aria-hidden className="absolute -top-36 -right-20 h-[480px] w-[480px] rounded-full bg-blue-300/15 dark:bg-blue-400/10" />
      <div aria-hidden className="absolute -bottom-44 left-1/3 h-[420px] w-[420px] rounded-full bg-indigo-300/15 dark:bg-indigo-400/10" />
      {back && <BackButton back={back} className={`hidden min-[1700px]:inline-flex absolute left-8 ${compact ? "top-4" : "top-5"}`} />}

      <div className={`relative max-w-[1440px] mx-auto px-5 md:px-10 ${padding}`}>
        <div className={`flex flex-col md:flex-row md:justify-between gap-4 md:gap-8 ${actions ? "md:items-start" : "md:items-center"}`}>
          <div className="min-w-0">
            <TitleBlock eyebrow={eyebrow} title={title} subtitle={subtitle} compact={compact} back={back} />
          </div>
          {side && (
            <div className="flex-shrink-0 flex flex-col items-start md:items-end gap-3">
              {actions && <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">{actions}</div>}
              {aside}
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

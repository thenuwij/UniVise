import { useRef } from "react";
import { BookOpen } from "lucide-react";

export default function SectionNavigation({ sections, activeIndex, onChange, label, heading, tourPrefix }) {
  const refs = useRef([]);
  const handleKeyDown = (event) => {
    const current = refs.current.indexOf(event.target);
    if (current < 0) return;
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const target = event.key === "Home" ? 0 : event.key === "End" ? sections.length - 1 : delta ? current + delta : -1;
    if (target < 0 || target >= sections.length) return;
    event.preventDefault();
    onChange(target);
    refs.current[target]?.focus({ preventScroll: true });
  };

  return (
    <nav aria-label={label} onKeyDown={handleKeyDown} className="sticky top-0 z-20 -mx-5 border-b border-line bg-surface px-2 py-2 md:-mx-10 lg:top-6 lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
      <p className="hidden px-3 pb-3 pt-1 text-sm font-semibold text-ink-muted lg:block">{heading}</p>
      <div className={`grid gap-1 lg:flex lg:flex-col lg:gap-2 ${sections.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
        {sections.map((step, index) => {
          const Icon = step.icon || BookOpen;
          return (
            <button
              key={step.key}
              ref={(element) => { refs.current[index] = element; }}
              type="button"
              data-tour={tourPrefix ? `${tourPrefix}-${step.key}` : undefined}
              aria-label={step.title}
              aria-current={index === activeIndex ? "page" : undefined}
              onClick={() => onChange(index)}
              className={`relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-2 rounded-xl px-1 py-3 text-[11px] transition-[color,background-color,box-shadow] focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-300 ${sections.length === 5 ? "sm:text-xs" : "sm:text-sm"} lg:min-h-14 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-base ${index === activeIndex
                ? "bg-blue-600 font-semibold text-white shadow-sm dark:bg-blue-500"
                : "font-medium text-ink-muted hover:bg-slate-100 hover:text-ink-strong lg:text-ink-strong dark:hover:bg-slate-800"}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${index === activeIndex ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}>
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              {step.mobileTitle ? <><span className="sm:hidden">{step.mobileTitle}</span><span className="hidden sm:inline">{step.navTitle || step.title}</span></> : (step.navTitle || step.title)}
              {step.meta != null && <span className={`ml-auto hidden rounded-full px-2 py-0.5 text-xs font-semibold lg:inline ${index === activeIndex ? "bg-white/20 text-white" : "bg-slate-100 text-ink-muted dark:bg-slate-800"}`}>{step.meta}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

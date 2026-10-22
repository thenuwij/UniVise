import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Layers, Network, Users } from "lucide-react";
import SectionNavigation from "@/shared/ui/SectionNavigation";

const CONTAINER = "max-w-[1680px] mx-auto px-5 md:px-10";

function StepBar({ steps, activeIndex, onChange }) {
  const stepRefs = useRef([]);

  const handleKeyDown = (event) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const target = activeIndex + delta;
    if (!delta || target < 0 || target >= steps.length) return;
    event.preventDefault();
    onChange?.(target);
    stepRefs.current[target]?.focus();
  };

  return (
    <div className="border-b border-line bg-surface">
      <nav aria-label="Roadmap steps" onKeyDown={handleKeyDown} className={`${CONTAINER} py-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        {steps.map((s, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={s.key}
              ref={(el) => { stepRefs.current[i] = el; }}
              onClick={() => onChange?.(i)}
              data-tour={`roadmap-section-${s.key}`}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-slate-900 font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {s.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const SECTION_ICONS = { overview: BookOpen, structure: Layers, coursemesh: Network, societies: Users };


export default function RoadmapFlow({ steps = [], activeIndex = 0, onChange, header = null, sectionNavigation = false }) {
  const prev = steps[activeIndex - 1];
  const next = steps[activeIndex + 1];

  const goTo = (i) => {
    onChange?.(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      {header}
      {!sectionNavigation && <StepBar steps={steps} activeIndex={activeIndex} onChange={goTo} />}

      <div className={`${CONTAINER} pb-12 ${sectionNavigation ? "grid items-start gap-6 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-8 lg:pt-8" : "pt-8"}`}>
        {sectionNavigation && <SectionNavigation sections={steps.map((step) => ({ ...step, icon: SECTION_ICONS[step.key] }))} activeIndex={activeIndex} onChange={goTo} label="Program sections" heading="IN THIS PROGRAM" tourPrefix="roadmap-section" />}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[activeIndex]?.key || "empty"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {steps[activeIndex]?.render?.()}
            </motion.div>
          </AnimatePresence>

          {activeIndex >= 0 && (prev || next) && !(sectionNavigation && steps[activeIndex]?.key === "structure") && (
            <div className="mt-10 pt-6 border-t border-line flex items-center justify-between gap-4">
              {prev ? (
                <button
                  onClick={() => goTo(activeIndex - 1)}
                  className="inline-flex items-center gap-2 text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <ChevronLeft className="h-5 w-5" /> {prev.title}
                </button>
              ) : <span />}
              {next && (
                <button
                  onClick={() => goTo(activeIndex + 1)}
                  className="group inline-flex items-center gap-1.5 text-base font-semibold text-link hover:underline underline-offset-4"
                >
                  {sectionNavigation && next.key === "structure" ? "View your courses" : `Next: ${next.title}`}
                  <ChevronRight className="h-5 w-5 text-ink-muted" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

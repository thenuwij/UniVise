import { Fragment, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const CONTAINER = "max-w-[1440px] mx-auto px-5 md:px-10";

function StepBar({ steps, activeIndex, onChange }) {
  const prev = steps[activeIndex - 1];
  const next = steps[activeIndex + 1];
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
    <nav aria-label="Roadmap steps" onKeyDown={handleKeyDown} className={`${CONTAINER} pt-3 flex items-center gap-4 md:gap-8`}>
      <button
        onClick={() => onChange?.(activeIndex - 1)}
        disabled={!prev}
        className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="flex-1 flex items-center min-w-0">
        {steps.map((s, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <Fragment key={s.key}>
              <button
                ref={(el) => { stepRefs.current[i] = el; }}
                onClick={() => onChange?.(i)}
                aria-current={active ? "step" : undefined}
                className="flex-shrink-0 flex items-center gap-3 group"
              >
                <span
                  className={`h-8 w-8 flex-shrink-0 rounded-full inline-flex items-center justify-center text-sm font-bold transition-all ${
                    active
                      ? "text-white bg-gradient-to-br from-blue-600 to-indigo-600 ring-[6px] ring-blue-100 dark:ring-blue-900/60 shadow-lg shadow-blue-600/30"
                      : done
                      ? "text-white bg-blue-600"
                      : "text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 group-hover:border-blue-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`text-base whitespace-nowrap ${
                    active
                      ? "font-bold text-slate-900 dark:text-white"
                      : `hidden md:inline font-semibold ${done ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"} group-hover:text-blue-700 dark:group-hover:text-blue-300`
                  }`}
                >
                  {s.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span aria-hidden className="flex-1 h-1 mx-3 md:mx-5 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden">
                  <span
                    className={`block h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500 ${i < activeIndex ? "w-full" : "w-0"}`}
                  />
                </span>
              )}
            </Fragment>
          );
        })}
      </div>

      <button
        onClick={() => onChange?.(activeIndex + 1)}
        disabled={!next}
        className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/30 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <span className="hidden sm:inline">Next</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export default function RoadmapFlow({ steps = [], activeIndex = 0, onChange, header = null }) {
  const prev = steps[activeIndex - 1];
  const next = steps[activeIndex + 1];

  const goTo = (i) => {
    onChange?.(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      {header}
      <StepBar steps={steps} activeIndex={activeIndex} onChange={onChange} />

      <div className={`${CONTAINER} pt-8 pb-12`}>
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

        {(prev || next) && (
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            {prev ? (
              <button
                onClick={() => goTo(activeIndex - 1)}
                className="inline-flex items-center gap-2 text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <ArrowLeft className="h-5 w-5" /> {prev.title}
              </button>
            ) : <span />}
            {next && (
              <button
                onClick={() => goTo(activeIndex + 1)}
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all"
              >
                Next: {next.title}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

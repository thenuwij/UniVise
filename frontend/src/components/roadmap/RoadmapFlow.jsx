import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RoadmapFlow({ steps = [], activeIndex = 0, onChange, verticalOnMobile = true }) {
  const containerRef = useRef(null);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (!steps.length) return;
      if (["ArrowRight","ArrowDown"].includes(e.key)) {
        e.preventDefault();
        onChange?.(Math.min(activeIndex + 1, steps.length - 1));
      } else if (["ArrowLeft","ArrowUp"].includes(e.key)) {
        e.preventDefault();
        onChange?.(Math.max(activeIndex - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, steps.length, onChange]);

  return (
    <div ref={containerRef} className="w-full">
      {/* PATH + NODES */}
      <div className={`${verticalOnMobile ? "flex-col gap-6" : ""} flex md:flex-col`}>
        <div className="relative">
          {/* SVG path (desktop) */}
          <div className="hidden md:block">
            <svg className="w-full h-16" viewBox="0 0 100 16" preserveAspectRatio="none">
              <path
                d="M2,8 L98,8"
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="0.8"
                fill="none"
              />
              <path
                d={`M2,8 L${2 + (96 * (activeIndex / (Math.max(steps.length - 1, 1))))},8`}
                className="stroke-sky-600 dark:stroke-sky-400"
                strokeWidth="1.2"
                fill="none"
              />
            </svg>
          </div>

          {/* Nodes (desktop) */}
          <div className="hidden md:grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-0 -mt-12">
            {steps.map((s, i) => {
              const active = i === activeIndex;
              const completed = i < activeIndex;
              return (
                <button
                  key={s.key}
                  onClick={() => onChange?.(i)}
                  className="group flex flex-col items-center focus:outline-none"
                  aria-current={active ? "step" : undefined}
                >
                  <div
                    className={[
                      "h-5 w-5 rounded-full border transition-all",
                      active
                        ? "bg-primary border-primary scale-110"
                        : completed
                        ? "bg-secondary border-secondary"
                        : "bg-card border-border-light dark:border-border-medium"
                    ].join(" ")}
                    title={s.title}
                  />
                  <div className="mt-2 text-xs text-secondary group-hover:text-primary transition-colors">
                    {s.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Nodes (mobile vertical) */}
          <div className="md:hidden space-y-4">
            {steps.map((s, i) => {
              const active = i === activeIndex;
              const completed = i < activeIndex;
              return (
                <button
                  key={s.key}
                  onClick={() => onChange?.(i)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border-light dark:border-border-medium hover:bg-accent dark:hover:bg-secondary transition"
                >
                  <span
                    className={[
                      "h-3 w-3 rounded-full border",
                      active
                        ? "bg-primary border-primary"
                        : completed
                        ? "bg-secondary border-secondary"
                        : "bg-card border-border-light dark:border-border-medium"
                    ].join(" ")}
                  />
                  <span className={`text-sm ${active ? "font-medium text-primary" : "text-secondary"}`}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={steps[activeIndex]?.key || "empty"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {steps[activeIndex]?.render?.()}
          </motion.div>
        </AnimatePresence>

        {/* Prev/Next */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => onChange?.(Math.max(activeIndex - 1, 0))}
            disabled={activeIndex === 0}
            className="button-base button-secondary disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => onChange?.(Math.min(activeIndex + 1, steps.length - 1))}
            disabled={activeIndex === steps.length - 1}
            className="button-base button-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

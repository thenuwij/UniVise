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

      {/* PATH and NODES with NAVIGATION BUTTONS */}
      <div className={`${verticalOnMobile ? "flex-col gap-6" : ""} flex md:flex-col`}>
        
        <div className="hidden md:block">
          <div className="flex items-center gap-4">
            {/* Previous Button */}
            <button
              onClick={() => onChange?.(Math.max(activeIndex - 1, 0))}
              disabled={activeIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 shadow-md flex-shrink-0
                ${activeIndex === 0 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-lg hover:scale-105'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Circles with Path */}
            <div className="relative flex-1">
              {/* Blue line on top */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full" />
              
              {/* SVG path */}
              <svg className="w-full h-16" viewBox="0 0 100 16" preserveAspectRatio="none">
                <path
                  d="M2,8 L98,8"
                  className="stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth="0.8"
                  fill="none"
                />
                <path
                  d={`M2,8 L${2 + (96 * (activeIndex / (Math.max(steps.length - 1, 1))))},8`}
                  className="stroke-blue-600 dark:stroke-blue-400"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>

              {/* Nodes */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-0 -mt-12">
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
                          "h-5 w-5 rounded-full border-2 transition-all duration-200 cursor-pointer",
                          "hover:scale-125 hover:shadow-lg",
                          active
                            ? "bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 scale-110 shadow-md"
                            : completed
                            ? "bg-blue-400 dark:bg-blue-600 border-blue-400 dark:border-blue-600"
                            : "bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-400"
                        ].join(" ")}
                        title={s.title}
                      />
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-medium">
                        {s.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => onChange?.(Math.min(activeIndex + 1, steps.length - 1))}
              disabled={activeIndex === steps.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 shadow-md flex-shrink-0
                ${activeIndex === steps.length - 1
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-lg hover:scale-105'
                }`}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile vertical nodes */}
        <div className="md:hidden space-y-4">
          {steps.map((s, i) => {
            const active = i === activeIndex;
            const completed = i < activeIndex;
            return (
              <button
                key={s.key}
                onClick={() => onChange?.(i)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200"
              >
                <span
                  className={[
                    "h-4 w-4 rounded-full border-2",
                    active
                      ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                      : completed
                      ? "bg-blue-400 border-blue-400 dark:bg-blue-600 dark:border-blue-600"
                      : "bg-white border-blue-300 dark:bg-slate-800 dark:border-blue-700"
                  ].join(" ")}
                />
                <span className={`text-sm font-medium ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-8">
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
      </div>
    </div>
  );
}
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * RoadmapFlow
 * Props:
 *  - steps: [{ key: 'entry', title: 'Entry Requirements', render: () => JSX }]
 *  - activeIndex: number
 *  - onChange: (index:number) => void
 *  - verticalOnMobile: boolean (default true)
 */
export default function RoadmapFlow({ steps = [], activeIndex = 0, onChange, verticalOnMobile = true }) {
  const containerRef = useRef(null);

  // Keyboard nav (←/→) and (↑/↓)
  useEffect(() => {
    const handler = (e) => {
      if (!steps.length) return;
      if (["ArrowRight","ArrowDown"].includes(e.key)) {
        e.preventDefault();
        onChange && onChange(Math.min(activeIndex + 1, steps.length - 1));
      } else if (["ArrowLeft","ArrowUp"].includes(e.key)) {
        e.preventDefault();
        onChange && onChange(Math.max(activeIndex - 1, 0));
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
          {/* SVG path (horizontal on desktop, stacked on mobile using grid) */}
          <div className="hidden md:block">
            <svg className="w-full h-16" viewBox="0 0 100 16" preserveAspectRatio="none">
              <path d="M2,8 L98,8" stroke="#e5e7eb" strokeWidth="0.8" fill="none" />
              {/* active progress */}
              <path d={`M2,8 L${2 + (96 * (activeIndex/(Math.max(steps.length-1,1))))},8`} stroke="#0f172a" strokeWidth="1.2" fill="none" />
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
                  onClick={() => onChange && onChange(i)}
                  className="group flex flex-col items-center focus:outline-none"
                  aria-current={active ? "step" : undefined}
                >
                  <div
                    className={[
                      "h-5 w-5 rounded-full border transition-all",
                      active ? "bg-slate-900 border-slate-900 scale-110" :
                      completed ? "bg-slate-700 border-slate-700" : "bg-white border-slate-300"
                    ].join(" ")}
                    title={s.title}
                  />
                  <div className="mt-2 text-xs text-slate-600 group-hover:text-slate-900">{s.title}</div>
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
                  onClick={() => onChange && onChange(i)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-slate-50 transition"
                >
                  <span className={[
                    "h-3 w-3 rounded-full border",
                    active ? "bg-slate-900 border-slate-900" :
                    completed ? "bg-slate-700 border-slate-700" : "bg-white border-slate-300"
                  ].join(" ")} />
                  <span className={`text-sm ${active ? "font-medium text-slate-900" : "text-slate-600"}`}>{s.title}</span>
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
            onClick={() => onChange && onChange(Math.max(activeIndex - 1, 0))}
            disabled={activeIndex === 0}
            className="px-4 py-2 rounded-xl border disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => onChange && onChange(Math.min(activeIndex + 1, steps.length - 1))}
            disabled={activeIndex === steps.length - 1}
            className="px-4 py-2 rounded-xl border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

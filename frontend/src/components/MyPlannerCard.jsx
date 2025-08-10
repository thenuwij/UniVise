// src/components/MyPlannerCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function MyPlannerCard() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-sm max-w-4xl mx-auto">
      {/* soft spotlight aura */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_220px_at_85%_-20%,rgba(56,189,248,0.18),transparent),radial-gradient(520px_240px_at_0%_-10%,rgba(99,102,241,0.16),transparent)]" />

      <div className="relative p-6 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
          {/* Copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              Planner & Roadmap
            </div>

            <h3 className="mt-3 text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              Map your degree. Plan with confidence.
            </h3>

            <p className="mt-2 text-slate-600">
              Build your study plan in <span className="font-medium">My Planner</span> (powered by
              MindMesh for prerequisite clarity), then explore paths on the{" "}
              <span className="font-medium">Roadmap</span> (with a Switch Major Simulator to test
              “what-ifs”). Two simple places—one calm view of your journey.
            </p>

            {/* CTAs (only two) */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/roadmap")}
                className="group inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-black transition"
                aria-label="Open Roadmap"
              >
                Open Roadmap
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                onClick={() => navigate("/planner")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50 transition"
                aria-label="Open My Planner"
              >
                Open My Planner
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6h6a3 3 0 0 1 0 6H8a4 4 0 0 0 0 8h8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Minimal visual */}
          <div className="shrink-0 w-full lg:w-60">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 relative overflow-hidden">
                {/* subtle “nodes” motif */}
                <div className="absolute inset-0 opacity-70 [mask-image:radial-gradient(transparent,black)]">
                  <svg viewBox="0 0 300 140" className="w-full h-full">
                    <g fill="none" stroke="currentColor" strokeOpacity="0.12">
                      <circle cx="52" cy="70" r="9" />
                      <circle cx="130" cy="38" r="8" />
                      <circle cx="204" cy="88" r="10" />
                      <circle cx="252" cy="44" r="6" />
                      <path d="M60 68 L121 42" />
                      <path d="M140 45 L198 84" />
                      <path d="M214 85 L247 48" />
                    </g>
                  </svg>
                </div>
                <div className="absolute bottom-3 left-3 right-3 grid grid-cols-1 gap-1 text-[11px] text-slate-600">
                  <div className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    MindMesh clarity
                  </div>
                  <div className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    Switch major simulator
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[11px] leading-5 text-slate-500">
                Start in <span className="font-medium">My Planner</span> to add degrees/courses,
                then preview alternate routes on the <span className="font-medium">Roadmap</span>.
              </div>
            </div>
          </div>
        </div>

        {/* tiny note */}
        <div className="mt-4 text-[11px] text-slate-500">
          Tip: Add a few choices in My Planner first—your Roadmap gets smarter.
        </div>
      </div>
    </div>
  );
}

// src/components/EuniceChatCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { HiChatBubbleLeftRight, HiSparkles } from "react-icons/hi2";

export default function EuniceChatCard({ userType }) {
  const navigate = useNavigate();
  const isHS = userType === "high_school";

  const blurb = isHS
    ? "Ask Eunice about degrees, ATAR pathways, and which subjects give you the best leverage."
    : "Ask Eunice about courses, internships, skills to build, and how to stand out next term.";

  const chips = isHS
    ? ["ATAR pathways", "Subject combos", "Degree fit", "Career outlook"]
    : ["Course planner", "Internships", "Skill gaps", "Career fit"];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-sm w-2/5 py-2.5">
      {/* soft spotlight aura (mirrors MyPlannerCard) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_200px_at_90%_-20%,rgba(56,189,248,0.18),transparent),radial-gradient(480px_220px_at_0%_-10%,rgba(99,102,241,0.16),transparent)]" />

      <div className="relative p-4 md:p-7">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Eunice • AI Career Advisor
          </div>

          {/* playful jumping icon */}
          <div className="text-slate-700">
            <HiChatBubbleLeftRight className="h-6 w-6 animate-bounce" />
          </div>
        </div>

        <h3 className="mt-3 text-2xl font-semibold text-slate-900 tracking-tight">
          Got questions? Ask Eunice.
        </h3>

        <p className="mt-2 text-slate-600">{blurb}</p>

        {/* chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
            >
              {c}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-4">
          <button
            onClick={() => navigate("/chat")} // change route if needed
            className="group inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-black transition"
            aria-label="Chat with Eunice"
          >
            <span className="relative inline-flex items-center">
              <HiSparkles className="mr-2 h-4 w-4 opacity-90 group-hover:scale-110 transition" />
              Chat with Eunice
            </span>
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
        </div>

        {/* tiny hint */}
        <div className="mt-3 text-[11px] text-slate-500">
          Try: <span className="font-medium">“Compare Commerce vs Economics for me.”</span>
        </div>
      </div>
    </div>
  );
}

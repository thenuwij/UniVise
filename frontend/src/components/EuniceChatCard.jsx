import React from "react";
import { useNavigate } from "react-router-dom";
import { HiSparkles } from "react-icons/hi2";
import { Button } from "flowbite-react";

export default function EuniceChatCard({ userType }) {
  const navigate = useNavigate();
  const isHS = userType === "high_school";

  return (
    <div className="card-glass-spotlight w-2/5 py-2.5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_200px_at_90%_-20%,rgba(56,189,248,0.18),transparent),radial-gradient(480px_220px_at_0%_-10%,rgba(99,102,241,0.16),transparent)]" />
      <div className="relative p-4 md:p-7">
        <h3 className="text-2xl font-semibold tracking-tight">
          Got questions? Ask Eunice.
        </h3>
        <p className="mt-2 text-sm font-normal text-slate-600 dark:text-slate-400">
          {isHS
            ? "Ask about degrees, ATAR pathways, and which subjects give you the best head start."
            : "Ask about courses, internships and career fit."}
        </p>

        <div className="mt-4">
          <Button onClick={() => navigate("/chat")} pill className="button-primary">
            <HiSparkles className="mr-2 h-4 w-4" />
            Chat with Eunice
          </Button>
        </div>

        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-300">
          Try: <span className="font-medium">"Compare Commerce vs Economics for me."</span>
        </p>
      </div>
    </div>
  );
}

import { Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { RiGuideFill } from "react-icons/ri";

export default function RoadmapHeroCard() {
  const navigate = useNavigate();

  return (
    <div className="card-glass-spotlight w-full h-full">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_85%_-20%,rgba(56,189,248,0.20),transparent),radial-gradient(620px_280px_at_0%_-10%,rgba(99,102,241,0.18),transparent)]" />

      <div className="relative p-7 md:p-9 h-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-900/20 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              <RiGuideFill className="h-3.5 w-3.5" />
              Start here
            </div>

            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Build your academic roadmap
            </h2>

            <p className="mt-3 text-base font-normal text-slate-600 dark:text-slate-400">
              Generate a personalised, term-by-term plan for any UNSW degree — tailored to your
              goals and career direction. This is the best place to start.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate("/roadmap-entryload")}
                className="button-primary"
                size="lg"
                pill
              >
                <RiGuideFill className="mr-2 h-5 w-5" />
                Build my roadmap
              </Button>
            </div>
          </div>

          <div className="shrink-0 lg:w-80">
            <div className="rounded-2xl border border-slate-200/60 backdrop-blur-sm p-5 shadow-lg">
              <div className="h-40 rounded-xl bg-gradient-to-b dark:bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5" />
                <div className="absolute inset-0 opacity-80 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]">
                  <svg viewBox="0 0 300 140" className="w-full h-full">
                    <defs>
                      <filter id="roadmapGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="roadmapConnection" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                    <g stroke="url(#roadmapConnection)" strokeWidth="1.5" fill="none">
                      <path d="M60 70 Q95 45 130 38" className="animate-pulse" style={{ animationDelay: "0s" }} />
                      <path d="M140 45 Q172 55 204 88" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
                      <path d="M214 85 Q233 67 252 44" className="animate-pulse" style={{ animationDelay: "1s" }} />
                      <path d="M52 61 Q100 95 204 98" className="animate-pulse" style={{ animationDelay: "1.5s" }} opacity="0.6" />
                    </g>
                    <g filter="url(#roadmapGlow)">
                      <circle cx="52" cy="70" r="10" fill="#3b82f6" fillOpacity="0.8" stroke="#1e40af" strokeWidth="2">
                        <animate attributeName="r" values="10;12;10" dur="3s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="130" cy="38" r="8" fill="#8b5cf6" fillOpacity="0.8" stroke="#7c3aed" strokeWidth="1.5">
                        <animate attributeName="r" values="8;10;8" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
                      </circle>
                      <circle cx="204" cy="88" r="9" fill="#10b981" fillOpacity="0.8" stroke="#059669" strokeWidth="1.5">
                        <animate attributeName="r" values="9;11;9" dur="2.8s" repeatCount="indefinite" begin="1s" />
                      </circle>
                      <circle cx="252" cy="44" r="7" fill="#f59e0b" fillOpacity="0.8" stroke="#d97706" strokeWidth="1.5">
                        <animate attributeName="r" values="7;9;7" dur="2.2s" repeatCount="indefinite" begin="1.5s" />
                      </circle>
                      <circle cx="95" cy="55" r="4" fill="#6366f1" fillOpacity="0.6" />
                      <circle cx="172" cy="65" r="3" fill="#ec4899" fillOpacity="0.6" />
                      <circle cx="233" cy="67" r="3" fill="#14b8a6" fillOpacity="0.6" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/components/MyPlannerCard.jsx
import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";


export default function MyPlannerCard() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  
  useEffect(() => {
    const loadType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const type = user?.user_metadata?.student_type; // "high_school" or "university"
      setUserType(type || null);
    };

    loadType();
  }, []);

  return (
    <div className="card-glass-spotlight">
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

            <h3 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
              Map your degree. Plan with confidence.
            </h3>

            <p className="mt-2">
              Build your study plan in <span className="font-medium">My Planner</span> (powered by
              MindMesh for prerequisite clarity), then explore paths on the{" "}
              <span className="font-medium">Roadmap</span> (with a Switch Major Simulator to test
              “what-ifs”). Two simple places—one calm view of your journey.
            </p>

            {/* CTAs (only two) */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate("/roadmap-entryload")}
                className="button-primary"
                pill
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
              </Button>

              <Button
                onClick={() => {
                  if (userType === "high_school") {
                    navigate("/planner/school");
                  } else {
                    navigate("/planner");
                  }
                }}
                pill
                className="button-primary"
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
              </Button>
            </div>
          </div>

        {/* Enhanced visual with animated nodes - TEXT OUTSIDE */}
          <div className="shrink-0 lg:w-80">
            <div className="rounded-2xl border border-slate-200/60 backdrop-blur-sm p-5 shadow-lg">
              {/* Clean visual with just the nodes */}
              <div className="h-36 rounded-xl bg-gradient-to-b dark:bg-gray-900 relative overflow-hidden group">
                
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5" />
                
                {/* Enhanced nodes network */}
                <div className="absolute inset-0 opacity-80 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]">
                  <svg viewBox="0 0 300 140" className="w-full h-full">
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      
                      <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.3"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Connection lines with gradient */}
                    <g stroke="url(#connectionGradient)" strokeWidth="1.5" fill="none">
                      <path d="M60 70 Q95 45 130 38" className="animate-pulse" style={{animationDelay: '0s'}} />
                      <path d="M140 45 Q172 55 204 88" className="animate-pulse" style={{animationDelay: '0.5s'}} />
                      <path d="M214 85 Q233 67 252 44" className="animate-pulse" style={{animationDelay: '1s'}} />
                      <path d="M52 61 Q100 95 204 98" className="animate-pulse" style={{animationDelay: '1.5s'}} opacity="0.6" />
                    </g>
                    
                    {/* Main nodes with enhanced styling */}
                    <g filter="url(#glow)">
                      {/* Primary node */}
                      <circle cx="52" cy="70" r="10" fill="#3b82f6" fillOpacity="0.8" stroke="#1e40af" strokeWidth="2">
                        <animate attributeName="r" values="10;12;10" dur="3s" repeatCount="indefinite"/>
                      </circle>
                      
                      {/* Secondary nodes */}
                      <circle cx="130" cy="38" r="8" fill="#8b5cf6" fillOpacity="0.8" stroke="#7c3aed" strokeWidth="1.5">
                        <animate attributeName="r" values="8;10;8" dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
                      </circle>
                      
                      <circle cx="204" cy="88" r="9" fill="#10b981" fillOpacity="0.8" stroke="#059669" strokeWidth="1.5">
                        <animate attributeName="r" values="9;11;9" dur="2.8s" repeatCount="indefinite" begin="1s"/>
                      </circle>
                      
                      <circle cx="252" cy="44" r="7" fill="#f59e0b" fillOpacity="0.8" stroke="#d97706" strokeWidth="1.5">
                        <animate attributeName="r" values="7;9;7" dur="2.2s" repeatCount="indefinite" begin="1.5s"/>
                      </circle>
                      
                      {/* Smaller connecting nodes */}
                      <circle cx="95" cy="55" r="4" fill="#6366f1" fillOpacity="0.6" />
                      <circle cx="172" cy="65" r="3" fill="#ec4899" fillOpacity="0.6" />
                      <circle cx="233" cy="67" r="3" fill="#14b8a6" fillOpacity="0.6" />
                    </g>
                    
                    {/* Floating particles */}
                    <g fill="#8b5cf6" fillOpacity="0.3">
                      <circle cx="80" cy="25" r="1.5">
                        <animateTransform attributeName="transform" type="translate" values="0,0; 10,5; 0,0" dur="4s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="180" cy="115" r="1">
                        <animateTransform attributeName="transform" type="translate" values="0,0; -5,8; 0,0" dur="3.5s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="270" cy="85" r="1.5">
                        <animateTransform attributeName="transform" type="translate" values="0,0; -8,-3; 0,0" dur="4.2s" repeatCount="indefinite"/>
                      </circle>
                    </g>          
                  </svg>
                </div>
                
                {/* Subtle grid overlay */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }} />
              </div>
              
              {/* Feature indicators OUTSIDE the visual box */}
              <div className="mt-3 space-y-1.5">
                <div className="flex gap-1.5">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200/50 text-[11px] text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium">MindMesh Clarity</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200/50 text-[11px] text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" style={{animationDelay: '0.5s'}} />
                    <span className="font-medium">Roadmap Planner</span>
                  </div>
                </div>
                
                {/* Connection indicator */}
                <div className="text-[10px]  font-medium opacity-70 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI-powered connections
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* tiny note */}
        <div className="mt-4 text-[11px] ">
          Tip: Add a few choices in My Planner first—your Roadmap gets smarter.
        </div>
      </div>
    </div>
  );
}

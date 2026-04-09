import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiExternalLink,
  HiMap,
} from "react-icons/hi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TbRobot } from "react-icons/tb";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

// ── Loading skeleton ──────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4">
      {[8, 5, 7].map((lines, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className={`h-4 bg-slate-100 dark:bg-slate-800 rounded ${i === 0 ? "w-2/3" : i === 1 ? "w-1/2" : "w-full"}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared score helpers ──────────────────────────────────────────
function toPercent(v) {
  if (v == null) return 0;
  if (typeof v === "number") return Math.max(0, Math.min(100, v <= 1 ? v * 100 : v));
  if (typeof v === "string") {
    const m = v.match(/(\d+(?:\.\d+)?)/);
    if (m) return Math.max(0, Math.min(100, parseFloat(m[1])));
  }
  return 0;
}

function scoreColor(val) {
  if (val >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (val >= 60) return "text-blue-600 dark:text-blue-400";
  return "text-amber-600 dark:text-amber-400";
}

function scoreBarColor(val) {
  if (val >= 80) return "from-emerald-500 to-teal-400";
  if (val >= 60) return "from-blue-500 to-indigo-400";
  return "from-amber-500 to-orange-400";
}

// ── Hero card ─────────────────────────────────────────────────────
function HeroCard({ recommendation, summary, scores, userType, explanation }) {
  const fallbackTitle = userType === "high_school" ? "Degree Recommendation" : "Career Recommendation";

  const scoreItems = (userType === "university"
    ? [
        { key: "academic_performance", label: "Academic Performance" },
        { key: "skill_match", label: "Skill Match" },
        { key: "market_demand", label: "Market Demand" },
      ]
    : [
        { key: "academic_match", label: "Academic Match" },
        { key: "interest_fit", label: "Interest Fit" },
        { key: "career_outlook", label: "Career Outlook" },
      ]
  ).filter((i) => scores?.[i.key] != null);

  const hasScores = scoreItems.length > 0;

  return (
    <>
      {/* Title area */}
      <div className="p-8 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-5 uppercase tracking-wider">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
          Recommendation
        </div>

        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 pb-1 leading-tight">
          {recommendation?.title || fallbackTitle}
        </h1>

        {recommendation?.subtitle && (
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
            {recommendation.subtitle}
          </p>
        )}

        {recommendation?.badges?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recommendation.badges.map((b, i) => {
              const colorMap = {
                info: "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700",
                success: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
                purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700",
              };
              return (
                <span key={i} className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorMap[b.color] ?? colorMap.info}`}>
                  {b.label}
                </span>
              );
            })}
          </div>
        )}

        {summary && (
          <p className="mt-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {summary}
          </p>
        )}
      </div>

      {/* Score stats — Apple Health style */}
      {hasScores && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="flex divide-x divide-slate-100 dark:divide-slate-800">
            {scoreItems.map(({ key, label }) => {
              const val = toPercent(scores[key]);
              return (
                <div key={key} className="flex-1 px-6 py-5 text-center">
                  <div className={`text-4xl font-bold tracking-tight tabular-nums ${scoreColor(val)}`}>
                    {Math.round(val)}%
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mt-1">
                    {label}
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mx-auto max-w-[64px]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(val)} transition-all duration-700`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights — joined to the same card */}
      {explanation && (() => {
        const chunks = explanation.split("\n").map((c) => c.trim()).filter(Boolean).slice(0, 3);
        if (!chunks.length) return null;
        return (
          <div className="border-t border-slate-100 dark:border-slate-800 px-8 py-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Our Insights</h2>
            <div className="space-y-3">
              {chunks.map((chunk, i) => (
                <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{chunk}</p>
              ))}
            </div>
          </div>
        );
      })()}
    </>
  );
}

// ── Next Steps section (no outer card) ───────────────────────────
function NextStepsSection({ steps = [] }) {
  if (!steps.length) return null;
  return (
    <div className="px-8 py-7">
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Next Steps</h2>
      <div className="space-y-5">
        {steps.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {i + 1}
            </div>
            <p className="flex-1 pt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Roadmap CTA section (no outer card) ──────────────────────────
function RoadmapCTASection({ userType, onRoadmap }) {
  const isHS = userType === "high_school";
  const chips = isHS
    ? ["Subject plan", "Milestones", "Deadlines", "ATAR focus"]
    : ["Skills plan", "Projects", "Internships", "Milestones"];

  return (
    <div className="px-8 py-7 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-white/20">
          <HiMap className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold">Generate a Roadmap</h2>
      </div>
      <p className="text-sm text-white/80 leading-relaxed mb-4">
        {isHS
          ? "Turn this into an ATAR-ready plan with subjects, milestones, and deadlines."
          : "Turn this into a semester roadmap with electives, projects, and internships."}
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {chips.map((c, i) => (
          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/15 border border-white/20 font-medium">
            {c}
          </span>
        ))}
      </div>
      <button
        onClick={onRoadmap}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-purple-700 font-semibold text-sm hover:bg-white/90 transition-all"
      >
        Generate Roadmap
        <HiArrowLeft className="w-4 h-4 rotate-180" />
      </button>
    </div>
  );
}

// ── Info tabs card ────────────────────────────────────────────────
function InfoTabsCard({ userType, specialisations, careerPaths, entryRequirements, companies, jobOpp, resources }) {
  const isHS = userType === "high_school";

  const tabs = [
    isHS
      ? { id: "specs", label: "Specialisations", items: specialisations, type: "chips" }
      : { id: "companies", label: "Companies", items: companies.slice(0, 6), type: "chips" },
    isHS
      ? { id: "careers", label: "Career Pathways", items: careerPaths, type: "list" }
      : { id: "jobs", label: "Job Opportunities", items: jobOpp, type: "list" },
    ...(isHS && entryRequirements?.length > 0
      ? [{ id: "entry", label: "Entry Requirements", items: entryRequirements, type: "list" }]
      : []),
    ...(resources?.length > 0
      ? [{ id: "resources", label: "Resources", items: resources.slice(0, 6), type: "resources" }]
      : []),
  ].filter((t) => t.items?.length > 0);

  const [active, setActive] = useState(tabs[0]?.id ?? "");

  if (tabs.length === 0) return null;

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  const getDisplayText = (url) => {
    try {
      const { hostname, pathname } = new URL(url);
      const seg = pathname.split("/").filter(Boolean)[0];
      return seg ? `${hostname} / ${seg}` : hostname;
    } catch {
      return url;
    }
  };

  return (
    <>
      {/* Tab bar */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              active === t.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-8">
        {current?.type === "chips" && (
          <div className="flex flex-wrap gap-2">
            {current.items.map((item, i) => (
              <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-blue-900/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {item}
              </span>
            ))}
          </div>
        )}

        {current?.type === "list" && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <HiCheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {current?.type === "resources" && (
          <ul className="space-y-2">
            {current.items.map((r, i) => (
              <li key={i}>
                <a
                  href={r}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm text-blue-600 dark:text-blue-400 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                >
                  <HiExternalLink className="w-4 h-4 flex-shrink-0" />
                  {getDisplayText(r)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────
function RecommendationPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { id } = useParams();
  const { session } = UserAuth();
  const navigate = useNavigate();
  const userType = session?.user?.user_metadata?.student_type;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const pollRef = useRef(null);
  const startedAtRef = useRef(null);
  const [explanation, setExplanation] = useState("");
  const [scoreBreakdown, setScoreBreakdown] = useState({});
  const [specialisations, setSpecialisations] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [entryRequirements, setEntryRequirements] = useState([]);
  const [summary, setSummary] = useState("");
  const [nextSteps, setNextSteps] = useState([]);
  const [resources, setResources] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobOpp, setJobOpp] = useState([]);
  const location = useLocation();
  const { rec } = location.state || {};

  const recommendation = useMemo(() => {
    if (!rec) return null;
    if (userType === "high_school") {
      return {
        title: rec.degree_name,
        subtitle: rec.university_name,
        badges: [
          { color: "info", label: `ATAR: ${rec.atar_requirement}` },
          { color: "success", label: `Score: ${rec.suitability_score}` },
          { color: "purple", label: `Est. ${rec.est_completion_years} yrs` },
        ],
      };
    }
    return {
      title: rec.career_title,
      subtitle: rec.industry || rec.job_opportunity,
      badges: [
        { color: "info", label: rec.education_required },
        { color: "success", label: `Salary: ${rec.avg_salary_range}` },
      ],
    };
  }, [rec, userType]);

  useEffect(() => {
    let isMounted = true;

    const applyData = (data) => {
      setExplanation(data?.explanation || "");
      setSummary(data?.summary || "");
      setNextSteps(Array.isArray(data?.next_steps) ? data.next_steps : []);
      setResources(Array.isArray(data?.resources) ? data.resources : []);
      setSpecialisations(Array.isArray(data?.specialisations) ? data.specialisations : []);
      setCareerPaths(Array.isArray(data?.career_pathways) ? data.career_pathways : []);
      setEntryRequirements(Array.isArray(data?.entry_requirements) ? data.entry_requirements : []);
      setCompanies(Array.isArray(data?.companies) ? data.companies : []);
      const opp = Array.isArray(data?.job_opportunity)
        ? data.job_opportunity
        : data?.job_opportunity ? [data.job_opportunity] : [];
      setJobOpp(opp);
      setScoreBreakdown(typeof data?.score_breakdown === "object" && data?.score_breakdown ? data.score_breakdown : {});
    };

    const queryDetails = async () => {
      const table = userType?.toLowerCase()?.includes("high_school")
        ? "degree_rec_details"
        : "career_rec_details";
      const { data, error: dbErr } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();           // returns null (not an error) when no row exists yet
      if (dbErr) throw dbErr;
      return data;
    };

    const fetchDetails = async () => {
      if (!id || !userType) return;
      setLoading(true);
      setError(null);
      try {
        const data = await queryDetails();
        if (!isMounted) return;

        if (data) {
          applyData(data);
          setLoading(false);
        } else {
          // Details not ready — trigger backend retry then poll
          setLoading(false);
          setPreparing(true);
          // Fire-and-forget retry in case the background task previously crashed
          fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recommendation/${id}/explain`,
            { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}` } }
          ).catch(() => {}); // ignore — polling will pick up the result
          startedAtRef.current = Date.now();
          pollRef.current = setInterval(async () => {
            if (!isMounted) return;
            if (Date.now() - startedAtRef.current > 180_000) {
              clearInterval(pollRef.current);
              if (isMounted) { setPreparing(false); setStuck(true); }
              return;
            }
            try {
              const polled = await queryDetails();
              if (polled && isMounted) {
                clearInterval(pollRef.current);
                applyData(polled);
                setPreparing(false);
                setStuck(false);
              }
            } catch { /* keep polling */ }
          }, 6000);
        }
      } catch (e) {
        if (isMounted) { setError(e); setLoading(false); }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, userType]);

  const triggerRegenerate = async () => {
    if (!session?.access_token || regenerating) return;
    setRegenerating(true);
    setStuck(false);
    setPreparing(true);
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recommendation/${id}/explain`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }
      );
    } catch { /* ignore */ }
    setRegenerating(false);
    // restart polling
    if (pollRef.current) clearInterval(pollRef.current);
    startedAtRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAtRef.current > 180_000) {
        clearInterval(pollRef.current);
        setPreparing(false);
        setStuck(true);
        return;
      }
      try {
        const table = userType?.toLowerCase()?.includes("high_school") ? "degree_rec_details" : "career_rec_details";
        const { data } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
        if (data) {
          clearInterval(pollRef.current);
          setExplanation(data?.explanation || "");
          setSummary(data?.summary || "");
          setNextSteps(Array.isArray(data?.next_steps) ? data.next_steps : []);
          setResources(Array.isArray(data?.resources) ? data.resources : []);
          setSpecialisations(Array.isArray(data?.specialisations) ? data.specialisations : []);
          setCareerPaths(Array.isArray(data?.career_pathways) ? data.career_pathways : []);
          setEntryRequirements(Array.isArray(data?.entry_requirements) ? data.entry_requirements : []);
          setCompanies(Array.isArray(data?.companies) ? data.companies : []);
          const opp = Array.isArray(data?.job_opportunity) ? data.job_opportunity : data?.job_opportunity ? [data.job_opportunity] : [];
          setJobOpp(opp);
          setScoreBreakdown(typeof data?.score_breakdown === "object" && data?.score_breakdown ? data.score_breakdown : {});
          setPreparing(false);
          setStuck(false);
        }
      } catch { /* keep polling */ }
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <main className="max-w-6xl mx-auto px-6 pt-6 pb-16">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 shadow-sm transition-all"
        >
          <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error.message}
          </div>
        )}

        {/* Preparing / stuck states */}
        {!loading && (preparing || stuck) && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center mb-6">
            <div className="flex justify-center mb-5">
              <div className={`p-4 rounded-full ${stuck ? "bg-amber-50 dark:bg-amber-900/20" : "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"}`}>
                <TbRobot className={`w-10 h-10 ${stuck ? "text-amber-500" : "text-blue-600 dark:text-blue-400"}`} />
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              {stuck ? "Analysis couldn't be generated" : "Eunice is preparing your detailed analysis"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {stuck
                ? "Something went wrong generating the analysis. Click below to try again."
                : "This usually takes under a minute — we'll load it automatically."}
            </p>
            {preparing && !stuck && (
              <>
                <div className="max-w-xs mx-auto h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-5">
                  <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-[slide_1.6s_ease-in-out_infinite]" />
                </div>
                <style>{`@keyframes slide { 0% { transform: translateX(-200%); } 100% { transform: translateX(400%); } }`}</style>
                <button
                  onClick={triggerRegenerate}
                  disabled={regenerating}
                  className="text-xs text-slate-400 dark:text-slate-500 underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-40 transition-colors"
                >
                  {regenerating ? "Restarting…" : "Taking too long? Click to restart"}
                </button>
              </>
            )}
            {stuck && (
              <button
                onClick={triggerRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {regenerating ? "Regenerating…" : "Regenerate Analysis"}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <Skeleton />
        ) : (preparing || stuck) ? null : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

            {/* Hero: title + badges + scores + insights */}
            <HeroCard
              recommendation={recommendation}
              summary={summary}
              scores={scoreBreakdown}
              userType={userType}
              explanation={explanation}
            />

            {/* Next Steps + Roadmap CTA */}
            <div className="border-t border-slate-100 dark:border-slate-800">
              {nextSteps.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
                  <div className="lg:col-span-2">
                    <NextStepsSection steps={nextSteps} />
                  </div>
                  <div className="lg:col-span-1">
                    <RoadmapCTASection
                      userType={userType}
                      onRoadmap={() => navigate("/roadmap-entryload")}
                    />
                  </div>
                </div>
              ) : (
                <RoadmapCTASection
                  userType={userType}
                  onRoadmap={() => navigate("/roadmap-entryload")}
                />
              )}
            </div>

            {/* Info tabs */}
            <div className="border-t border-slate-100 dark:border-slate-800">
              <InfoTabsCard
                userType={userType}
                specialisations={specialisations}
                careerPaths={careerPaths}
                entryRequirements={entryRequirements}
                companies={companies}
                jobOpp={jobOpp}
                resources={resources}
              />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default RecommendationPage;

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { MenuBar } from "../components/MenuBar";
import { DashboardNavBar } from "../components/DashboardNavBar";
import {
  Badge,
  Button,
  ListGroup,
  ListGroupItem,
  Tooltip,
} from "flowbite-react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import { HiExternalLink, HiMap, HiCheckCircle } from "react-icons/hi";

// -------------------- Shared Aura wrapper --------------------
function AuraCard({ children, className = "" }) {
  return (
    <div className={`card-glass-spotlight ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_240px_at_92%_-12%,rgba(56,189,248,0.18),transparent),radial-gradient(560px_240px_at_0%_-10%,rgba(99,102,241,0.16),transparent)]" />
      <div className="relative p-6 md:p-7">{children}</div>
    </div>
  );
}

// -------------------- UI Subcomponents --------------------
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8">
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {message}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <AuraCard>
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-5/6 bg-slate-200 rounded" />
      </div>
    </AuraCard>
  );
}

function HeaderCard({ title, subtitle, badges = [], summary }) {
  return (
    <AuraCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
            Recommendation
          </div>
          <h1 className="mt-3 text-3xl lg:text-5xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 py-1">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-lg">{subtitle}</p>}
        </div>
      </div>

      {Array.isArray(badges) && badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <Badge key={i} color={b.color} size="sm" className="px-2.5 py-1">
              {b.label}
            </Badge>
          ))}
        </div>
      )}

      {summary && <p className="mt-4">{summary}</p>}
    </AuraCard>
  );
}

function InsightsCard({ explanation }) {
  if (!explanation) return null;
  const chunks = explanation
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <AuraCard>
      <h3 className="text-xl font-semibold ">Our Insights</h3>
      <div className="mt-3 space-y-3">
        {chunks.map((chunk, i) => (
          <div
            key={i}
            className="rounded-xl px-4 py-3"
          >
            <p className="">{chunk}</p>
          </div>
        ))}
      </div>
    </AuraCard>
  );
}

function ScoreCard({ scores = {}, userType }) {
  const items = (userType === "university"
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
  ).filter(i => scores?.[i.key] !== undefined && scores?.[i.key] !== null);

  if (items.length === 0) return null;

  const toPercent = (value) => {
    if (value == null) return 0;
    if (typeof value === "number") return Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
    if (typeof value === "string") {
      const match = value.match(/(\d+(?:\.\d+)?)\s*%?/);
      if (match) return Math.max(0, Math.min(100, parseFloat(match[1])));
    }
    return 0;
  };

  return (
    <AuraCard>
      <h3 className="text-xl font-semibold">Score Breakdown</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">Why this recommendation fits you</p>

      <div className="mt-4 space-y-4">
        {items.map(({ key, label }) => {
          const val = toPercent(scores[key]);
          return (
            <div key={key}>
              <div className="flex items-center justify-between">
                <span >{label}</span>
                <span className="text-sm">{val}%</span>
              </div>
              <Tooltip content={`${label}: ${val}%`} placement="bottom">
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </AuraCard>
  );
}

function NextStepsTimeline({ steps = [] }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <AuraCard>
      <h3 className="text-xl font-semibold">Next Steps</h3>
      <ol className="mt-4 relative border-s border-slate-200 pl-6">
        {steps.map((s, i) => (
          <li key={i} className="mb-6 relative">
            <span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-500 ring-white">
              <HiCheckCircle className="h-3.5 w-3.5 text-white" />
            </span>
            <div className="flex items-center justify-between">
              <h4 className="font-medium  ml-4">Step {i + 1}</h4>
            </div>
            <p className="mt-1">{s}</p>
          </li>
        ))}
      </ol>
    </AuraCard>
  );
}

function RoadmapCard({ userType, onClick }) {
  const isHS = userType === "high_school";
  const blurb = isHS
    ? "Turn this into an ATAR-ready plan with subjects, milestones, and deadlines."
    : "Turn this into a semester roadmap with electives, projects, and internships.";
  const buttonText = "Start generating your roadmap now!";

  const chips = isHS
    ? ["Subject plan", "Milestones", "Deadlines", "ATAR focus"]
    : ["Skills plan", "Projects", "Internships", "Milestones"];

  return (
    <AuraCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold ">Roadmap</h3>
          <p className="mt-1 text-slate-600 dark:text-slate-300 text-sm">{blurb}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button
          pill
          onClick={onClick}
          className="hover:opacity-95 border-0 w-full md:w-auto"
        >
          <span className="inline-flex items-center">
            <HiMap className="mr-2 h-5 w-5" />
            {buttonText}
          </span>
        </Button>
      </div>
    </AuraCard>
  );
}

function ChipGrid({ title, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <AuraCard>
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((t, i) => (
          <span
            key={i}
            className="text-sm px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
          >
            {t}
          </span>
        ))}
      </div>
    </AuraCard>
  );
}

function SimpleListCard({ title, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <AuraCard>
      <h3 className="text-xl font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-2 h-2 w-2 rounded-full" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </AuraCard>
  );
}

function ResourcesCard({ resources = [] }) {
  if (!Array.isArray(resources) || resources.length === 0) return null;

  const getDisplayText = (url) => {
    try {
      const { hostname, pathname } = new URL(url);
      if (pathname && pathname !== "/") {
        const firstSegment = pathname.split("/").filter(Boolean)[0];
        return firstSegment ? `${hostname} / ${firstSegment}` : hostname;
      }
      return hostname;
    } catch {
      return url;
    }
  };

  return (
    <AuraCard>
      <h3 className="text-xl font-semibold ">Resources</h3>
      <div className="mt-2">
        <ListGroup>
          {resources.map((r, i) => (
            <ListGroupItem
              key={i}
              className="flex items-center justify-between"
            >
              <a
                href={r}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 dark:text-cyan-500 hover:underline"
              >
                <HiExternalLink className="shrink-0" />
                <span>{getDisplayText(r)}</span>
              </a>
            </ListGroupItem>
          ))}
        </ListGroup>
      </div>
    </AuraCard>
  );
}

// -------------------- Page Component --------------------
function RecommendationPage() {
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const { id } = useParams();
  const { session } = UserAuth();
  const navigate = useNavigate();
  const userType = session?.user?.user_metadata?.student_type;

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const fetchDetails = async () => {
      if (!id || !userType) return;
      setLoading(true);
      setError(null);

      try {
        const table = userType?.toLowerCase()?.includes("high_school")
          ? "degree_rec_details"
          : "career_rec_details";

        const { data, error: dbErr } = await supabase
          .from(table)
          .select("*")
          .eq("id", id)
          .single();

        if (dbErr) throw dbErr;
        if (!isMounted) return;

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
          : data?.job_opportunity
          ? [data.job_opportunity]
          : [];
        setJobOpp(opp);

        const sb = typeof data?.score_breakdown === "object" && data?.score_breakdown ? data.score_breakdown : {};
        setScoreBreakdown(sb);
      } catch (e) {
        console.error("Fetch error:", e);
        if (isMounted) setError(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [id, userType]);

  const fallbackTitle =
    userType === "high_school" ? "Degree Recommendation" : "Career Recommendation";

  return (
    <div className="min-h-screen">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <Button
          onClick={() => navigate(-1)}
          pill
          color='alternative'
          className="mt-6 mb-2"
        >
          <IoChevronBackCircleSharp className="text-2xl mr-2" /> Back
        </Button>
      </div>

      <ErrorBanner message={error?.message} />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <section className="lg:col-span-7 space-y-6">
          {loading ? (
            <>
              <LoadingSkeleton />
              <LoadingSkeleton />
            </>
          ) : (
            <>
              <HeaderCard
                title={recommendation?.title || fallbackTitle}
                subtitle={recommendation?.subtitle || ""}
                badges={recommendation?.badges || []}
                summary={summary}
              />
              <InsightsCard explanation={explanation} />
              <NextStepsTimeline steps={nextSteps} />
            </>
          )}
        </section>

        {/* RIGHT COLUMN (sticky sidebar) */}
        <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-20 self-start">
          {loading ? (
            <>
              <LoadingSkeleton />
              <LoadingSkeleton />
            </>
          ) : (
            <>
              {/* Pass userType so the correct score labels render */}
              <ScoreCard scores={scoreBreakdown} userType={userType} />

              <RoadmapCard userType={userType} onClick={() => navigate('/roadmap-entryload')} />

              {userType === "high_school" ? (
                <ChipGrid title="Specialisations" items={specialisations} />
              ) : (
                <ChipGrid title="Top Companies" items={companies} />
              )}

              {userType === "high_school" ? (
                <SimpleListCard title="Career Pathways" items={careerPaths} />
              ) : (
                <SimpleListCard title="Job Opportunities" items={jobOpp} />
              )}

              {userType === "high_school" && entryRequirements?.length > 0 && (
                <SimpleListCard title="Entry Requirements" items={entryRequirements} />
              )}

              <ResourcesCard resources={resources} />
            </>
          )}
        </aside>
      </main>
    </div>
  );
}

export default RecommendationPage;

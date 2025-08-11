import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { MenuBar } from "../components/MenuBar";
import { DashboardNavBar } from "../components/DashboardNavBar";
import {
  Badge,
  Button,
  Card,
  ListGroup,
  ListGroupItem,
  Tooltip,
} from "flowbite-react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import { HiExternalLink, HiMap, HiCheckCircle,HiArrowRight } from "react-icons/hi";

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
    <Card className="border border-slate-200/60">
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-5/6 bg-slate-200 rounded" />
      </div>
    </Card>
  );
}

function HeaderCard({ title, subtitle, badges = [], summary }) {
  return (
    <Card className="border border-slate-200/60 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-lg text-slate-600">{subtitle}</p>}
        </div>
      
      </div>
      

      {Array.isArray(badges) && badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <Badge key={i} color={b.color} size="sm" className="px-2.5 py-1">
              {b.label}
            </Badge>
          ))}
        
        </div>
      )}
      {summary && <p className="mt-4 text-slate-700 leading-relaxed">{summary}</p>}
      
    </Card>
  );
}

function InsightsCard({ explanation }) {
  if (!explanation) return null;
  const chunks = explanation
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <Card className="border-slate-200/60">
      <h3 className="text-xl font-semibold text-slate-800">Our Insights</h3>
      <div className="mt-3 space-y-3">
        {chunks.map((chunk, i) => (
          <div
            key={i}
            className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3"
          >
            <p className="text-slate-700">{chunk}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ScoreCard({ scores = {}, userType }) {
  // choose which keys to show based on userType
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

  // helper: accept 0–1 or 0–100 and clamp
  const toPercent = (value) => {
    if (value == null) return 0;

    // If it's already a number, clamp to 0–100
    if (typeof value === "number") {
      return Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
    }

    // If it's a string, extract the first number before '%'
    if (typeof value === "string") {
      const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        return Math.max(0, Math.min(100, parseFloat(match[1])));
      }
    }

    return 0;
  };


  return (
    <Card>
      <h3 className="text-xl font-semibold text-slate-800">Score Breakdown</h3>
      <p className="text-sm text-slate-500">Why this recommendation fits you</p>

      <div className="mt-2 space-y-2">
        {items.map(({ key, label }) => {
          const val = toPercent(scores[key]);
          return (
            <div key={key}>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">{label}</span>
                <span className="text-slate-500 text-sm">{val}%</span>
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
    </Card>
  );
}


function NextStepsTimeline({ steps = [] }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <Card>
      <h3 className="text-xl font-semibold text-slate-800">Next Steps</h3>

      <ol className="mt-4 relative border-s border-slate-200 pl-6">
        {steps.map((s, i) => (
          <li key={i} className="mb-6 relative">
            {/* Marker */}
            <span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-500 ring-white">
              <HiCheckCircle className="h-3.5 w-3.5 text-white" />
            </span>

            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-800 ml-4">Step {i + 1}</h4>
            </div>
            <p className="mt-1 text-slate-700">{s}</p>
          </li>
        ))}
      </ol>
      
    </Card>
  );
}

function RoadmapCard({ userType, onClick }) {
  const isHS = userType === "high_school";

  const blurb = "Turn this recommendation into a semester roadmap with electives, projects, and internships."

  // Button copy per your request: “Want to start planning? Create … !”
  const buttonText = "Start generating your road map now!"

  const chips = isHS
    ? ["Subject plan", "Milestones", "Deadlines", "ATAR focus"]
    : ["Skills plan", "Projects", "Internships", "Milestones"];

  return (
    <Card className="border border-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">Roadmap</h3>
          <p className="mt-1 text-slate-600 text-sm">{blurb}</p>

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

      <div className="mt-3">
        <Button
          pill
          onClick={onClick} // e.g., () => navigate('/roadmap')
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-95 border-0 w-full md:w-auto text-left whitespace-normal"
        >
          <span className="inline-flex items-center">
            <HiMap className="mr-2 h-5 w-5" />
            {buttonText}
          </span>
        </Button>
      </div>
    </Card>
  );
}

function ChipGrid({ title, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <Card>
      <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
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
    </Card>
  );
}

function SimpleListCard({ title, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <Card>
      <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-700">
            <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ResourcesCard({ resources = [] }) {
  if (!Array.isArray(resources) || resources.length === 0) return null;

  const copy = (url) => navigator.clipboard?.writeText?.(url);

  // Helper to extract a nice label
  const getDisplayText = (url) => {
    try {
      const { hostname, pathname } = new URL(url);
      // Show just domain if path is short, else domain + first segment
      if (pathname && pathname !== "/") {
        const firstSegment = pathname.split("/").filter(Boolean)[0];
        return firstSegment
          ? `${hostname} / ${firstSegment}`
          : hostname;
      }
      return hostname;
    } catch {
      return url; // fallback to full url if invalid
    }
  };

  return (
    <Card>
      <h3 className="text-xl font-semibold text-slate-800">Resources</h3>
      <div>
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
                className="flex items-center gap-0.5 text-blue-600 hover:underline"
              >
                <HiExternalLink className="shrink-0" />
                <span>{getDisplayText(r)}</span>
              </a>
            </ListGroupItem>
          ))}
        </ListGroup>
      </div>
    </Card>
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

        // Safely set all fields
        setExplanation(data?.explanation || "");
        setSummary(data?.summary || "");
        setNextSteps(Array.isArray(data?.next_steps) ? data.next_steps : []);
        setResources(Array.isArray(data?.resources) ? data.resources : []);
        setSpecialisations(
          Array.isArray(data?.specialisations) ? data.specialisations : []
        );
        setCareerPaths(
          Array.isArray(data?.career_pathways) ? data.career_pathways : []
        );
        setEntryRequirements(
          Array.isArray(data?.entry_requirements) ? data.entry_requirements : []
        );
        setCompanies(Array.isArray(data?.companies) ? data.companies : []);
        const opp = Array.isArray(data?.job_opportunity)
          ? data.job_opportunity
          : data?.job_opportunity
          ? [data.job_opportunity]
          : [];
        setJobOpp(opp);

        const sb =
          typeof data?.score_breakdown === "object" && data?.score_breakdown
            ? data.score_breakdown
            : {};
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

  // Fallback title/subtitle if user refreshed and location.state is gone
  const fallbackTitle =
    userType === "high_school" ? "Degree Recommendation" : "Career Recommendation";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mt-4"
        >
          <IoChevronBackCircleSharp className="text-2xl" /> Back
        </button>
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
            <ScoreCard scores={scoreBreakdown} />
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

              {/* Optional: show entry requirements for HS */}
              {userType === "high_school" && entryRequirements?.length > 0 && (
                <SimpleListCard
                  title="Entry Requirements"
                  items={entryRequirements}
                />
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

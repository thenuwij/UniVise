import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ExternalLink, TrendingUp, CheckCircle2 } from "lucide-react";
import SaveButton from "@/shared/ui/SaveButton";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { SourceLink } from "@/features/roadmap/components/SourceTags";
import CareerResources from "./CareerResources";
import { SubLabel } from "./CareersSection";
import { chipClass } from "../utils/careersStyles";

const TECH = /\b(software|developer|data|cyber|security|cloud|devops|machine learning|ai\b|it\b|programmer|web|systems|math|statistic|actuar|quantitative|modell?er)/i;
const SCIENCE = /\b(scien|research|laborator|biolog|chemi|physic|environment|sustainab|climate|ecolog|conservation|renewable|energy)/i;
const ENGINEERING = /\b(engineer|manufactur|mechatronic|aerospace|aviation|pilot)/i;
const ARTS = /\b(media|journalis|writer|content|communicat|artist|creative|editor|design|curator|music)/i;

const INTEREST_PATTERNS = {
  "Business & Finance": /\b(business|financ|account|audit|bank|invest|consult|marketing|commerce|econom|analyst)/i,
  "Tech, Data & Maths": TECH,
  "Tech & Software": TECH,
  "Science & Environment": SCIENCE,
  "Science & Research": SCIENCE,
  "Engineering": ENGINEERING,
  "Engineering & Design": /\b(engineer|design|architect|manufactur)/i,
  "Health, Medicine & Psychology": /\b(health|medic|clinic|nurs|doctor|physio|pharmac|psycholog|counsel)/i,
  "Health & Medicine": /\b(health|medic|clinic|nurs|doctor|physio|pharmac|psycholog)/i,
  "Law & Policy": /\b(law|legal|lawyer|solicitor|policy|complian|paralegal)/i,
  "Arts, Design & Media": ARTS,
  "Arts & Media": ARTS,
  "Architecture & Built Environment": /\b(architect|urban|planner|construct|property|landscape|interior|surveyor)/i,
  "Humanities & Social Sciences": /\b(histor|languag|translat|interpret|politic|diplomat|international|criminolog|philosoph|heritage|archiv|social|community|behaviou?r)/i,
  "Education & Teaching": /\b(teach|educat|tutor|lectur|trainer|curricul)/i,
};

const LEVELS = [
  { id: "entry", label: "Entry level", key: "entry_level" },
  { id: "mid", label: "Mid-career", key: "mid_career" },
  { id: "senior", label: "Senior", key: "senior" },
];

const matchesInterests = (title, interestAreas) =>
  interestAreas.some((area) => INTEREST_PATTERNS[area]?.test(title || ""));

const seekSearchUrl = (title) =>
  `https://www.seek.com.au/${(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-jobs/in-All-Sydney-NSW`;

const cleanSalary = (s) => s.replace(" AUD based on current listings", "").replace(" based on current listings", "");

const specialisationPath = (spec) => `/specialisation/${spec.type === "Honours" ? "honours" : "major"}/${spec.id}`;

const linkChip = "inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium text-link bg-surface border border-line hover:border-blue-300 transition-colors";

function useInterestAreas(enabled) {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [interestAreas, setInterestAreas] = useState([]);

  useEffect(() => {
    if (!enabled || !userId) return;
    supabase
      .from("student_uni_data")
      .select("interest_areas")
      .eq("user_id", userId)
      .limit(1)
      .then(({ data }) => setInterestAreas(data?.[0]?.interest_areas || []));
  }, [enabled, userId]);

  return interestAreas;
}

function RoleRow({ role, level, open, onToggle, personal, interestAreas, jobCount, onOpenCourse }) {
  const navigate = useNavigate();
  const matches = personal && matchesInterests(role.title, interestAreas);

  return (
    <li className="py-1">
      <div className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-surface-tint transition-colors">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <ChevronDown className={`mt-1.5 h-4 w-4 flex-shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-ink-strong">{role.title}</span>
            {(matches || role.in_demand_nsw || jobCount > 0) && (
              <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-medium">
                {matches && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Matches your interests
                  </span>
                )}
                {role.in_demand_nsw && (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <TrendingUp className="h-3.5 w-3.5" /> In demand in NSW
                  </span>
                )}
                {jobCount > 0 && <span className="text-link">{jobCount} {jobCount === 1 ? "job" : "jobs"} hiring now</span>}
              </span>
            )}
          </span>
        </button>
        {role.salary_range && (
          <span className="hidden sm:block flex-shrink-0 text-right">
            <span className="block text-[15px] font-semibold text-ink-strong">{cleanSalary(role.salary_range)}</span>
            <span className="block text-[13px] text-ink-muted">
              {role.salary_source?.url ? <SourceLink href={role.salary_source.url}>{role.salary_source.name}</SourceLink> : "AI-suggested"}
            </span>
          </span>
        )}
        <SaveButton itemType="career_path" itemId={`${role.title}-${level}`} itemName={role.title} itemData={{ ...role, level }} />
      </div>

      {open && (
        <div className="ml-9 mr-2 mb-4 space-y-4 text-sm leading-relaxed text-ink">
          {role.salary_range && (
            <p className="sm:hidden font-semibold text-ink-strong">{cleanSalary(role.salary_range)}</p>
          )}
          {role.description && <p>{role.description}</p>}
          {personal && (role.degree_path || role.degree_courses?.length > 0 || role.specialisations?.length > 0) && (
            <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-4 dark:border-orange-900/60 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-transparent">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">How your degree gets you there</p>
              {role.degree_path && <p className="mt-1">{role.degree_path}</p>}
              {(role.degree_courses?.length > 0 || role.specialisations?.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(role.degree_courses || []).map((code) => (
                    <button key={code} type="button" onClick={() => onOpenCourse(code)} className={linkChip}>{code}</button>
                  ))}
                  {(role.specialisations || []).map((spec) => (
                    <button key={spec.id} type="button" onClick={() => navigate(specialisationPath(spec))} className={linkChip}>{spec.name}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          {(role.next_steps?.length > 0 || role.requirements) && (
            <div className="grid md:grid-cols-2 gap-4">
              {role.next_steps?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-ink-strong">Next steps</p>
                  <ol className="mt-1 list-decimal pl-5 space-y-1">
                    {role.next_steps.slice(0, 3).map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </div>
              )}
              {role.requirements && (
                <div>
                  <p className="text-sm font-semibold text-ink-strong">Requirements</p>
                  <ul className="mt-1 list-disc pl-5 space-y-1">
                    {role.requirements.split(";").map((req) => req.trim()).filter(Boolean).map((req) => <li key={req}>{req}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          <a href={seekSearchUrl(role.title)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline">
            See current ads on SEEK <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </li>
  );
}

export default function CareerPathsSection({ careerPathways, personal, jobs }) {
  const navigate = useNavigate();
  const interestAreas = useInterestAreas(personal);
  const [level, setLevel] = useState("entry");
  const [openRoles, setOpenRoles] = useState(() => new Set());

  const levels = LEVELS.filter((l) => careerPathways?.[l.key]?.roles?.length);
  const roles = careerPathways?.[LEVELS.find((l) => l.id === level)?.key]?.roles || [];

  const toggleRole = (key) => setOpenRoles((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  const openCourse = async (code) => {
    const { data: match } = await supabase.from("unsw_courses").select("id").eq("code", code).maybeSingle();
    if (match?.id) navigate(`/course/${match.id}`);
  };

  const jobCount = (role) => (level === "entry" && role.ad_search ? (jobs || []).filter((ad) => ad.role === role.ad_search).length : 0);

  return (
    <div className="space-y-12">
      {levels.length > 0 && (
        <div>
          <SubLabel
            hint="Open a role for pay, next steps and how your degree gets you there"
            action={
              <div className="flex gap-1.5" role="group" aria-label="Career stage">
                {levels.map((l) => (
                  <button key={l.id} type="button" aria-pressed={level === l.id} onClick={() => setLevel(l.id)} className={chipClass(level === l.id)}>
                    {l.label}
                  </button>
                ))}
              </div>
            }
          >
            Roles by career stage
          </SubLabel>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {roles.map((role) => (
              <RoleRow
                key={`${level}-${role.title}`}
                role={role}
                level={level}
                open={openRoles.has(`${level}-${role.title}`) !== !personal}
                onToggle={() => toggleRole(`${level}-${role.title}`)}
                personal={personal}
                interestAreas={interestAreas}
                jobCount={jobCount(role)}
                onOpenCourse={openCourse}
              />
            ))}
          </ul>
        </div>
      )}

      <CareerResources />
    </div>
  );
}

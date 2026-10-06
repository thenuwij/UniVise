import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SaveButton from "@/shared/ui/SaveButton";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { motion } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Zap,
  Crown,
  GraduationCap,
  ListChecks,
  TrendingUp
} from "lucide-react";
import SectionHeading from "@/shared/ui/SectionHeading";
import { card } from "@/shared/ui/cardStyles";

const INTEREST_PATTERNS = {
  "Business & Finance": /\b(business|financ|account|audit|bank|invest|consult|marketing|commerce|econom|analyst)/i,
  "Tech & Software": /\b(software|developer|data|cyber|security|cloud|devops|machine learning|ai\b|it\b|programmer|web|systems)/i,
  "Science & Research": /\b(scien|research|laborator|biolog|chemi|physic|environment)/i,
  "Engineering & Design": /\b(engineer|design|architect|manufactur)/i,
  "Health & Medicine": /\b(health|medic|clinic|nurs|doctor|physio|pharmac|psycholog)/i,
  "Law & Policy": /\b(law|legal|lawyer|solicitor|policy|complian|paralegal)/i,
  "Arts & Media": /\b(media|journalis|writer|content|communicat|artist|creative|editor)/i,
};

const matchesInterests = (title, interestAreas) =>
  interestAreas.some((area) => INTEREST_PATTERNS[area]?.test(title || ""));

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

const seekSearchUrl = (title) =>
  `https://www.seek.com.au/${(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-jobs/in-All-Sydney-NSW`;

const cleanSalary = (s) => s.replace(" AUD based on current listings", "").replace(" based on current listings", "");

const earningsMonth = (period) => period?.match(/Earnings ([A-Za-z]+ \d{4})/)?.[1];

const specialisationPath = (spec) => `/specialisation/${spec.type === "Honours" ? "honours" : "major"}/${spec.id}`;

function SourceLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 hover:underline">
      {children} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function AiSuggestedTag() {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 ring-1 ring-slate-200 dark:ring-slate-600">
      AI-suggested
    </span>
  );
}

function GraduateOutlook({ outlook }) {
  const source = outlook[0];
  return (
    <section>
      <SectionHeading subtitle={<>All Australian graduates in each study area. Source: <SourceLink href={source.source_url}>QILT Graduate Outcomes Survey {source.survey_year}</SourceLink></>}>
        Graduate outlook
      </SectionHeading>
      <div className="mt-6 space-y-5">
        {outlook.map((area) => (
          <div key={area.study_area}>
            {outlook.length > 1 && <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{area.study_area}</p>}
            <div className={`${outlook.length > 1 ? "mt-3 " : ""}grid sm:grid-cols-2 gap-4`}>
              {[
                [CheckCircle2, "In full-time work after graduating", area.full_time_employment_rate != null ? `${area.full_time_employment_rate}%` : null],
                [DollarSign, "Median starting salary", area.median_salary != null ? `$${area.median_salary.toLocaleString()}` : null],
              ].filter(([, , value]) => value).map(([Icon, label, value]) => (
                <div key={label} className={`${card} p-6`}>
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" /> {label}
                  </p>
                  <p className="mt-2 text-[34px] leading-none font-heading font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoleDescription({ text }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <>
      <p ref={ref} className={`mt-4 text-lg text-slate-700 dark:text-slate-300 leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
        {text}
      </p>
      {(clamped || expanded) && (
        <button onClick={() => setExpanded(!expanded)} className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </>
  );
}

export default function CareerPathways({ careerPathways, personal = false }) {
  const navigate = useNavigate();
  const interestAreas = useInterestAreas(personal);
  const [activeTab, setActiveTab] = useState('entry');
  const [showAllCerts, setShowAllCerts] = useState(false);

  const entryLevel = careerPathways?.entry_level;
  const midCareer = careerPathways?.mid_career;
  const senior = careerPathways?.senior;
  const certifications = careerPathways?.certifications || [];
  const outlook = careerPathways?.outlook || [];

  if (!entryLevel && !midCareer && !senior) return null;

  const tabs = [
    { id: 'entry', label: 'Entry level', data: entryLevel, icon: Sparkles },
    { id: 'mid', label: 'Mid-Career', data: midCareer, icon: Zap },
    { id: 'senior', label: 'Senior leadership', data: senior, icon: Crown },
  ];

  const activeData = tabs.find(t => t.id === activeTab)?.data;
  const displayedCerts = showAllCerts ? certifications : certifications.slice(0, 3);

  const openCourse = async (code) => {
    const { data: match } = await supabase
      .from("unsw_courses")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (match?.id) navigate(`/course/${match.id}`);
  };

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800 [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      {outlook.length > 0 && <GraduateOutlook outlook={outlook} />}

      <section>
        <SectionHeading
          action={
<div className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 ring-1 ring-slate-200/70 dark:ring-slate-700/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold whitespace-nowrap transition-colors ${
                    isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <motion.span layoutId="career-level-tab" className="absolute inset-0 rounded-xl bg-white dark:bg-slate-700 shadow-md" transition={{ type: "spring", stiffness: 450, damping: 38 }} />
                  )}
                  <Icon className={`relative h-4 w-4 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
          }
        >
          Career pathways
        </SectionHeading>

        {activeData?.roles?.length > 0 && (
          <div className="mt-6 space-y-6">
            {activeData.roles.map((role, idx) => (
              <article key={idx} className={`${card} p-6 md:p-8`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h5 className="text-[22px] font-bold text-slate-900 dark:text-white">{role.title}</h5>
                    {((personal && matchesInterests(role.title, interestAreas)) || role.in_demand_nsw) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {personal && matchesInterests(role.title, interestAreas) && (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800">
                            Matches your interests
                          </span>
                        )}
                        {role.in_demand_nsw && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 ring-1 ring-amber-200 dark:ring-amber-800">
                            <TrendingUp className="h-3.5 w-3.5" /> In demand in NSW
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-3 flex-shrink-0">
                    {role.salary_range && (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/40">
                          <DollarSign className="h-4 w-4" />
                          {cleanSalary(role.salary_range)}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {role.salary_source?.url
                            ? <>Source: <SourceLink href={role.salary_source.url}>{role.salary_source.name}</SourceLink></>
                            : <AiSuggestedTag />}
                        </span>
                      </div>
                    )}
                    <SaveButton itemType="career_path" itemId={`${role.title}-${activeTab}`} itemName={role.title} itemData={{ ...role, level: activeTab }} />
                  </div>
                </div>

                {role.description && <RoleDescription key={`${activeTab}-${idx}`} text={role.description} />}

                {role.typical_pay?.weekly && (
                  <p className="mt-4 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    <Briefcase className="inline h-4 w-4 mr-1.5 -mt-0.5 text-blue-600 dark:text-blue-400" />
                    {role.occupation_title || "This occupation"} earn a typical <span className="font-semibold">${role.typical_pay.weekly.toLocaleString()} a week</span> full-time, across all experience levels.{" "}
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Source: <SourceLink href={role.typical_pay.source_url}>Jobs and Skills Australia{earningsMonth(role.typical_pay.period) ? `, ${earningsMonth(role.typical_pay.period)}` : ""}</SourceLink>
                    </span>
                  </p>
                )}

                {personal && (role.degree_path || role.degree_courses?.length > 0 || role.specialisations?.length > 0) && (
                  <div className="mt-6 p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40">
                    <p className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                      <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      How your degree gets you there
                    </p>
                    {role.degree_path && <p className="mt-2 text-base text-slate-700 dark:text-slate-300 leading-relaxed">{role.degree_path}</p>}
                    {role.degree_courses?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {role.degree_courses.map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => openCourse(code)}
                            className="group inline-flex items-center gap-1.5 pl-4 pr-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all"
                          >
                            {code}
                            <ChevronRight className="h-4 w-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                    {role.specialisations?.length > 0 && (
                      <>
                        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Specialisations to consider</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {role.specialisations.map((spec) => (
                            <button
                              key={spec.id}
                              type="button"
                              onClick={() => navigate(specialisationPath(spec))}
                              className="group inline-flex items-center gap-1.5 pl-4 pr-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all"
                            >
                              {spec.name}
                              <ChevronRight className="h-4 w-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(role.next_steps?.length > 0 || role.requirements) && (
                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    {role.next_steps?.length > 0 && (
                      <div>
                        <p className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                          <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Next steps
                        </p>
                        <ol className="mt-2 space-y-1.5">
                          {role.next_steps.slice(0, 3).map((step, sIdx) => (
                            <li key={sIdx} className="flex gap-2 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{sIdx + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {role.requirements && (
                      <div>
                        <p className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Requirements
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {role.requirements.split(";").map((req, rIdx) => req.trim() && (
                            <li key={rIdx} className="flex gap-2 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                              <span className="text-emerald-500">•</span>
                              <span>{req.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                  <a
                    href={seekSearchUrl(role.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-colors"
                  >
                    See all current ads <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {certifications.length > 0 && (
        <section>
          <SectionHeading>
            Professional certifications
          </SectionHeading>
          <div className={`${card} mt-6 px-6 md:px-8 divide-y divide-slate-100 dark:divide-slate-700`}>
            {displayedCerts.map((cert, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 py-5">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{cert.name}</p>
                  <p className="mt-1 text-base text-slate-600 dark:text-slate-400">{cert.provider} · {cert.timeline}</p>
                  {cert.notes && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{cert.notes}</p>}
                  {cert.url && (
                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline">
                      Learn more <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                {cert.importance && (
                  <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ring-1 ${
                    cert.importance === "Required"
                      ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800"
                      : cert.importance === "Highly Recommended"
                      ? "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800"
                      : "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                  }`}>
                    {cert.importance}
                  </span>
                )}
              </div>
            ))}
          </div>
          {certifications.length > 3 && (
            <button
              onClick={() => setShowAllCerts(!showAllCerts)}
              className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 hover:border-blue-400 dark:hover:bg-blue-900/50 transition-colors"
            >
              {showAllCerts ? (
                <>Show fewer <ChevronUp className="h-5 w-5" /></>
              ) : (
                <>Show {certifications.length - 3} more certifications <ChevronDown className="h-5 w-5" /></>
              )}
            </button>
          )}
        </section>
      )}

    </div>
  );
}

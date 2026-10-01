import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SaveButton from "@/shared/ui/SaveButton";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { motion } from "framer-motion";
import {
  Building2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Target,
  Sparkles,
  Zap,
  Crown,
  GraduationCap,
  ListChecks
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import { card } from "../utils/cardStyles";

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

export default function CareerPathways({ careerPathways, personal = false }) {
  const navigate = useNavigate();
  const interestAreas = useInterestAreas(personal);
  const [activeTab, setActiveTab] = useState('entry');
  const [showAllCerts, setShowAllCerts] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  const entryLevel = careerPathways?.entry_level;
  const midCareer = careerPathways?.mid_career;
  const senior = careerPathways?.senior;
  const certifications = careerPathways?.certifications || [];
  const marketInsights = careerPathways?.market_insights;
  const topEmployers = careerPathways?.top_employers?.by_sector || {};
  const employmentStats = careerPathways?.employment_stats;

  if (!entryLevel && !midCareer && !senior) return null;

  const tabs = [
    { id: 'entry', label: 'Entry level', data: entryLevel, icon: Sparkles },
    { id: 'mid', label: 'Mid-Career', data: midCareer, icon: Zap },
    { id: 'senior', label: 'Senior leadership', data: senior, icon: Crown },
  ];

  const activeData = tabs.find(t => t.id === activeTab)?.data;
  const displayedCerts = showAllCerts ? certifications : certifications.slice(0, 3);

  const toggleDescription = (idx) => {
    setExpandedDescriptions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const openCourse = async (code) => {
    const { data: match } = await supabase
      .from("unsw_courses")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (match?.id) navigate(`/course/${match.id}`);
  };

  const stats = [
    [CheckCircle2, "Employment rate", employmentStats?.employment_rate, "Data not available"],
    [DollarSign, "Starting salary", employmentStats?.median_starting_salary, "Data not available"],
    [Target, "Market demand", marketInsights?.demand_level, "Data unavailable"],
  ].filter(([, , value, missing]) => value && value !== missing);
  const cleanSalary = (s) => s.replace(" AUD based on current listings", "").replace(" based on current listings", "");
  const statSource = employmentStats?.source && employmentStats.source !== "Information temporarily unavailable" ? `Source: ${employmentStats.source}` : null;

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800 [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      {stats.length > 0 && (
        <section>
          <SectionHeading subtitle={statSource}>Graduate outlook</SectionHeading>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {stats.map(([Icon, label, value]) => (
              <div key={label} className={`${card} p-6`}>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" /> {label}
                </p>
                <p className={`mt-2 text-[34px] leading-none font-bold tracking-tight ${label === "Market demand" && /high|growing/i.test(value) ? "text-green-700 dark:text-green-400" : "text-slate-900 dark:text-white"}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

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
                    <h5 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">{role.title}</h5>
                    {personal && matchesInterests(role.title, interestAreas) && (
                      <span className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800">
                        Matches your interests
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {role.salary_range && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/40">
                        <DollarSign className="h-4 w-4" />
                        {cleanSalary(role.salary_range)}
                      </span>
                    )}
                    <SaveButton itemType="career_path" itemId={`${role.title}-${activeTab}`} itemName={role.title} itemData={{ ...role, level: activeTab }} />
                  </div>
                </div>

                {role.description && (
                  <>
                    <p className={`mt-4 text-lg text-slate-700 dark:text-slate-300 leading-relaxed ${!expandedDescriptions[idx] ? "line-clamp-3" : ""}`}>
                      {role.description}
                    </p>
                    {role.description.length > 180 && (
                      <button onClick={() => toggleDescription(idx)} className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        {expandedDescriptions[idx] ? "Show less" : "Read more"}
                      </button>
                    )}
                  </>
                )}

                {personal && (role.degree_path || role.degree_courses?.length > 0) && (
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
                            className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-blue-800 dark:text-blue-200 bg-white dark:bg-slate-800 ring-1 ring-blue-200 dark:ring-blue-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
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

                {role.hiring_companies?.length > 0 && (
                  <div className="mt-6">
                    <p className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                      <Building2 className="h-5 w-5 text-slate-500" /> Companies hiring
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {role.hiring_companies.map((company, cIdx) => (
                        <span key={cIdx} className="px-3.5 py-1.5 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(role.source || role.source_url) && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    {role.source ? <span className="text-sm text-slate-500 dark:text-slate-400">Source: {role.source}</span> : <span />}
                    {role.source_url && (
                      <a
                        href={role.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-colors"
                      >
                        View listings <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
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
              className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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

      {Object.keys(topEmployers).length > 0 && (
        <section>
          <SectionHeading>
            Top employers by sector
          </SectionHeading>
          <div className="mt-6 grid sm:grid-cols-2 gap-5">
            {Object.entries(topEmployers).map(([sector, companies], idx) => (
              <div key={idx} className={`${card} p-6`}>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{sector}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {companies.map((company, cIdx) => (
                    <span key={cIdx} className="px-3.5 py-1.5 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60">
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

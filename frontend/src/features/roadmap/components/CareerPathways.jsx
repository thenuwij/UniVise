import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SaveButton from "@/shared/ui/SaveButton";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import {
  TrendingUp,
  Award,
  Building2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Target,
  BarChart3,
  Sparkles,
  Zap,
  Crown,
  GraduationCap,
  ListChecks
} from "lucide-react";

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
    { id: 'entry', label: 'Entry Level', data: entryLevel, icon: Sparkles },
    { id: 'mid', label: 'Mid-Career', data: midCareer, icon: Zap },
    { id: 'senior', label: 'Senior Leadership', data: senior, icon: Crown },
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

  return (
    <div className="p-6 space-y-8">

      {/* EMPLOYMENT STATISTICS SECTION */}
      {employmentStats && (
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700 shadow-md">
          <div className="flex items-start gap-4 mb-5 pb-4 border-b-2 border-blue-200 dark:border-blue-600">
            <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-600 shadow-md flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Employment Statistics
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Key metrics for graduates from this program
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {employmentStats.employment_rate && employmentStats.employment_rate !== 'Data not available' && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900
                            border border-slate-300 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Employment Rate
                  </p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {employmentStats.employment_rate}
                </p>
              </div>
            )}
            {employmentStats.median_starting_salary && employmentStats.median_starting_salary !== 'Data not available' && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900
                            border border-slate-300 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Starting Salary
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-400">
                  {employmentStats.median_starting_salary}
                </p>
              </div>
            )}
            {marketInsights?.demand_level && marketInsights.demand_level !== 'Data unavailable' && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900
                            border border-slate-300 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Market Demand
                  </p>
                </div>
                <p className={`text-2xl font-bold ${
                  marketInsights.demand_level === 'High' || marketInsights.demand_level === 'Growing'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {marketInsights.demand_level}
                </p>
              </div>
            )}
          </div>

          {employmentStats.source && employmentStats.source !== 'Information temporarily unavailable' && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold">Data Source:</span> {employmentStats.source}
              </p>
            </div>
          )}
        </div>
      )}

      {/* CAREER STAGES SECTION */}
      <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
        <div className="mb-5 pb-5 border-b-2 border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Career Pathways
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Explore roles at different stages of your career
              </p>
            </div>
          </div>
        </div>

        {/* CAREER LEVEL TABS */}
        <div className="mb-6">
          <div className="flex gap-3 flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-md border-2 border-blue-700 dark:border-blue-600'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROLE CARDS */}
        {activeData?.roles && activeData.roles.length > 0 && (
          <div className="space-y-4">
            {activeData.roles.map((role, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600
                          bg-white dark:bg-slate-800 shadow-md"
              >
                {/* Role Header */}
                <div className="mb-4 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h5 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {role.title}
                      </h5>
                      {personal && matchesInterests(role.title, interestAreas) && (
                        <span className="mt-1.5 inline-block px-2.5 py-1 rounded-full text-xs font-semibold
                                       bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300
                                       border border-emerald-200 dark:border-emerald-700">
                          Matches your interests
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <SaveButton
                        itemType="career_path"
                        itemId={`${role.title}-${activeTab}`}
                        itemName={role.title}
                        itemData={{
                          ...role,
                          level: activeTab,
                        }}
                      />

                      {role.salary_range && (
                        <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30
                                      border border-blue-200 dark:border-blue-700 flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                            {role.salary_range.replace(' AUD based on current listings', '').replace(' based on current listings', '')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className={`text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium ${!expandedDescriptions[idx] ? 'line-clamp-3' : ''}`}>
                    {role.description}
                  </p>
                  {role.description && role.description.length > 180 && (
                    <button
                      onClick={() => toggleDescription(idx)}
                      className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {expandedDescriptions[idx] ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                {personal && (role.degree_path || role.degree_courses?.length > 0) && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                          How your degree gets you there
                        </p>
                        {role.degree_path && (
                          <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">{role.degree_path}</p>
                        )}
                        {role.degree_courses?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {role.degree_courses.map((code) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => openCourse(code)}
                                className="px-3 py-1 rounded-lg text-sm font-bold bg-white dark:bg-slate-800
                                          border-2 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300
                                          hover:border-blue-500 transition-colors"
                              >
                                {code}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {role.next_steps?.length > 0 && (
                  <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Next steps</p>
                        <div className="space-y-1">
                          {role.next_steps.slice(0, 3).map((step, sIdx) => (
                            <p key={sIdx} className="text-base text-slate-700 dark:text-slate-300 leading-relaxed flex gap-2">
                              <span className="text-blue-500 flex-shrink-0">{sIdx + 1}.</span>
                              <span>{step}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {role.requirements && (
                  <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                          Requirements
                        </p>
                        <div className="space-y-1">
                          {role.requirements.split(';').map((req, rIdx) => req.trim() && (
                            <p key={rIdx} className="text-base text-slate-700 dark:text-slate-300 leading-relaxed flex gap-2">
                              <span className="text-emerald-500 flex-shrink-0">•</span>
                              <span>{req.trim()}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hiring Companies */}
                {role.hiring_companies && role.hiring_companies.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900
                                border-2 border-slate-200 dark:border-slate-700 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">
                        Companies Hiring
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.hiring_companies.map((company, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-4 py-2 rounded-lg text-sm font-semibold
                                    bg-white dark:bg-slate-800
                                    border-2 border-slate-300 dark:border-slate-600
                                    text-slate-800 dark:text-slate-200
                                    shadow-sm"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Section */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {role.source && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <BarChart3 className="h-4 w-4" />
                      <span className="font-medium">Source: {role.source}</span>
                    </div>
                  )}

                  {role.source_url && (
                    <a
                      href={role.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5
                                bg-blue-600 hover:bg-blue-700
                                dark:bg-blue-600 dark:hover:bg-blue-700
                                text-white text-base font-bold rounded-xl
                                shadow-md hover:shadow-lg hover:scale-105
                                transition-all duration-200"
                    >
                      <span>View Listings</span>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PROFESSIONAL CERTIFICATIONS SECTION */}
      {certifications.length > 0 && (
        <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
          <div className="mb-5 pb-5 border-b-2 border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md flex-shrink-0">
                <Award className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Professional Certifications
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Credentials to enhance your qualifications
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedCerts.map((cert, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-4 py-4 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{cert.name}</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{cert.provider} · {cert.timeline}</p>
                  {cert.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{cert.notes}</p>}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-primary inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
                    >
                      Learn More
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                {cert.importance && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 mt-1 ${
                    cert.importance === 'Required'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : cert.importance === 'Highly Recommended'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
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
              className="mt-5 w-full py-4 text-base font-bold
                       text-white dark:text-white
                       transition-all flex items-center justify-center gap-2
                       rounded-xl bg-blue-600 dark:bg-blue-600
                       hover:bg-blue-700 dark:hover:bg-blue-700
                       border-2 border-blue-700 dark:border-blue-800
                       shadow-md hover:shadow-lg hover:scale-105"
            >
              {showAllCerts ? (
                <>Show Less <ChevronUp className="h-5 w-5" /></>
              ) : (
                <>Show {certifications.length - 3} More Certifications <ChevronDown className="h-5 w-5" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* TOP EMPLOYERS BY SECTOR SECTION */}
      {Object.keys(topEmployers).length > 0 && (
        <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
          <div className="mb-5 pb-5 border-b-2 border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-green-600 dark:bg-green-600 shadow-md flex-shrink-0">
                <Building2 className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Top Employers by Sector
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Leading organizations across different industries
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(topEmployers).map(([sector, companies], idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{sector}</p>
                <div className="flex flex-wrap gap-1.5">
                  {companies.map((company, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-3 py-1 rounded-full text-sm font-medium
                                bg-white dark:bg-slate-800
                                border border-slate-200 dark:border-slate-600
                                text-slate-800 dark:text-slate-200
                                shadow-sm"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

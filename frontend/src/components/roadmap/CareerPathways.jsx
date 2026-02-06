import { useState } from "react";
import SaveButton from "../SaveButton";
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
  Info
} from "lucide-react";

export default function CareerPathways({ careerPathways }) {
  const [activeTab, setActiveTab] = useState('entry');
  const [showAllCerts, setShowAllCerts] = useState(false);
  
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-xl space-y-8">
      
      {/* Top Accent Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl" />
      
      {/* HEADER */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-6 py-4 -mx-6 -mt-6 mb-5 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">
        
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <TrendingUp className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Career Pathways & Outcomes
          </h3>
        </div>
      </div>

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
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Key metrics for graduates from this program
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {employmentStats.employment_rate && employmentStats.employment_rate !== 'Data not available' && (
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900
                            border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Employment Rate
                  </p>
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                  {employmentStats.employment_rate}
                </p>
              </div>
            )}
            {employmentStats.median_starting_salary && employmentStats.median_starting_salary !== 'Data not available' && (
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900
                            border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Starting Salary
                  </p>
                </div>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-400">
                  {employmentStats.median_starting_salary}
                </p>
              </div>
            )}
            {marketInsights?.demand_level && marketInsights.demand_level !== 'Data unavailable' && (
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900
                            border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Market Demand
                  </p>
                </div>
                <p className={`text-4xl font-bold ${
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
          <div className="flex items-start gap-4 mb-3">
            <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-600 shadow-md flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Career Progression
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Explore roles at different stages of your career
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-sm">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
              Select a career stage to view typical roles, salaries, and companies hiring for these positions. Click 'View Listings' to navigate further.
            </p>
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
                  className={`px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-200 flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-md border-2 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.data?.years_experience && (
                    <span className={`text-sm ${isActive ? 'opacity-90' : 'opacity-75'}`}>
                      ({tab.data.years_experience})
                    </span>
                  )}
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
                          bg-white dark:bg-slate-800
                          shadow-md hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500
                          transition-all duration-200"
              >
                {/* Role Header */}
                <div className="mb-4 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h5 className="flex-1 text-xl font-bold text-blue-700 dark:text-blue-400">
                      {role.title}
                    </h5>
                    
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
                        <div className="px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30
                                      border-2 border-blue-300 dark:border-blue-700 shadow-sm">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span>Salary</span>
                          </div>
                          <div className="text-base font-bold text-blue-900 dark:text-blue-400 text-center">
                            {role.salary_range.replace(' AUD based on current listings', '').replace(' based on current listings', '')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                    {role.description}
                  </p>
                </div>

                {/* Requirements */}
                {role.requirements && (
                  <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                          Requirements
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {role.requirements}
                        </p>
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
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
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
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-600 shadow-md flex-shrink-0">
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
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-sm">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                These certifications can strengthen your expertise in this field and open doors to advanced career opportunities.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {displayedCerts.map((cert, idx) => (
              <div 
                key={idx}
                className="p-5 rounded-xl border-2 border-slate-300 dark:border-slate-600
                          bg-white dark:bg-slate-800
                          shadow-md hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500
                          transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h5 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-snug flex-1">
                    {cert.name}
                  </h5>
                  <span className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap shadow-sm ${
                    cert.importance === 'Required' 
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-700'
                      : cert.importance === 'Highly Recommended'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700'
                  }`}>
                    {cert.importance}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300 mb-3">
                  <span className="font-bold">{cert.provider}</span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span>{cert.timeline}</span>
                </div>
                {cert.notes && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 pt-3 border-t-2 border-slate-200 dark:border-slate-700 leading-relaxed">
                    {cert.notes}
                  </p>
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
            <div className="flex items-start gap-4 mb-3">
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
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-sm">
              <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                These companies are actively recruiting graduates from this program across various industry sectors.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {Object.entries(topEmployers).map(([sector, companies], idx) => (
              <div key={idx} className="p-5 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                <p className="text-base font-bold text-green-700 dark:text-green-400 mb-4">
                  {sector}
                </p>
                <div className="flex flex-wrap gap-3">
                  {companies.map((company, cIdx) => (
                    <span 
                      key={cIdx}
                      className="px-5 py-3 rounded-xl text-base font-bold
                                bg-slate-50 dark:bg-slate-900
                                border-2 border-slate-300 dark:border-slate-600
                                text-slate-900 dark:text-slate-100
                                shadow-sm hover:shadow-md hover:border-green-400 dark:hover:border-green-500
                                transition-all duration-200"
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
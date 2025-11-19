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
  Crown
} from "lucide-react";

/**
 * Premium Career Pathways Component
 * 
 * Sophisticated design with:
 * - Elegant color palette (slate, gold, indigo)
 * - Refined typography and spacing
 * - Subtle shadows and borders
 * - Professional, luxury aesthetic
 */

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
      
      {/* ========== HEADER ========== */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-8 py-6 -mx-8 -mt-8 mb-8 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">
        
        {/* Very subtle gradient accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <TrendingUp className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Career Pathways & Outcomes
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Chart your professional journey from graduate to executive roles
            </p>
          </div>
        </div>
      </div>

      {/* ========== EMPLOYMENT STATISTICS ========== */}
      {employmentStats && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {employmentStats.employment_rate && employmentStats.employment_rate !== 'Data not available' && (
            <div className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 
                          dark:from-slate-800/50 dark:to-slate-800/30 
                          border border-slate-200/60 dark:border-slate-700/60 
                          shadow-sm transition-none">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Employment Rate
                </p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {employmentStats.employment_rate}
              </p>
            </div>
          )}
          {employmentStats.median_starting_salary && employmentStats.median_starting_salary !== 'Data not available' && (
            <div className="group p-5 rounded-xl bg-gradient-to-br from-blue-50/50 to-sky-50/30 
                          dark:from-blue-900/10 dark:to-sky-900/10 
                          border border-blue-200/40 dark:border-blue-800/40 
                          shadow-sm transition-none">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Starting Salary
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-400">
                {employmentStats.median_starting_salary}
              </p>
            </div>
          )}
          {employmentStats.source && employmentStats.source !== 'Information temporarily unavailable' && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 
                            dark:from-slate-800/50 dark:to-slate-800/30 
                            border border-slate-200/60 dark:border-slate-700/60 
                            shadow-sm">

              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data Source
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                {employmentStats.source}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========== CAREER LEVEL TABS ========== */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Select Career Stage:
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-400 dark:ring-blue-500'
                    : 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:shadow-md hover:scale-102'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                <span>{tab.label}</span>
                {tab.data?.years_experience && (
                  <span className={`text-xs font-normal ${isActive ? 'opacity-90' : 'opacity-75'}`}>
                    ({tab.data.years_experience})
                  </span>
                )}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 bg-gradient-to-br from-blue-600 to-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== ROLE CARDS ========== */}
      {activeData?.roles && activeData.roles.length > 0 && (
        <div className="space-y-5 mb-8">
          {activeData.roles.map((role, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/60
                        bg-gradient-to-br from-slate-50 via-white to-slate-100/50
                        dark:bg-gradient-to-br dark:from-slate-800/50 dark:via-slate-800/40 dark:to-slate-900/50
                        shadow-sm"
            >
              {/* Role Header */}
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <h4 className="text-xl font-bold mb-2
                              bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 
                              dark:from-blue-400 dark:via-sky-400 dark:to-indigo-400
                              bg-clip-text text-transparent">
                    {role.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {/* ==== SAVE BUTTON (CAREER PATH) ==== */}
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
                  <div className="px-4 py-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 
                                dark:from-blue-900/20 dark:to-indigo-900/20 
                                border border-blue-200/60 dark:border-blue-800/60 shadow-sm">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>Salary</span>
                    </div>
                    <div className="text-base font-bold text-blue-900 dark:text-blue-400 text-center whitespace-nowrap">
                      {role.salary_range}
                    </div>
                  </div>
                )}
              </div>


              {/* Requirements */}
              {role.requirements && (
                <div className="mb-4 p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg border border-slate-200/40 dark:border-slate-700/40">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
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
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100/50 
                              dark:from-slate-800/30 dark:to-slate-800/50 
                              border border-slate-200/60 dark:border-slate-700/60 mb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Companies Hiring
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {role.hiring_companies.map((company, cIdx) => (
                      <span 
                        key={cIdx}
                        className="px-4 py-2 rounded-lg text-sm font-semibold
                                  bg-white dark:bg-slate-900 
                                  border border-slate-200 dark:border-slate-700
                                  text-slate-700 dark:text-slate-300
                                  shadow-sm"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Source */}
              {role.source && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 italic">
                  <BarChart3 className="h-3 w-3" />
                  <span>Source: {role.source}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========== PROFESSIONAL CERTIFICATIONS ========== */}
      {certifications.length > 0 && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Professional Certifications
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              Credentials that enhance your qualifications and career prospects
            </p>
          </div>

          <div className="space-y-3">
            {displayedCerts.map((cert, idx) => (
              <div 
                key={idx}
                className="p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60
                          bg-gradient-to-br from-slate-50 via-white to-slate-100/50
                          dark:bg-gradient-to-br dark:from-slate-800/50 dark:via-slate-800/40 dark:to-slate-900/50
                          shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                    {cert.name}
                  </h5>
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${
                    cert.importance === 'Required' 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : cert.importance === 'Highly Recommended'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {cert.importance}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium">{cert.provider}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{cert.timeline}</span>
                </div>
                {cert.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 leading-relaxed">
                    {cert.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {certifications.length > 3 && (
            <button
              onClick={() => setShowAllCerts(!showAllCerts)}
              className="mt-4 w-full py-3 text-sm font-bold text-slate-700 dark:text-slate-300
                       hover:text-slate-900 dark:hover:text-slate-100
                       transition-all flex items-center justify-center gap-2 
                       rounded-xl bg-slate-100 dark:bg-slate-800
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       border-2 border-slate-300 dark:border-slate-600
                       hover:border-slate-400 dark:hover:border-slate-500
                       shadow-sm hover:shadow-md"
            >
              {showAllCerts ? (
                <>Show Less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show {certifications.length - 3} More <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* ========== MARKET INSIGHTS ========== */}
      {marketInsights && (marketInsights.demand_level || marketInsights.trends || marketInsights.geographic_notes) && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Market Insights
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              Current trends and demand for professionals in this field
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 
                        dark:from-blue-900/10 dark:to-indigo-900/10 
                        border border-blue-200/60 dark:border-blue-700/60 shadow-sm">
            {marketInsights.demand_level && marketInsights.demand_level !== 'Data unavailable' && (
              <div className="mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Market Demand:{" "}
                </span>
                <span className={`text-sm font-bold ${
                  marketInsights.demand_level === 'High' || marketInsights.demand_level === 'Growing'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {marketInsights.demand_level}
                </span>
              </div>
            )}
            
            {marketInsights.trends && marketInsights.trends !== 'Information temporarily unavailable' && (
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                {marketInsights.trends}
              </p>
            )}
            
            {marketInsights.geographic_notes && marketInsights.geographic_notes !== 'Information temporarily unavailable' && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-semibold">Location:</span> {marketInsights.geographic_notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========== TOP EMPLOYERS BY SECTOR ========== */}
      {Object.keys(topEmployers).length > 0 && (
        <div>
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Top Employers by Sector
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              Leading organizations recruiting graduates across different industries
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 
                        dark:from-indigo-900/10 dark:to-purple-900/10 
                        border border-indigo-200/60 dark:border-indigo-700/60 shadow-sm">
            <div className="space-y-5">
              {Object.entries(topEmployers).map(([sector, companies], idx) => (
                <div key={idx}>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-3">
                    {sector}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {companies.map((company, cIdx) => (
                      <span 
                        key={cIdx}
                        className="px-4 py-2 rounded-lg text-sm font-semibold
                                  bg-white dark:bg-slate-900 
                                  border-2 border-slate-200 dark:border-slate-700
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
        </div>
      )}
    </div>
  );
}
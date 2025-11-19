// src/components/roadmap/CareersSection.jsx
import { useState } from "react";
import SaveButton from "../SaveButton";
import {
  TrendingUp,
  Award,
  Building2,
  DollarSign,
  CheckCircle2,
  Target,
  BarChart3,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";

export default function CareersSection({ careerPathways = {}, sources = [] }) {
  const [activeTab, setActiveTab] = useState("entry");
  const [showAllCerts, setShowAllCerts] = useState(false);

  const entry = careerPathways?.entry_level;
  const mid = careerPathways?.mid_career;
  const senior = careerPathways?.senior;

  const certifications = careerPathways?.certifications || [];
  const marketInsights = careerPathways?.market_insights;
  const employmentStats = careerPathways?.employment_stats;

  const displayedCerts = showAllCerts ? certifications : certifications.slice(0, 3);

  const tabs = [
    { id: "entry", label: "Entry Level", icon: Sparkles, data: entry },
    { id: "mid", label: "Mid-Career", icon: Zap, data: mid },
    { id: "senior", label: "Senior", icon: Crown, data: senior },
  ];

  const activeData = tabs.find((t) => t.id === activeTab)?.data;

  const hasAnything =
    entry || mid || senior || certifications.length > 0 || marketInsights || employmentStats;

  if (!hasAnything) {
    return (
      <div className="p-10 text-center text-slate-500 dark:text-slate-400 italic">
        No career information available for this program.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">

      {/* HEADER */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 px-8 py-6 -mx-8 -mt-8 mb-8 border-b-2 rounded-t-2xl border-slate-200 dark:border-slate-700">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <TrendingUp className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Career Pathways & Outcomes
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Explore potential roles at different stages of your future career
            </p>
          </div>
        </div>
      </div>

      {/* EMPLOYMENT STATS */}
      {employmentStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {employmentStats?.employment_rate && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 border shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Employment Rate</p>
              <p className="text-3xl font-bold">{employmentStats.employment_rate}</p>
            </div>
          )}

          {employmentStats?.median_starting_salary && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50/50 to-sky-50/30 dark:from-blue-900/10 border shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Starting Salary</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-400">
                {employmentStats.median_starting_salary}
              </p>
            </div>
          )}

          {employmentStats?.source && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Data Source</p>
              <p className="text-sm font-semibold">{employmentStats.source}</p>
            </div>
          )}
        </div>
      )}

      {/* TABS */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Select Career Stage:
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3.5 rounded-xl font-bold flex items-center gap-2.5 whitespace-nowrap transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ROLE CARDS */}
      {activeData?.roles && activeData.roles.length > 0 && (
        <div className="space-y-5 mb-8">
          {activeData.roles.map((role, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
            >
              <div className="flex items-start justify-between gap-6 mb-4 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">

                {/* LEFT SIDE — TITLE + DESCRIPTION */}
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

                {/* RIGHT SIDE — SAVE BUTTON + SALARY IN VERTICAL STACK */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">

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
                                    border border-blue-200/60 dark:border-blue-800/60 shadow-sm w-max">
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
              </div>



              {role.requirements && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{role.requirements}</p>
              )}

              {role.hiring_companies && (
                <div className="flex flex-wrap gap-2">
                  {role.hiring_companies.map((c, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {role.source && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 italic mt-2">
                  <BarChart3 className="h-3 w-3" />
                  <span>Source: {role.source}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CERTIFICATIONS */}
      {certifications.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" /> Professional Certifications
          </h4>

          {displayedCerts.map((cert, idx) => (
            <div key={idx} className="p-5 mb-3 border rounded-xl shadow-sm">
              <h5 className="font-bold text-sm mb-1">{cert.name}</h5>
              <p className="text-xs text-slate-600">{cert.provider} • {cert.timeline}</p>
              {cert.notes && <p className="text-xs mt-2 text-slate-500">{cert.notes}</p>}
            </div>
          ))}

          {certifications.length > 3 && (
            <button
              onClick={() => setShowAllCerts(!showAllCerts)}
              className="mt-3 underline text-sm font-semibold"
            >
              {showAllCerts ? "Show Less" : `Show ${certifications.length - 3} More`}
            </button>
          )}
        </div>
      )}

      {/* MARKET INSIGHTS */}
      {marketInsights && (
        <div className="mb-8">
          <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" /> Market Insights
          </h4>

          {marketInsights.demand_level && (
            <p className="text-sm mb-2">
              <span className="font-semibold">Demand:</span> {marketInsights.demand_level}
            </p>
          )}

          {marketInsights.trends && (
            <p className="text-sm mb-2">{marketInsights.trends}</p>
          )}

          {marketInsights.geographic_notes && (
            <p className="text-xs text-slate-500">{marketInsights.geographic_notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

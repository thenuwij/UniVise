import {
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  Info,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import { useState } from "react";
import SaveButton from "../SaveButton";

export default function SocietiesCommunity({ societies }) {
  const [showAll, setShowAll] = useState(false);
  const [expandedSocieties, setExpandedSocieties] = useState({});
  const toggleSociety = (idx) => setExpandedSocieties(prev => ({ ...prev, [idx]: !prev[idx] }));

  const facultySpecific = societies?.faculty_specific || [];
  const crossFaculty = societies?.cross_faculty || [];
  const majorEvents = societies?.major_events || [];
  const profDev = societies?.professional_development || {};
  const gettingStarted = societies?.getting_started || {};

  if (!facultySpecific.length && !crossFaculty.length && !majorEvents.length) return null;

  const displayedSocieties = showAll ? facultySpecific : facultySpecific.slice(0, 3);

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60
                      px-6 py-4 -mx-6 -mt-6 mb-5 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">

        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Users className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Societies
          </h3>
        </div>
      </div>

      {/* GETTING STARTED SECTION */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20
                      rounded-2xl shadow-sm">
        <div className="mb-5 pb-4 border-b-2 border-blue-200 dark:border-blue-600">
          <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Getting Started
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Everything you need to know to join clubs and societies at UNSW
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {gettingStarted.join_timing && (
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">When to Join</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{gettingStarted.join_timing}</p>
              </div>
            </div>
          )}
          {gettingStarted.cost_range && (
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <Star className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Membership Cost</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{gettingStarted.cost_range}</p>
              </div>
            </div>
          )}
          {gettingStarted.how_to_find && (
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">How to Find</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{gettingStarted.how_to_find}</p>
              </div>
            </div>
          )}
        </div>

        {/* Explore & Join Buttons */}
        <div className="pt-5 border-t-2 border-blue-200 dark:border-blue-600">
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="https://campus.hellorubric.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold
                       rounded-xl bg-blue-600 text-white dark:bg-blue-600 dark:text-white
                       hover:bg-blue-700 dark:hover:bg-blue-700
                       shadow-md hover:shadow-lg hover:scale-105
                       transition-all duration-200"
            >
              <Star className="h-4 w-4" />
              Hello Rubric
            </a>
            <a
              href="https://www.arc.unsw.edu.au/clubs/find-a-club"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold
                       rounded-xl bg-slate-800 text-white dark:bg-slate-700 dark:text-white
                       hover:bg-slate-900 dark:hover:bg-slate-600
                       shadow-md hover:shadow-lg hover:scale-105
                       transition-all duration-200"
            >
              <Heart className="h-4 w-4" />
              Arc UNSW Directory
            </a>
          </div>
        </div>
      </div>

      {/* FACULTY-SPECIFIC SOCIETIES */}
      {facultySpecific.length > 0 && (
        <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-600 shadow-md flex-shrink-0">
              <Users className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Your Faculty Societies
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Societies specific to your field of study
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {displayedSocieties.map((society, idx) => (
              <div
                key={idx}
                className={`rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 ${
                  expandedSocieties[idx] ? "border-l-4 border-l-blue-500" : ""
                } ${
                  idx % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800"
                }`}
              >
                {/* Always visible row */}
                <div
                  className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-indigo-100/60 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/30 transition-colors duration-150 rounded-xl"
                  onClick={() => toggleSociety(idx)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{society.name}</h5>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{society.relevance}</p>
                      {!expandedSocieties[idx] && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click to see activities & benefits</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SaveButton itemType="society" itemId={society.name} itemName={society.name} itemData={{ category: society.category, professional_affiliation: society.professional_affiliation, key_activities: society.key_activities, membership_benefits: society.membership_benefits }} />
                    <button
                      onClick={() => toggleSociety(idx)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                    >
                      {expandedSocieties[idx]
                        ? <ChevronUp className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                        : <ChevronDown className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                      }
                    </button>
                  </div>
                </div>

                {/* Expandable details */}
                {expandedSocieties[idx] && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
                    {/* Benefits text */}
                    {society.membership_benefits && (
                      <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Benefits: </span>
                        {society.membership_benefits}
                      </p>
                    )}

                    {/* Activity pills — always last */}
                    {society.key_activities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {society.key_activities.map((activity, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300">
                            {activity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {facultySpecific.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 w-full py-2 text-sm font-semibold
                       text-white dark:text-white
                       transition-all flex items-center justify-center gap-2
                       rounded-xl bg-indigo-600 dark:bg-indigo-600
                       hover:bg-indigo-700 dark:hover:bg-indigo-700
                       border-2 border-indigo-700 dark:border-indigo-800
                       shadow-md hover:shadow-lg hover:scale-105"
            >
              {showAll ? (
                <>Show Less <ChevronUp className="h-5 w-5" /></>
              ) : (
                <>Show {facultySpecific.length - 3} More Societies <ChevronDown className="h-5 w-5" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* CROSS-FACULTY SOCIETIES */}
      {crossFaculty.length > 0 && (
        <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-600 dark:bg-purple-600 shadow-md flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Cross-Faculty Societies
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Open to students from all faculties and disciplines
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {crossFaculty.map((s, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-lg text-slate-900 dark:text-slate-100">{s.name}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{s.why_join}</p>
                  </div>
                  <SaveButton itemType="society" itemId={s.name} itemName={s.name} itemData={{ why_join: s.why_join }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFESSIONAL DEVELOPMENT */}
      {(profDev.student_chapters?.length > 0 ||
        profDev.leadership_note ||
        profDev.skills_gained?.length > 0) && (
        <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
          <div className="p-6 bg-green-50 dark:bg-green-900/20
                          rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-green-600 dark:bg-green-600 shadow-md flex-shrink-0">
                <Award className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Professional Societies
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  Build leadership skills and industry connections
                </p>
              </div>
            </div>

          {profDev.student_chapters?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profDev.student_chapters.map((ch, i) => (
                <span
                  key={i}
                  className="px-4 py-2.5 rounded-xl text-base font-bold
                            bg-green-100 dark:bg-green-900/40
                            text-green-900 dark:text-green-100
                            border-2 border-green-300 dark:border-green-600"
                >
                  {ch}
                </span>
              ))}
            </div>
          )}

          {profDev.leadership_note && profDev.leadership_note !== "Information temporarily unavailable" && (
            <div className="mb-5 p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-green-700 dark:text-green-300 text-base">
                  Leadership Opportunities:{" "}
                </span>
                {profDev.leadership_note}
              </p>
            </div>
          )}

          {profDev.skills_gained?.length > 0 && (
            <div className="pt-5 border-t-2 border-green-200 dark:border-green-600">
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
                Skills You'll Develop
              </p>
              <div className="flex flex-wrap gap-2">
                {profDev.skills_gained.map((s, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-white dark:bg-slate-900
                              border-2 border-green-300 dark:border-green-700
                              text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
        {label}
      </span>
      <span className="text-base text-slate-900 dark:text-slate-100 font-bold">
        {value || "—"}
      </span>
    </div>
  );
}

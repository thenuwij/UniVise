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
  
  const facultySpecific = societies?.faculty_specific || [];
  const crossFaculty = societies?.cross_faculty || [];
  const majorEvents = societies?.major_events || [];
  const profDev = societies?.professional_development || {};
  const gettingStarted = societies?.getting_started || {};

  if (!facultySpecific.length && !crossFaculty.length && !majorEvents.length) return null;

  const displayedSocieties = showAll ? facultySpecific : facultySpecific.slice(0, 3);

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
            <Users className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Societies & Community
          </h3>
        </div>
      </div>

      {/* GETTING STARTED SECTION */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20
                      rounded-2xl border-2 border-blue-300 dark:border-blue-700 shadow-md">
        <div className="flex items-start gap-4 mb-5 pb-4 border-b-2 border-blue-200 dark:border-blue-600">
          <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-600 shadow-md flex-shrink-0">
            <Clock className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Getting Started
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Everything you need to know to join clubs and societies at UNSW
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          {gettingStarted.join_timing && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-600 shadow-sm">
              <Fact label="When to Join" value={gettingStarted.join_timing} />
            </div>
          )}
          {gettingStarted.cost_range && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-600 shadow-sm">
              <Fact label="Membership Cost" value={gettingStarted.cost_range} />
            </div>
          )}
          {gettingStarted.how_to_find && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-600 shadow-sm">
              <Fact label="How to Find Clubs" value={gettingStarted.how_to_find} />
            </div>
          )}
        </div>

        {/* Explore & Join Buttons */}
        <div className="pt-5 border-t-2 border-blue-200 dark:border-blue-600">
          <h5 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Official UNSW Platforms
          </h5>
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
          <div className="mb-5 pb-5 border-b-2 border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 rounded-xl bg-indigo-600 dark:bg-indigo-600 shadow-md flex-shrink-0">
                <Users className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Your Faculty Societies
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Societies specific to your field of study
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 shadow-sm">
              <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                These societies offer networking, events, and mentoring opportunities in your academic area.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {displayedSocieties.map((society, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600
                          bg-white dark:bg-slate-800
                          shadow-md hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-500
                          transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h5 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                        {society.name}
                      </h5>
                      {society.category && (
                        <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30
                                       border-2 border-indigo-300 dark:border-indigo-700
                                       text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg">
                          {society.category}
                        </span>
                      )}
                    </div>
                    {society.professional_affiliation && (
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mb-2">
                        {society.professional_affiliation}
                      </p>
                    )}
                  </div>

                  <SaveButton
                    itemType="society"
                    itemId={society.name}
                    itemName={society.name}
                    itemData={{
                      category: society.category,
                      professional_affiliation: society.professional_affiliation,
                      key_activities: society.key_activities,
                      membership_benefits: society.membership_benefits
                    }}
                  />
                  
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                  {society.relevance}
                </p>

                {society.key_activities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {society.key_activities.map((activity, i) => (
                      <span
                        key={i}
                        className="px-3 py-2 rounded-lg text-sm font-semibold
                                  bg-slate-100 dark:bg-slate-700
                                  border-2 border-slate-300 dark:border-slate-600
                                  text-slate-700 dark:text-slate-300"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                )}

                {society.membership_benefits && (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20
                                rounded-xl border-2 border-indigo-300/50 dark:border-indigo-700/50 shadow-sm">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 text-base">
                        Member Benefits:{" "}
                      </span>
                      {society.membership_benefits}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {facultySpecific.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-5 w-full py-4 text-base font-bold 
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
          <div className="mb-5 pb-5 border-b-2 border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 rounded-xl bg-purple-600 dark:bg-purple-600 shadow-md flex-shrink-0">
                <Sparkles className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Cross-Faculty Societies
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Open to students from all faculties and disciplines
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl border-2 border-purple-300 dark:border-purple-700 shadow-sm">
              <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                Explore interests beyond your major and connect with students across different disciplines.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {crossFaculty.map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border-2 border-slate-300 dark:border-slate-600
                          bg-white dark:bg-slate-800
                          shadow-md hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-500
                          transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {s.name}
                  </p>

                  <SaveButton
                    itemType="society"
                    itemId={s.name}
                    itemName={s.name}
                    itemData={{
                      why_join: s.why_join
                    }}
                  />
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {s.why_join}
                </p>
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
                          rounded-2xl border-2 border-green-300 dark:border-green-700 shadow-md">
            <div className="flex items-start gap-4 mb-5 pb-4 border-b-2 border-green-200 dark:border-green-600">
              <div className="p-3 rounded-xl bg-green-600 dark:bg-green-600 shadow-md flex-shrink-0">
                <Award className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Professional Societies
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Build leadership skills and industry connections
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-sm mb-5">
              <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                Student chapters and professional associations that can help you develop career-ready skills and industry networks.
              </p>
            </div>

          {profDev.student_chapters?.length > 0 && (
            <div className="mb-5">
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
                Student Chapters
              </p>
              <div className="flex flex-wrap gap-2">
                {profDev.student_chapters.map((ch, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-green-100 dark:bg-green-900/30
                              border-2 border-green-300 dark:border-green-700
                              text-green-800 dark:text-green-200 text-sm font-bold rounded-lg shadow-sm"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profDev.leadership_note && profDev.leadership_note !== "Information temporarily unavailable" && (
            <div className="mb-5 p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
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
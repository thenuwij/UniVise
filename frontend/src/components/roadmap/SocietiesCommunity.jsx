import { useState } from "react";
import { 
  Users, 
  Clock,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  Heart
} from "lucide-react";

/**
 * Societies & Community Component
 * 
 * More vibrant and colorful for social/community feel:
 * - Rich purple/indigo/pink gradients
 * - Engaging visual elements
 * - Premium sophistication maintained
 * - Perfect for student community sections
 */

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
      
      {/* ========== HEADER ========== */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-8 py-6 -mx-8 -mt-8 mb-8 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">
        
        {/* Very subtle gradient accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Users className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Societies & Community
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Connect with peers, build your network, and find your community
            </p>
          </div>
        </div>
      </div>

      {/* ========== GETTING STARTED BANNER ========== */}
      <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 
                      dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 
                      rounded-xl border border-purple-200/60 dark:border-purple-700/60 shadow-md">
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2.5">
          <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Getting Started
        </h4>

        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          {gettingStarted.join_timing && (
            <div className="p-3 bg-white/70 dark:bg-slate-800/50 rounded-lg border border-purple-200/40 dark:border-purple-700/40">
              <Fact label="When to Join" value={gettingStarted.join_timing} />
            </div>
          )}
          {gettingStarted.cost_range && (
            <div className="p-3 bg-white/70 dark:bg-slate-800/50 rounded-lg border border-purple-200/40 dark:border-purple-700/40">
              <Fact label="Membership Cost" value={gettingStarted.cost_range} />
            </div>
          )}
          {gettingStarted.how_to_find && (
            <div className="p-3 bg-white/70 dark:bg-slate-800/50 rounded-lg border border-purple-200/40 dark:border-purple-700/40">
              <Fact label="How to Find" value={gettingStarted.how_to_find} />
            </div>
          )}
        </div>

        {/* Explore & Join Buttons */}
        <div className="pt-4 border-t border-purple-200/50 dark:border-purple-700/50">
          <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Explore & Join Clubs
          </h5>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            Looking to get involved? Check out official UNSW clubs and platforms below:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://campus.hellorubric.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold 
                       rounded-xl bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white
                       hover:from-blue-600 hover:via-sky-600 hover:to-cyan-600 
                       shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                       transition-all duration-200"
            >
              <Star className="h-4 w-4" />
              Hello Rubric
            </a>
            <a
              href="https://www.arc.unsw.edu.au/clubs/find-a-club"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold 
                       rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-violet-500 text-white
                       hover:from-purple-600 hover:via-indigo-600 hover:to-violet-600
                       shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                       transition-all duration-200"
            >
              <Heart className="h-4 w-4" />
              Arc UNSW Directory
            </a>
          </div>
        </div>
      </div>

      {/* ========== FACULTY-SPECIFIC SOCIETIES ========== */}
      {facultySpecific.length > 0 && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Your Faculty Societies
            </h4>
            <p className="flex items-start gap-1.5 text-sm text-slate-700 dark:text-slate-300 leading-snug">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 mt-0.5 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
              Faculty-based societies tailored to your study area — offering events, mentoring, and discipline-specific networking.
            </p>
          </div>

          <div className="space-y-4">
            {displayedSocieties.map((society, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/60
                          bg-gradient-to-br from-slate-50 via-white to-slate-100/50
                          dark:bg-gradient-to-br dark:from-slate-800/50 dark:via-slate-800/40 dark:to-slate-900/50
                          shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h5 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {society.name}
                      </h5>
                      {society.category && (
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 
                                       dark:from-purple-900/40 dark:to-pink-900/40 
                                       border border-purple-300 dark:border-purple-700
                                       text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg shadow-sm">
                          {society.category}
                        </span>
                      )}
                    </div>
                    {society.professional_affiliation && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                        {society.professional_affiliation}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                  {society.relevance}
                </p>

                {society.key_activities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {society.key_activities.map((activity, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                  bg-gradient-to-r from-indigo-50 to-blue-50 
                                  dark:from-indigo-900/30 dark:to-blue-900/30
                                  border-2 border-indigo-200 dark:border-indigo-700
                                  text-indigo-700 dark:text-indigo-300 shadow-sm"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                )}

                {society.membership_benefits && (
                  <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 
                                dark:from-purple-900/20 dark:to-pink-900/20 
                                rounded-lg border border-purple-200/40 dark:border-purple-700/40">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
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
              className="mt-4 w-full py-3 text-sm font-bold text-slate-700 dark:text-slate-300
                       hover:text-slate-900 dark:hover:text-slate-100
                       transition-all flex items-center justify-center gap-2 
                       rounded-xl bg-slate-100 dark:bg-slate-800
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       border-2 border-slate-300 dark:border-slate-600
                       hover:border-slate-400 dark:hover:border-slate-500
                       shadow-sm hover:shadow-md"
            >
              {showAll ? (
                <>Show Less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show {facultySpecific.length - 3} More <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* ========== CROSS-FACULTY SOCIETIES ========== */}
      {crossFaculty.length > 0 && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              Popular Cross-Faculty Options
            </h4>
            <p className="flex items-start gap-1.5 text-sm text-slate-700 dark:text-slate-300 leading-snug">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 mt-0.5 text-pink-500 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
              Cross-disciplinary clubs open to students from any faculty — great for exploring interests beyond your major.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {crossFaculty.map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60
                          bg-gradient-to-br from-slate-50 via-white to-slate-100/50
                          dark:bg-gradient-to-br dark:from-slate-800/50 dark:via-slate-800/40 dark:to-slate-900/50
                          shadow-sm hover:shadow-md transition-all duration-200"
              >
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
                  {s.name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.why_join}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== PROFESSIONAL DEVELOPMENT ========== */}
      {(profDev.student_chapters?.length > 0 ||
        profDev.leadership_note ||
        profDev.skills_gained?.length > 0) && (
        <div className="p-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 
                        dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-sky-900/20 
                        rounded-xl border border-indigo-200/60 dark:border-indigo-700/60 shadow-md">
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
            <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Professional Development
          </h4>
          <p className="flex items-start gap-1.5 text-sm text-slate-700 dark:text-slate-300 mb-5 leading-snug">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 mt-0.5 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            Professional associations and student chapters that help you grow skills, leadership, and industry connections.
          </p>

          {profDev.student_chapters?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                Student Chapters:
              </p>
              <div className="flex flex-wrap gap-2">
                {profDev.student_chapters.map((ch, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 
                              dark:from-blue-900/30 dark:to-indigo-900/30 
                              border border-blue-200 dark:border-blue-700 
                              text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg shadow-sm"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profDev.leadership_note && profDev.leadership_note !== "Information temporarily unavailable" && (
            <div className="mb-4 p-4 bg-white/60 dark:bg-slate-800/40 rounded-lg border border-slate-200/40 dark:border-slate-700/40">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Leadership:{" "}
                </span>
                {profDev.leadership_note}
              </p>
            </div>
          )}

          {profDev.skills_gained?.length > 0 && (
            <div className="pt-4 border-t border-indigo-200/50 dark:border-indigo-700/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                Skills You'll Gain:
              </p>
              <div className="flex flex-wrap gap-2">
                {profDev.skills_gained.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 
                              dark:from-indigo-900/30 dark:to-purple-900/30
                              border border-indigo-200 dark:border-indigo-700
                              text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg
                              shadow-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
        {label}
      </span>
      <span className="text-sm text-slate-800 dark:text-slate-200 font-semibold">
        {value || "—"}
      </span>
    </div>
  );
}
import { ChevronDown, ChevronUp, Clock, ExternalLink, Heart, Info, Star } from "lucide-react";
import { useState } from "react";
import SaveButton from "@/shared/ui/SaveButton";
import SectionHeading from "./SectionHeading";
import { card } from "../utils/cardStyles";

export default function SocietiesCommunity({ societies }) {
  const [showAll, setShowAll] = useState(false);
  const [expandedSocieties, setExpandedSocieties] = useState({});
  const toggleSociety = (idx) => setExpandedSocieties((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const facultySpecific = societies?.faculty_specific || [];
  const crossFaculty = societies?.cross_faculty || [];
  const majorEvents = societies?.major_events || [];
  const profDev = societies?.professional_development || {};
  const gettingStarted = societies?.getting_started || {};

  if (!facultySpecific.length && !crossFaculty.length && !majorEvents.length) return null;

  const displayedSocieties = showAll ? facultySpecific : facultySpecific.slice(0, 3);
  const facts = [
    [Clock, "When to join", gettingStarted.join_timing],
    [Star, "Membership cost", gettingStarted.cost_range],
    [Info, "How to find them", gettingStarted.how_to_find],
  ].filter(([, , value]) => value);
  const hasProfDev = profDev.student_chapters?.length > 0 || profDev.leadership_note || profDev.skills_gained?.length > 0;

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800 [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      <section>
        <div>
          <SectionHeading>
            Getting started
          </SectionHeading>
          {facts.length > 0 && (
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              {facts.map(([Icon, label, value]) => (
                <div key={label} className={`${card} flex items-start gap-3 p-5`}>
                  <Icon className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <a
              href="https://campus.hellorubric.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-blue-800 dark:text-blue-50 bg-gradient-to-r from-blue-100 to-sky-200 dark:from-blue-800 dark:to-sky-700 border border-blue-200 dark:border-blue-700 shadow-md shadow-blue-500/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all"
            >
              <Star className="h-5 w-5 flex-shrink-0" />
              <span className="text-base font-semibold">Hello Rubric</span>
              <span className="hidden md:inline text-sm text-blue-700 dark:text-blue-200">Events and club sign-ups</span>
              <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-80" />
            </a>
            <a
              href="https://www.arc.unsw.edu.au/clubs/find-a-club"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-emerald-800 dark:text-emerald-50 bg-gradient-to-r from-emerald-100 to-green-200 dark:from-emerald-800 dark:to-green-700 border border-emerald-200 dark:border-emerald-700 shadow-md shadow-emerald-500/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all"
            >
              <Heart className="h-5 w-5 flex-shrink-0" />
              <span className="text-base font-semibold">Arc UNSW directory</span>
              <span className="hidden md:inline text-sm text-emerald-700 dark:text-emerald-200">Every club at UNSW</span>
              <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-80" />
            </a>
          </div>
        </div>
      </section>

      {facultySpecific.length > 0 && (
        <section>
          <SectionHeading>
            Your faculty societies
          </SectionHeading>
          <div className="mt-6 space-y-4">
            {displayedSocieties.map((society, idx) => {
              const open = !!expandedSocieties[idx];
              return (
                <div key={idx} className={`${card} overflow-hidden`}>
                  <div
                    className="group flex items-center justify-between gap-4 px-6 py-5 cursor-pointer hover:bg-blue-50/60 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => toggleSociety(idx)}
                  >
                    <div className="min-w-0">
                      <h5 className="text-lg font-semibold text-slate-900 dark:text-white">{society.name}</h5>
                      <p className="mt-1.5 text-base text-slate-600 dark:text-slate-300">{society.relevance}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <SaveButton
                        itemType="society"
                        itemId={society.name}
                        itemName={society.name}
                        itemData={{ category: society.category, professional_affiliation: society.professional_affiliation, key_activities: society.key_activities, membership_benefits: society.membership_benefits }}
                      />
                      <button
                        onClick={() => toggleSociety(idx)}
                        aria-expanded={open}
                        className="p-2 rounded-xl text-slate-500 group-hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        {open ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="px-6 pb-6 pt-1 space-y-4">
                      {society.membership_benefits && (
                        <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Benefits: </span>
                          {society.membership_benefits}
                        </p>
                      )}
                      {society.key_activities?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {society.key_activities.map((activity, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-100 dark:ring-blue-800">
                              {activity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {facultySpecific.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              {showAll ? (
                <>Show fewer <ChevronUp className="h-5 w-5" /></>
              ) : (
                <>Show {facultySpecific.length - 3} more societies <ChevronDown className="h-5 w-5" /></>
              )}
            </button>
          )}
        </section>
      )}

      {crossFaculty.length > 0 && (
        <section>
          <SectionHeading>
            Cross-faculty societies
          </SectionHeading>
          <div className="mt-6 grid sm:grid-cols-2 gap-5">
            {crossFaculty.map((s, idx) => (
              <div key={idx} className={`${card} p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{s.name}</p>
                    <p className="mt-2 text-base text-slate-600 dark:text-slate-300 leading-relaxed">{s.why_join}</p>
                  </div>
                  <SaveButton itemType="society" itemId={s.name} itemName={s.name} itemData={{ why_join: s.why_join }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasProfDev && (
        <section>
          <SectionHeading>
            Professional societies
          </SectionHeading>
          <div className={`${card} mt-6 p-6 md:p-8 space-y-6`}>
            {profDev.student_chapters?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profDev.student_chapters.map((ch, i) => (
                  <span key={i} className="px-4 py-2 rounded-full text-base font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800">
                    {ch}
                  </span>
                ))}
              </div>
            )}
            {profDev.leadership_note && profDev.leadership_note !== "Information temporarily unavailable" && (
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Leadership opportunities: </span>
                {profDev.leadership_note}
              </p>
            )}
            {profDev.skills_gained?.length > 0 && (
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">Skills you'll develop</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profDev.skills_gained.map((s, i) => (
                    <span key={i} className="px-3.5 py-1.5 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

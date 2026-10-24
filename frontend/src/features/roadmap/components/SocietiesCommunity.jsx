import { ChevronDown, Clock, ExternalLink, Heart, Info, Star } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import { useState } from "react";
import SaveButton from "@/shared/ui/SaveButton";
import SectionHeading from "@/shared/ui/SectionHeading";
import { card } from "@/shared/ui/cardStyles";

export default function SocietiesCommunity({ societies }) {
  const [showAll, setShowAll] = useState(false);
  const [expandedSocieties, setExpandedSocieties] = useState({});
  const toggleSociety = (idx) => setExpandedSocieties((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const facultySpecific = societies?.faculty_specific || [];
  const crossFaculty = societies?.cross_faculty || [];
  const gettingStarted = societies?.getting_started || {};

  if (!facultySpecific.length && !crossFaculty.length) return null;

  const displayedSocieties = showAll ? facultySpecific : facultySpecific.slice(0, 3);
  const facts = [
    [Clock, "When to join", gettingStarted.join_timing],
    [Info, "How to find them", gettingStarted.how_to_find],
  ].filter(([, , value]) => value);

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800 [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
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
                    className="group flex items-center justify-between gap-4 px-6 py-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => toggleSociety(idx)}
                  >
                    <div className="min-w-0">
                      <h5 className="text-lg md:text-xl font-bold text-ink-strong leading-snug">{society.name}</h5>
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
                        aria-label={open ? "Hide details" : "Show details"}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronDown aria-hidden="true" className={`h-5 w-5 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="px-6 pb-6 pt-1 grid md:grid-cols-2 gap-3">
                      {society.membership_benefits && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                          <p className="text-sm font-semibold text-ink-strong">Benefits</p>
                          <p className="mt-1.5 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">{society.membership_benefits}</p>
                        </div>
                      )}
                      {society.key_activities?.length > 0 && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                          <p className="text-sm font-semibold text-ink-strong">Activities</p>
                          <ul className="mt-1.5 space-y-1 text-[15px] text-slate-700 dark:text-slate-300">
                            {society.key_activities.map((activity, i) => (
                              <li key={i} className="flex gap-2"><span className="text-ink-muted">•</span>{activity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {facultySpecific.length > 3 && (
            <ExpandToggle plain open={showAll} onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show fewer" : `Show ${facultySpecific.length - 3} more societies`}
            </ExpandToggle>
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
              <div key={idx} className="rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-ink-strong leading-snug">{s.name}</p>
                    <p className="mt-2 text-base text-slate-600 dark:text-slate-300 leading-relaxed">{s.why_join}</p>
                  </div>
                  <SaveButton itemType="society" itemId={s.name} itemName={s.name} itemData={{ why_join: s.why_join }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div>
          <SectionHeading>
            Getting started
          </SectionHeading>
          {facts.length > 0 && (
            <div className={`mt-6 grid gap-4 ${facts.length === 1 ? "" : facts.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {facts.map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 flex items-start gap-3 p-5">
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
              className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
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
              className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
            >
              <Heart className="h-5 w-5 flex-shrink-0" />
              <span className="text-base font-semibold">Arc UNSW directory</span>
              <span className="hidden md:inline text-sm text-blue-700 dark:text-blue-200">Every club at UNSW</span>
              <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-80" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

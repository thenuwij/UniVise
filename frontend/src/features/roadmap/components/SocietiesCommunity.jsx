import { ChevronDown, ChevronUp, Clock, ExternalLink, Heart, Info, Star } from "lucide-react";
import { useState } from "react";
import SaveButton from "@/shared/ui/SaveButton";
import SectionHeading from "@/shared/ui/SectionHeading";
import { hasContent } from "@/shared/lib/format";
import { card, clickable } from "@/shared/ui/cardStyles";
import { describeBody } from "../utils/professionalBodies";

export default function SocietiesCommunity({ societies }) {
  const [showAll, setShowAll] = useState(false);
  const [expandedSocieties, setExpandedSocieties] = useState({});
  const toggleSociety = (idx) => setExpandedSocieties((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const facultySpecific = societies?.faculty_specific || [];
  const crossFaculty = societies?.cross_faculty || [];
  const profDev = societies?.professional_development || {};
  const gettingStarted = societies?.getting_started || {};

  if (!facultySpecific.length && !crossFaculty.length) return null;

  const displayedSocieties = showAll ? facultySpecific : facultySpecific.slice(0, 3);
  const facts = [
    [Clock, "When to join", gettingStarted.join_timing],
    [Info, "How to find them", gettingStarted.how_to_find],
  ].filter(([, , value]) => value);
  const bodies = profDev.professional_bodies || (profDev.student_chapters || []).map((name) => ({ name, url: null }));
  const hasProfDev = bodies.length > 0 || profDev.leadership_note || profDev.skills_gained?.length > 0;

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
                    className="group flex items-center justify-between gap-4 px-6 py-5 cursor-pointer hover:bg-blue-50/60 dark:hover:bg-slate-800/50 transition-colors"
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
                        className="p-2 rounded-xl text-slate-500 group-hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        {open ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="px-6 pb-6 pt-1 grid md:grid-cols-2 gap-3">
                      {society.membership_benefits && (
                        <div className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-950/40 dark:to-sky-950/30 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Benefits</p>
                          <p className="mt-1.5 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">{society.membership_benefits}</p>
                        </div>
                      )}
                      {society.key_activities?.length > 0 && (
                        <div className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-950/40 dark:to-sky-950/30 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Activities</p>
                          <ul className="mt-1.5 space-y-1 text-[15px] text-slate-700 dark:text-slate-300">
                            {society.key_activities.map((activity, i) => (
                              <li key={i} className="flex gap-2"><span className="text-blue-500">•</span>{activity}</li>
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
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-800 hover:bg-blue-200 hover:border-blue-400 dark:hover:bg-blue-900/50 transition-colors"
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

      {hasProfDev && (
        <section>
          <SectionHeading>
            Professional societies
          </SectionHeading>
          <div className="mt-6 space-y-5">
            {bodies.length > 0 && (
              <div className={`grid gap-4 ${bodies.length === 1 ? "" : bodies.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {bodies.map((body) => {
                  const { short, about } = describeBody(body.name);
                  const inner = (
                    <>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 min-w-[3rem] h-12 px-2 rounded-xl inline-flex items-center justify-center text-sm font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-200 dark:ring-blue-800">
                          {short}
                        </span>
                        <div className="min-w-0">
                          <p className="text-lg font-bold text-ink-strong leading-snug break-words">{body.name}</p>
                          {about && <p className="mt-1 text-[15px] text-ink-muted leading-relaxed">{about}</p>}
                        </div>
                      </div>
                      {body.url && (
                        <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-link">
                          Visit website <ExternalLink className="h-4 w-4" />
                        </span>
                      )}
                    </>
                  );
                  return body.url ? (
                    <a
                      key={body.name}
                      href={body.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${card} ${clickable} flex flex-col p-5`}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={body.name} className={`${card} flex flex-col p-5`}>{inner}</div>
                  );
                })}
              </div>
            )}
            {(hasContent(profDev.leadership_note) || profDev.skills_gained?.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {hasContent(profDev.leadership_note) && (
                  <div className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-950/40 dark:to-sky-950/30 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Leadership opportunities</p>
                    <p className="mt-1.5 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">{profDev.leadership_note}</p>
                  </div>
                )}
                {profDev.skills_gained?.length > 0 && (
                  <div className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-950/40 dark:to-sky-950/30 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Skills you'll develop</p>
                    <ul className="mt-1.5 space-y-1 text-[15px] text-slate-700 dark:text-slate-300">
                      {profDev.skills_gained.map((skill, i) => (
                        <li key={i} className="flex gap-2"><span className="text-blue-500">•</span>{skill}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
              className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-blue-800 dark:text-blue-50 bg-gradient-to-r from-blue-100 to-sky-200 dark:from-blue-800 dark:to-sky-700 border border-blue-200 dark:border-blue-700 shadow-md shadow-blue-500/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all"
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

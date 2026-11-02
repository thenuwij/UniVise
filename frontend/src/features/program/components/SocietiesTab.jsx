import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import SaveButton from "@/shared/ui/SaveButton";
import SectionHeading from "@/shared/ui/SectionHeading";
import { fetchSocietyLinks, findLink } from "../utils/societyLinks";
import { filterPill } from "@/shared/ui/cardStyles";

const ARC_CLUB_SEARCH = "https://www.arc.unsw.edu.au/clubs/find-a-club";
const RUBRIC_DIRECTORY = "https://campus.hellorubric.com/search?type=societies&universityid=5";
const SHOWN = 4;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "faculty", label: "Your faculty" },
  { id: "cross", label: "Across UNSW" },
];

function SocietyRow({ society, link }) {
  return (
    <li className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-6 py-5 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-lg font-semibold text-ink-strong leading-snug">{society.name}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {society.kind === "faculty" ? "Your faculty" : "Across UNSW"}
          </span>
          <SaveButton itemType="society" itemId={society.name} itemName={society.name} itemData={{ ...society.saveData, relevance: society.why, website: link?.url || ARC_CLUB_SEARCH }} className="p-1! rounded-lg! border! shadow-none!" />
        </div>
      </div>
      {society.why && <p className="mt-1.5 text-[15px] text-slate-700 dark:text-slate-300">{society.why}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
        <a href={link?.url || ARC_CLUB_SEARCH} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-100 px-3.5 text-blue-900 transition-colors hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-100 dark:hover:bg-blue-900">
          {link ? (link.isWebsite ? "Official website" : "Page on Rubric") : "Find on Arc"} <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}

export default function SocietiesTab({ societies }) {
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [links, setLinks] = useState(null);

  useEffect(() => {
    let active = true;
    fetchSocietyLinks()
      .then((index) => active && setLinks(index))
      .catch((err) => console.error("Society links failed:", err));
    return () => { active = false; };
  }, []);

  const faculty = (societies?.faculty_specific || []).map((s) => ({
    kind: "faculty",
    name: s.name,
    why: s.relevance,
    saveData: { category: s.category, professional_affiliation: s.professional_affiliation, key_activities: s.key_activities, membership_benefits: s.membership_benefits },
  }));
  const cross = (societies?.cross_faculty || []).map((s) => ({ kind: "cross", name: s.name, why: s.why_join, saveData: { why_join: s.why_join } }));
  if (!faculty.length && !cross.length) return null;

  const all = [...faculty, ...cross];
  const filtered = filter === "all" ? all : all.filter((s) => s.kind === filter);
  const shown = showAll ? filtered : filtered.slice(0, SHOWN);
  const joinTiming = societies?.getting_started?.join_timing;

  return (
    <div>
      <SectionHeading subtitle="Matched to your degree and the careers it leads to.">Societies for you to join</SectionHeading>
      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-ink-strong">Show societies</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter societies">
          {FILTERS.map(({ id, label }) => (
            <button key={id} type="button" className={filterPill(filter === id)} aria-pressed={filter === id} onClick={() => { setFilter(id); setShowAll(false); }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {shown.map((society) => (
          <SocietyRow key={`${society.kind}-${society.name}`} society={society} link={findLink(links, society.name)} />
        ))}
      </ul>
      {filtered.length > SHOWN && (
        <ExpandToggle quiet open={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show ${filtered.length - SHOWN} more societies`}
        </ExpandToggle>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-5 py-4 dark:bg-slate-800/50">
        <p className="text-[15px] text-ink-muted">{joinTiming || "Most societies sign up members in O-Week and Week 1."}</p>
        <a href={RUBRIC_DIRECTORY} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline">
          Browse all clubs on Rubric <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

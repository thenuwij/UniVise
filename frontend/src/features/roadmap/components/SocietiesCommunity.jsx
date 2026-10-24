import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import SaveButton from "@/shared/ui/SaveButton";
import SectionHeading from "@/shared/ui/SectionHeading";
import { fetchSocietyLinks, findLink } from "../utils/societyLinks";

const RUBRIC_DIRECTORY = "https://campus.hellorubric.com/search?type=societies&universityid=5";
const SHOWN = 4;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "faculty", label: "Your faculty" },
  { id: "cross", label: "Across UNSW" },
];

const pill = (active) =>
  `rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
    active
      ? "bg-blue-600 text-white ring-1 ring-blue-600 dark:bg-blue-500 dark:ring-blue-500"
      : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-blue-50 hover:ring-blue-300 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800"
  }`;

function SocietyRow({ society, link }) {
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-lg font-semibold text-ink-strong leading-snug">{society.name}</p>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {society.kind === "faculty" ? "Your faculty" : "Across UNSW"}
        </span>
      </div>
      {society.why && <p className="mt-1.5 text-[15px] text-slate-700 dark:text-slate-300">{society.why}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
        {link && (
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-link hover:underline">
            {link.isWebsite ? "Official website" : "Page on Rubric"} <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        <SaveButton itemType="society" itemId={society.name} itemName={society.name} itemData={society.saveData} />
      </div>
    </li>
  );
}

export default function SocietiesCommunity({ societies }) {
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
            <button key={id} type="button" className={pill(filter === id)} aria-pressed={filter === id} onClick={() => { setFilter(id); setShowAll(false); }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {shown.map((society) => (
          <SocietyRow key={`${society.kind}-${society.name}`} society={society} link={findLink(links, society.name)} />
        ))}
      </ul>
      {filtered.length > SHOWN && (
        <ExpandToggle plain open={showAll} onClick={() => setShowAll(!showAll)}>
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

import RoadmapCard from "./RoadmapCard";

export default function EntryRequirementsCard({ atar, selectionRank, subjects = [] }) {
  return (
    <RoadmapCard title="Key Entry Requirements" subtitle="Check the latest university handbook for precise thresholds.">
      <ul className="grid sm:grid-cols-3 gap-3 text-slate-800">
        <li className="p-3 rounded-xl bg-slate-50">
          <div className="text-xs uppercase tracking-wide text-slate-500">Entry ATAR</div>
          <div className="mt-1 text-lg">{atar || "Check university"}</div>
        </li>
        <li className="p-3 rounded-xl bg-slate-50">
          <div className="text-xs uppercase tracking-wide text-slate-500">Selection Rank</div>
          <div className="mt-1 text-lg">{selectionRank || "Varies"}</div>
        </li>
        <li className="p-3 rounded-xl bg-slate-50">
          <div className="text-xs uppercase tracking-wide text-slate-500">Assumed Knowledge</div>
          <div className="mt-1 text-lg">{subjects.length ? subjects.join(", ") : "—"}</div>
        </li>
      </ul>
    </RoadmapCard>
  );
}

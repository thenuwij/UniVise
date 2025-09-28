import RoadmapCard from "./RoadmapCard";

export default function EntryRequirementsCard({ atar, selectionRank, subjects = [] }) {
  return (
    <RoadmapCard
      title="Key Entry Requirements"
      subtitle="Check the latest university handbook for precise thresholds."
    >
      <ul className="grid sm:grid-cols-3 gap-3 text-primary">
        <li className="p-3 rounded-xl bg-accent dark:bg-secondary">
          <div className="text-xs uppercase tracking-wide text-secondary">Entry ATAR</div>
          <div className="mt-1 text-lg">{atar || "Check university"}</div>
        </li>
        <li className="p-3 rounded-xl bg-accent dark:bg-secondary">
          <div className="text-xs uppercase tracking-wide text-secondary">Selection Rank</div>
          <div className="mt-1 text-lg">{selectionRank || "Varies"}</div>
        </li>
        <li className="p-3 rounded-xl bg-accent dark:bg-secondary">
          <div className="text-xs uppercase tracking-wide text-secondary">Assumed Knowledge</div>
          <div className="mt-1 text-lg">
            {subjects.length ? subjects.join(", ") : "—"}
          </div>
        </li>
      </ul>
    </RoadmapCard>
  );
}

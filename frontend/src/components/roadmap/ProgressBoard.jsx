import RoadmapCard from "./RoadmapCard";

export default function ProgressBoard({ currentWam, uocCompleted, remainingUoc, estCompletion, progress = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <RoadmapCard title="Progress Board" subtitle="Live from your transcript when available.">
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          ["Current WAM", currentWam ?? "—"],
          ["UOC Completed", uocCompleted ?? "—"],
          ["Remaining UOC", remainingUoc ?? "—"],
          ["Est. Completion", estCompletion ?? "—"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="p-3 rounded-xl bg-accent dark:bg-secondary transition-colors"
          >
            <div className="text-xs uppercase tracking-wide text-secondary">{k}</div>
            <div className="mt-1 text-lg text-primary">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 h-3 w-full bg-accent dark:bg-secondary rounded-full overflow-hidden">
        <div
          className="h-3 bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </RoadmapCard>
  );
}

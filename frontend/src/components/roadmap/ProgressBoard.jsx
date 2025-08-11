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
          <div key={k} className="p-3 rounded-xl bg-slate-50">
            <div className="text-xs uppercase tracking-wide text-slate-500">{k}</div>
            <div className="mt-1 text-lg text-slate-900">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 h-3 w-full bg-slate-200 rounded-full overflow-hidden">
        <div className="h-3 bg-slate-900" style={{ width: `${pct}%` }} />
      </div>
    </RoadmapCard>
  );
}

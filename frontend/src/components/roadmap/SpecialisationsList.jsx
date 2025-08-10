import RoadmapCard from "./RoadmapCard";

export default function SpecialisationsList({ items = [] }) {
  return (
    <RoadmapCard title="Suggested Specialisations">
      <div className="flex flex-wrap gap-2">
        {items.length ? items.map((s, i) => (
          <span key={i} className="px-3 py-1 rounded-full border border-slate-200 bg-white">{s}</span>
        )) : <div className="text-slate-500">—</div>}
      </div>
    </RoadmapCard>
  );
}

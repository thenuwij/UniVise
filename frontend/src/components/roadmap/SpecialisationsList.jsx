import RoadmapCard from "./RoadmapCard";

export default function SpecialisationsList({ items = [] }) {
  return (
    <RoadmapCard title="Suggested Specialisations">
      <div className="flex flex-wrap gap-2">
        {items.length ? (
          items.map((s, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full border border-border-light dark:border-border-medium 
                         bg-accent dark:bg-secondary text-primary text-sm transition-colors"
            >
              {s}
            </span>
          ))
        ) : (
          <div className="text-secondary">—</div>
        )}
      </div>
    </RoadmapCard>
  );
}

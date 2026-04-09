// src/components/mindmesh/Legend.jsx

function LegendLine({ dashed, color, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="24" height="10" className="flex-shrink-0">
        <line
          x1="0" y1="5" x2="24" y2="5"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "4 3" : "none"}
        />
      </svg>
      <span>{label}</span>
    </span>
  );
}

export default function Legend() {
  return (
    <div className="absolute top-4 left-4 z-10 bg-slate-900/75 rounded-xl px-3 py-2.5 text-xs text-slate-300 backdrop-blur-sm space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Legend</p>
      <LegendLine dashed={false} color="#3b82f6" label="Mandatory prerequisite" />
      <LegendLine dashed={true} color="#8b5cf6" label="Flexible / OR option" />
    </div>
  );
}

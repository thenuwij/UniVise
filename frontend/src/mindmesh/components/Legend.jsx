// src/components/mindmesh/Legend.jsx
function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block w-3.5 h-3.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </span>
  );
}

export default function Legend() {
  return (
    <div className="absolute top-4 left-4 z-10 bg-slate-800/70 rounded-lg px-3 py-2 text-xs text-slate-300 backdrop-blur">
      <div className="flex flex-wrap gap-3">
        <LegendDot color="#0ea5e9" label="Course" />
        <LegendDot color="#94a3b8" label="Single requirement (solid)" />
        <LegendDot color="#60a5fa" label="Combined requirements (dashed)" />
      </div>
    </div>
  );
}

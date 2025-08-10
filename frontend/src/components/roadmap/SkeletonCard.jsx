export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6 animate-pulse">
      {[...Array(lines)].map((_, i) => (
        <div key={i} className={`h-4 bg-slate-200 rounded ${i ? "mt-3" : ""}`} />
      ))}
    </div>
  );
}

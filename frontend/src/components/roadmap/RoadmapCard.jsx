export default function RoadmapCard({ title, subtitle, right, children }) {
  return (
    <section className="bg-white/90 backdrop-blur rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          {title && <h2 className="text-2xl font-light text-slate-900">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

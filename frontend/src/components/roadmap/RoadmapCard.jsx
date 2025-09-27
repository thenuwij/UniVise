export default function RoadmapCard({ title, subtitle, right, children }) {
  return (
    <section className="card-solid p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          {title && <h2 className="text-2xl font-light text-primary">{title}</h2>}
          {subtitle && <p className="text-sm text-secondary mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card-solid p-6 animate-pulse">
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded bg-accent dark:bg-secondary ${i ? "mt-3" : ""}`}
        />
      ))}
    </div>
  );
}

import SkeletonCard from "./SkeletonCard";

export default function RoadmapStatus({ loading, error }) {
  if (loading) {
    return (
      <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-12 space-y-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
        <SkeletonCard lines={4} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-[1680px] mx-auto px-5 md:px-10 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50/70 dark:border-red-700 dark:bg-red-900/40 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }
  return (
    <div className="text-center py-16 text-secondary">
      Ready when you are. Your UNSW roadmap will appear here.
    </div>
  );
}

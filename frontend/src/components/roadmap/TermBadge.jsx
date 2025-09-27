export default function TermBadge({ term }) {
  if (!term) return null;

  return (
    <span
      className="ml-2 text-xs px-2 py-0.5 rounded-full border border-border-light dark:border-border-medium text-primary"
    >
      {term}
    </span>
  );
}

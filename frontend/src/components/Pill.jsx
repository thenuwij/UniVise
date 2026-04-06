
export default function Pill({ children }) {
  return (
    <span
      className="
        px-2.5 py-0.5 rounded-full text-xs
        bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 border border-blue-200
        dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-200 dark:border-blue-700
      "
    >
      {children}
    </span>
  );
}

/** @file Pill.jsx
 *  Small rounded label used for inline meta facts.
 */

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function Pill({ children }) {
  return (
    <span
      className="
        px-3 py-1 rounded-full text-sm
        bg-accent text-secondary border border-border-light
        dark:bg-slate-800 dark:text-primary dark:border-border-medium
      "
    >
      {children}
    </span>
  );
}

/** @file Fact.jsx
 *  Compact fact block (label + value) for sidebars.
 */

/**
 * @param {{ label: string, value?: React.ReactNode }} props
 */
export default function Fact({ label, value }) {
  return (
    <div
      className="
        flex flex-col rounded-2xl p-3
        bg-card border border-border-light shadow-sm
        dark:border-border-medium
      "
    >
      <span className="text-[11px] uppercase tracking-wide text-secondary">
        {label}
      </span>
      <span className="mt-1 text-primary font-semibold">
        {value ?? "—"}
      </span>
    </div>
  );
}

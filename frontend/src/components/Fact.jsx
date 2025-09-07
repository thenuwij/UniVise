/** @file Fact.jsx
 *  Compact fact block (label + value) for sidebars.
 */

/**
 * @param {{ label: string, value?: React.ReactNode }} props
 */
export default function Fact({ label, value }) {
  return (
    <div className="flex flex-col rounded-2xl p-3 bg-gradient-to-br from-white/80 to-white/60 border border-slate-200 shadow-sm">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-1 text-slate-900 font-semibold">{value ?? "—"}</span>
    </div>
  );
}

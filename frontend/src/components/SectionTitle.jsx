/** @file SectionTitle.jsx
 *  Page section heading with optional icon + subtitle pill.
 */

/**
 * @param {{ icon?: React.ReactNode, subtitle?: string, children: React.ReactNode }} props
 */
export default function SectionTitle({ icon, subtitle, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        {icon}
        {subtitle && (
          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
            {subtitle}
          </span>
        )}
      </div>
      <h1 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
        {children}
      </h1>
    </div>
  );
}

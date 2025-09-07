/** @file Pill.jsx
 *  Small rounded label used for inline meta facts.
 */

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function Pill({ children }) {
  return (
    <span className="px-3 py-1 rounded-full text-sm bg-gradient-to-br from-sky-50 to-blue-50 text-slate-700 border border-slate-200">
      {children}
    </span>
  );
}

/** @file GradientCard.jsx
 *  Gradient border card shell to ensure consistent framing across pages.
 */

/**
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export default function GradientCard({ children, className = "" }) {
  return (
    <div className={`rounded-3xl p-[1px] bg-gradient-to-br from-sky-400/40 via-blue-400/30 to-indigo-400/30 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${className}`}>
      <div className="rounded-3xl bg-white/90 backdrop-blur border border-white/60">
        {children}
      </div>
    </div>
  );
}

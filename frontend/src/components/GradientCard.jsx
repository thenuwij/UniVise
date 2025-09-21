/** @file GradientCard.jsx
 *  Gradient border card shell to ensure consistent framing across pages.
 */

export default function GradientCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl p-[1px] 
                  bg-gradient-to-br from-sky-400/40 via-blue-400/30 to-indigo-400/30 
                  dark:from-sky-500/20 dark:via-blue-500/20 dark:to-indigo-500/20
                  shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${className}`}
    >
      <div
        className="rounded-3xl bg-card backdrop-blur border border-border-light dark:border-border-medium transition-colors"
      >
        {children}
      </div>
    </div>
  );
}

export default function GradientCard({ children, className = "", plain = false, seamless = false }) {
  if (plain) {
    return (
      <div className={`rounded-3xl bg-card backdrop-blur transition-colors ${className}`}>
        {children}
      </div>
    );
  }

  if (seamless) {
    return (
      <div className={`rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur shadow-[0_4px_20px_rgb(0,0,0,0.04)] ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`rounded-3xl p-[1px] bg-gradient-to-br from-sky-400/40 via-blue-400/30 to-indigo-400/30 dark:from-sky-500/20 dark:via-blue-500/20 dark:to-indigo-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${className}`}>
      <div className="rounded-3xl bg-card backdrop-blur border border-border-light dark:border-border-medium transition-colors">
        {children}
      </div>
    </div>
  );
}

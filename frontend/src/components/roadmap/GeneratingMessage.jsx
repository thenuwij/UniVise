export default function GeneratingMessage({ title, message }) {
  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                    bg-white/70 dark:bg-slate-900/60 
                    p-6 text-center shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-center gap-3 text-slate-700 dark:text-slate-300">
        <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      {message && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{message}</p>
      )}
    </div>
  );
}

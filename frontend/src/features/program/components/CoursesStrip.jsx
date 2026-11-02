import { ListChecks } from "lucide-react";
import { UserAuth } from "@/app/AuthContext";
import { useUocProgress } from "../hooks/useUocProgress";

export default function CoursesStrip({ degreeCode, version, onOpen }) {
  const { session } = UserAuth();
  const progress = useUocProgress(degreeCode, session?.user?.id, version);
  const percent = progress?.minimum ? Math.min(100, Math.round((progress.uoc / progress.minimum) * 100)) : null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-4">
      <div className="min-w-[220px] flex-1">
        {progress?.count > 0 ? (
          <>
            <p className="text-sm leading-tight text-ink-muted">
              <strong className="text-base text-ink-strong">{progress.uoc}</strong>
              {progress.minimum ? ` of ${progress.minimum} UOC completed` : " UOC completed"}
            </p>
            {percent !== null && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Degree progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${percent}%` }} />
              </div>
            )}
          </>
        ) : (
          <p className="text-[15px] font-semibold text-ink-strong">Tell us what you've completed to get accurate suggestions.</p>
        )}
      </div>
      <button type="button" onClick={onOpen} data-tour="update-courses" className="button-primary inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white">
        <ListChecks className="h-4 w-4" aria-hidden="true" />
        Update my courses
      </button>
    </div>
  );
}

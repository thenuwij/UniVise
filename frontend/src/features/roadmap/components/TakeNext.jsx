import SaveButton from "@/shared/ui/SaveButton";
import { handbookUrl } from "@/shared/lib/handbook";
import { useState } from "react";
import { BriefcaseBusiness, ChevronDown, ExternalLink } from "lucide-react";
import SectionHeading from "@/shared/ui/SectionHeading";
import { useCoursePicks } from "@/features/mindmesh/hooks/useCoursePicks";

const pill = (active) =>
  `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-blue-600 text-white dark:bg-blue-500"
      : "bg-white text-ink-strong shadow-sm ring-1 ring-slate-300 hover:bg-slate-50 hover:ring-blue-400 dark:bg-slate-900 dark:ring-slate-600 dark:hover:bg-slate-800"
  }`;

function Message({ title, children, action }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-6 py-5 dark:bg-slate-800/50">
      <p className="text-lg font-semibold text-ink-strong">{title}</p>
      <p className="mt-1 text-[15px] text-ink-muted">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function PickRow({ pick, onOpenCourseMesh }) {
  const unlocks = pick.unlocks?.length || 0;
  const meta = [pick.core && "Core", unlocks > 0 && `Unlocks ${unlocks} course${unlocks === 1 ? "" : "s"}`].filter(Boolean).join(" · ");
  return (
    <li className="rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm ring-1 ring-slate-200 dark:from-slate-900 dark:to-slate-900/60 dark:ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-snug text-ink-strong">
            {pick.code} · {pick.name}
          </p>
          {meta && <p className="mt-0.5 text-sm text-ink-muted">{meta}</p>}
        </div>
        <SaveButton itemType="course" itemId={pick.code} itemName={`${pick.code} · ${pick.name}`} itemData={pick} />
      </div>
      {pick.skills?.length > 0 && (
        <p className="mt-3 text-[15px] text-ink-strong"><span className="text-ink-muted">Builds </span>{pick.skills.join(", ")}</p>
      )}
      {pick.careers?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pick.careers.map((name) => (
            <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" /> {name}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <button type="button" onClick={() => onOpenCourseMesh(pick.code)} className="text-link hover:underline">
          See in CourseMesh
        </button>
        <a href={handbookUrl("courses", pick.code)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-link hover:underline">
          Handbook <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}

export default function TakeNext({ isOwnProgram, onOpenCourses, onOpenCourseMesh }) {
  const { loading, picks, available, careers, completedCount, failed, retry } = useCoursePicks(isOwnProgram);
  const [career, setCareer] = useState(null);

  if (!isOwnProgram) {
    return (
      <Message title="Make this your program first">
        Next courses suggests courses from your own program, based on the courses you've ticked.
      </Message>
    );
  }
  if (loading) {
    return (
      <div role="status" className="space-y-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full w-1/3 animate-loading-slide rounded-full bg-blue-500" />
        </div>
        <p className="text-[15px] text-ink-muted">Finding the courses you can take next and how they fit your careers.</p>
      </div>
    );
  }
  if (failed) {
    return (
      <Message
        title="Couldn't load your suggestions"
        action={<button type="button" onClick={retry} className="text-sm font-semibold text-link hover:underline">Try again</button>}
      >
        Your ticked courses are safe. Try again in a moment.
      </Message>
    );
  }
  const updateCourses = (
    <button type="button" onClick={onOpenCourses} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
      Update my courses
    </button>
  );
  if (!completedCount) {
    return (
      <Message title="Tick the courses you've done" action={updateCourses}>
        Next courses works out what you can take from your completed courses, then shows how each one fits your careers.
      </Message>
    );
  }
  if (!available.length) {
    return (
      <Message title="No courses open right now" action={updateCourses}>
        Every course in your program either needs a prerequisite you haven't ticked or is already done.
      </Message>
    );
  }

  const shown = career ? picks.filter((p) => p.careers?.includes(career)) : picks;
  const pickCodes = new Set(picks.map((p) => p.code));
  const others = available.filter((c) => !pickCodes.has(c.code));

  return (
    <div>
      <SectionHeading subtitle={`${available.length} course${available.length === 1 ? "" : "s"} open to you. Ranked by fit with your careers.`}>
        Top picks for you
      </SectionHeading>
      {careers.length > 0 && (
        <div className="mt-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by career">
            <button type="button" className={pill(!career)} aria-pressed={!career} onClick={() => setCareer(null)}>All careers</button>
            {careers.map((name) => (
              <button key={name} type="button" className={pill(career === name)} aria-pressed={career === name} onClick={() => setCareer(name)}>
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" /> {name}
              </button>
            ))}
          </div>
        </div>
      )}
      {shown.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {shown.map((pick) => (
            <PickRow key={pick.code} pick={pick} onOpenCourseMesh={onOpenCourseMesh} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-[15px] text-ink-muted">None of your top picks link to {career} yet. Try All careers or look through the full list below.</p>
      )}
      {others.length > 0 && (
        <details className="group mt-6">
          <summary className="cursor-pointer list-none inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[15px] font-semibold text-link shadow-sm ring-1 ring-slate-300 hover:bg-slate-50 hover:ring-blue-400 dark:bg-slate-900 dark:ring-slate-600 dark:hover:bg-slate-800 transition-colors">
            <span>
              <span className="group-open:hidden">Show</span><span className="hidden group-open:inline">Hide</span> {others.length} other course{others.length === 1 ? "" : "s"} you can take
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
            {others.map((course) => (
              <li key={course.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-[15px] text-ink-strong">
                  {course.code} · {course.name}
                  {course.core && <span className="ml-2 text-sm text-ink-muted">Core</span>}
                </span>
                <div className="ml-auto flex flex-wrap justify-end gap-x-5 gap-y-2 text-sm font-semibold">
                  <button type="button" onClick={() => onOpenCourseMesh(course.code)} className="text-link hover:underline">
                    See in CourseMesh
                  </button>
                  <a href={handbookUrl("courses", course.code)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-link hover:underline">
                    Handbook <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

import { useState } from "react";
import { ExternalLink, Network } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import SectionHeading from "@/shared/ui/SectionHeading";
import { useCoursePicks } from "@/features/mindmesh/hooks/useCoursePicks";

const HANDBOOK_COURSE_URL = "https://www.handbook.unsw.edu.au/undergraduate/courses/2026";

const USEFULNESS = {
  high: { label: "Highly useful", className: "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200" },
  medium: { label: "Useful", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  general: { label: "Degree requirement", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

const pill = (active) =>
  `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-blue-600 text-white dark:bg-blue-500"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
  const usefulness = USEFULNESS[pick.usefulness] || USEFULNESS.general;
  const facts = [
    pick.skills?.length ? `Skills: ${pick.skills.join(", ")}` : null,
    pick.careers?.length ? `Careers: ${pick.careers.join(", ")}` : null,
  ].filter(Boolean);
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-lg font-semibold text-ink-strong leading-snug">
          {pick.code} · {pick.name}
        </p>
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${usefulness.className}`}>{usefulness.label}</span>
      </div>
      <p className="mt-1.5 text-[15px] text-slate-700 dark:text-slate-300">{pick.reason}</p>
      {facts.map((fact) => (
        <p key={fact} className="mt-1 text-sm text-ink-muted">{fact}</p>
      ))}
      <p className="mt-1 text-sm text-ink-muted">
        Prerequisites met{pick.unlocks?.length ? ` · Unlocks ${pick.unlocks.map((u) => u.code).join(", ")}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <button type="button" onClick={() => onOpenCourseMesh(pick.code)} className="inline-flex items-center gap-1.5 text-link hover:underline">
          <Network className="h-4 w-4" aria-hidden="true" /> See in CourseMesh
        </button>
        <a href={`${HANDBOOK_COURSE_URL}/${pick.code}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-link hover:underline">
          Handbook <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}

export default function TakeNext({ isOwnProgram, onOpenCourses, onOpenCourseMesh }) {
  const { loading, picks, available, careers, completedCount, failed, retry } = useCoursePicks(isOwnProgram);
  const [career, setCareer] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (!isOwnProgram) {
    return (
      <Message title="Make this your program first">
        Take next suggests courses from your own program, based on the courses you've ticked.
      </Message>
    );
  }
  if (loading) {
    return (
      <div role="status" className="space-y-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
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
        Take next works out what you can take next from your completed courses, then shows how each one fits your careers.
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
      <SectionHeading subtitle={`You can take ${available.length} course${available.length === 1 ? "" : "s"} next. These fit your careers best.`}>
        Take next
      </SectionHeading>
      {careers.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by career">
          <button type="button" className={pill(!career)} aria-pressed={!career} onClick={() => setCareer(null)}>All careers</button>
          {careers.map((name) => (
            <button key={name} type="button" className={pill(career === name)} aria-pressed={career === name} onClick={() => setCareer(name)}>
              {name}
            </button>
          ))}
        </div>
      )}
      {shown.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {shown.map((pick) => (
            <PickRow key={pick.code} pick={pick} onOpenCourseMesh={onOpenCourseMesh} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-[15px] text-ink-muted">None of your top picks link to {career} yet. Try All careers or look through the full list below.</p>
      )}
      {others.length > 0 && (
        <div className="mt-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <ExpandToggle plain open={showAll} onClick={() => setShowAll(!showAll)}>
            {showAll ? "Hide the other courses" : `Show the other ${others.length} course${others.length === 1 ? "" : "s"} you can take`}
          </ExpandToggle>
          {showAll && (
            <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
              {others.map((course) => (
                <li key={course.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-[15px] text-ink-strong">{course.code} · {course.name}</span>
                  <button type="button" onClick={() => onOpenCourseMesh(course.code)} className="text-sm font-semibold text-link hover:underline">
                    See in CourseMesh
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-5 py-4 dark:bg-slate-800/50">
        <p className="text-[15px] text-ink-muted">Missing a course you've finished? These suggestions follow your ticks.</p>
        <button type="button" onClick={onOpenCourses} className="text-sm font-semibold text-link hover:underline">Update my courses</button>
      </div>
    </div>
  );
}

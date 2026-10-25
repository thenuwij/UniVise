import SaveButton from "@/shared/ui/SaveButton";
import { handbookUrl } from "@/shared/lib/handbook";
import { useState } from "react";
import { BriefcaseBusiness, CircleCheck, ExternalLink, Network, Wrench } from "lucide-react";
import SectionHeading from "@/shared/ui/SectionHeading";
import { SubLabel } from "@/features/careers/components/CareersSection";
import { useCoursePicks } from "@/features/mindmesh/hooks/useCoursePicks";



const badge = "rounded-md px-2.5 py-1 text-xs font-semibold";

const pill = (active) =>
  `rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
    active
      ? "bg-blue-600 text-white ring-1 ring-blue-600 dark:bg-blue-500 dark:ring-blue-500"
      : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-blue-50 hover:ring-blue-300 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800"
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
  return (
    <li className="py-7">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-lg font-semibold leading-snug text-ink-strong">
          {pick.code} · {pick.name}
        </p>
        <div className="flex flex-wrap gap-2">
          <SaveButton itemType="course" itemId={pick.code} itemName={`${pick.code} · ${pick.name}`} itemData={pick} />
          {pick.core && <span className={`${badge} bg-white text-slate-900 ring-1 ring-slate-900 dark:bg-slate-900 dark:text-white dark:ring-white`}>Core</span>}
          {pick.usefulness === "high" && <span className={`${badge} bg-slate-900 text-white dark:bg-white dark:text-slate-900`}>Highly useful</span>}
        </div>
      </div>
      <p className="mt-2.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{pick.reason}</p>
      {(pick.skills?.length > 0 || pick.careers?.length > 0) && (
        <dl className="mt-4 space-y-2 rounded-xl bg-gradient-to-br from-white to-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 dark:from-slate-900 dark:to-slate-800/60 dark:ring-slate-800">
          {pick.skills?.length > 0 && (
            <div className="flex gap-2">
              <dt className="flex w-20 flex-shrink-0 items-center gap-1.5 text-ink-muted"><Wrench className="h-4 w-4" aria-hidden="true" /> Skills</dt>
              <dd className="text-ink-strong">{pick.skills.join(" · ")}</dd>
            </div>
          )}
          {pick.careers?.length > 0 && (
            <div className="flex gap-2">
              <dt className="flex w-20 flex-shrink-0 items-center gap-1.5 text-ink-muted"><BriefcaseBusiness className="h-4 w-4" aria-hidden="true" /> Careers</dt>
              <dd className="text-ink-strong">{pick.careers.join(" · ")}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-ink-muted">
          <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
          Prerequisites met
          {pick.unlocks?.length > 0 && (
            <>
              {" "}· Unlocks{" "}
              {pick.unlocks.map((u, i) => (
                <span key={u.code}>
                  <a href={handbookUrl("courses", u.code)} target="_blank" rel="noopener noreferrer" title={`${u.name} in the UNSW Handbook`} className="underline decoration-slate-400 underline-offset-2 hover:text-ink-strong hover:decoration-slate-600">
                    {u.code}
                  </a>
                  {i < pick.unlocks.length - 1 ? ", " : ""}
                </span>
              ))}
            </>
          )}
        </span>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          <button type="button" onClick={() => onOpenCourseMesh(pick.code)} className="inline-flex items-center gap-1.5 font-semibold text-link hover:underline">
            <Network className="h-4 w-4" aria-hidden="true" /> See in CourseMesh
          </button>
          <a href={handbookUrl("courses", pick.code)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-link hover:underline">
            Handbook <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
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
      <SectionHeading subtitle={`You can take ${available.length} course${available.length === 1 ? "" : "s"} next. These fit your careers best.`}>
        What to take next
      </SectionHeading>
      {careers.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-ink-strong">Show courses for</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by career">
            <button type="button" className={pill(!career)} aria-pressed={!career} onClick={() => setCareer(null)}>All careers</button>
            {careers.map((name) => (
              <button key={name} type="button" className={pill(career === name)} aria-pressed={career === name} onClick={() => setCareer(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8">
        <SubLabel hint={career ? `Picks that help you become a ${career}` : "Ranked by how well they fit your careers"}>Top picks for you</SubLabel>
      </div>
      {shown.length > 0 ? (
        <ul className="mt-1 divide-y divide-slate-200 dark:divide-slate-800">
          {shown.map((pick) => (
            <PickRow key={pick.code} pick={pick} onOpenCourseMesh={onOpenCourseMesh} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-[15px] text-ink-muted">None of your top picks link to {career} yet. Try All careers or look through the full list below.</p>
      )}
      {others.length > 0 && (
        <div className="mt-10">
          <SubLabel hint="Also open to you now, with prerequisites met">Other courses you can take</SubLabel>
          <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
            {others.map((course) => (
              <li key={course.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-[15px] text-ink-strong">
                  {course.code} · {course.name}
                  {course.core && <span className={`${badge} ml-2 bg-white text-slate-900 ring-1 ring-slate-900 dark:bg-slate-900 dark:text-white dark:ring-white`}>Core</span>}
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
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-5 py-4 dark:bg-slate-800/50">
        <p className="text-[15px] text-ink-muted">Missing a course you've finished? These suggestions follow your ticks.</p>
        {updateCourses}
      </div>
    </div>
  );
}

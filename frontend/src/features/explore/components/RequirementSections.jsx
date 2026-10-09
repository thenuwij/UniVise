import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FormattedText from "@/shared/ui/FormattedText";
import ExpandIcon from "@/shared/ui/ExpandIcon";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import { card } from "@/shared/ui/cardStyles";
import { hasContent } from "@/shared/lib/format";
import { tidySections } from "@/features/roadmap/utils/myCourses";
import { courseTile, staticTile } from "./DetailLayout";

const sumUoc = (courses = []) => courses.reduce((sum, c) => sum + (Number(c?.uoc) || 0), 0);

function CourseTile({ course, known }) {
  const linked = !!course.code && (!known || known.has(course.code));
  const body = (
    <div className={linked ? courseTile : staticTile}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`text-sm font-bold flex-shrink-0 ${linked ? "text-link" : "text-ink-muted"}`}>{course.code}</span>
        <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{course.name}</span>
      </div>
      {course.uoc > 0 && (
        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
          {course.uoc} UOC
        </span>
      )}
    </div>
  );
  return linked ? <Link to={`/course/${course.code}`}>{body}</Link> : body;
}

function byList(courses) {
  const lists = new Map();
  for (const course of courses) lists.set(course.list || "", [...(lists.get(course.list || "") || []), course]);
  return [...lists];
}

export default function RequirementSections({ sections: raw, known }) {
  const sections = useMemo(() => tidySections(raw), [raw]);
  const [open, setOpen] = useState(() => new Set([0]));
  const allOpen = open.size === sections.length;

  const toggle = (i) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="space-y-3">
      {sections.length > 1 && (
        <div className="flex justify-end">
          <ExpandToggle open={allOpen} onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((_, i) => i)))}>
            {allOpen ? "Collapse all" : "Expand all"}
          </ExpandToggle>
        </div>
      )}
      {sections.map((section, i) => {
        const isOpen = open.has(i);
        const count = section.courses?.length || 0;
        const uoc = section.uoc || sumUoc(section.courses);
        const summary = [count && `${count} ${count === 1 ? "course" : "courses"}`, uoc && `${uoc} UOC`].filter(Boolean).join(" · ");
        return (
          <div key={i} className={`${card} overflow-hidden`}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="group w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-blue-50/60 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-base font-semibold text-ink-strong">{section.title}</span>
                {summary && <span className="mt-0.5 block text-sm text-ink-muted">{summary}</span>}
              </span>
              <ExpandIcon open={isOpen} />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-4 border-t border-line space-y-3">
                {hasContent(section.description) && (
                  <FormattedText text={section.description} collapsedHeight="7rem" className="text-sm text-ink-muted" />
                )}
                {hasContent(section.notes) && (
                  <div className="p-3 rounded-xl bg-pick-soft">
                    <FormattedText text={`Note: ${section.notes}`} collapsedHeight={null} className="text-sm text-pick-ink" />
                  </div>
                )}
                {byList(section.courses || []).map(([list, courses]) => (
                  <div key={list || "courses"}>
                    {list && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">{list}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {courses.map((course, ci) => (
                        <CourseTile key={course.code || ci} course={course} known={known} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { ArrowRight, Check, ChevronDown, CircleCheck, Info, Plus } from "lucide-react";
import { hasContent } from "@/shared/lib/format";
import { canCheckRules, matchesRule, ruleCheck, sectionRules } from "../utils/myCourses";

export function ChooseSpecialisationNotice({ handbookUrl }) {
  return (
    <div className="course-checklist-notice">
      <Info aria-hidden="true" className="h-4 w-4 shrink-0" />
      <div>
        <p>Most of this program's courses sit inside its majors or streams. Choose a specialisation above to see its courses here and in CourseMesh.</p>
        <a href={handbookUrl} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">View the full structure in the UNSW Handbook</a>
      </div>
    </div>
  );
}

export function ProgressStrip({ ticked, total, uoc, minimum, onOpen, disabled }) {
  const pct = minimum ? Math.min(100, Math.round((uoc / minimum) * 100)) : total ? Math.round((ticked / total) * 100) : 0;
  return (
    <div className="course-checklist-progress">
      <div className="course-checklist-progress-heading">
        <p>{minimum ? <><strong>{uoc}</strong> of {minimum} UOC completed</> : <><strong>{ticked}</strong> of {total} courses ticked · {uoc} UOC</>}</p>
        <button type="button" onClick={onOpen} disabled={disabled} data-tour="coursemesh-strip" className="course-checklist-link">
          What's next in CourseMesh <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="course-checklist-progress-track" role="progressbar" aria-label="Recorded degree completion" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="course-checklist-hint">Tick the courses you've completed.</p>
    </div>
  );
}

export function GroupHeader({ group, action, divider = false }) {
  const label = group.type === "Program" ? "Program requirements" : group.type === "Honours" ? "Honours specialisation" : group.type;
  return (
    <div className={`course-checklist-group-heading${divider ? " course-checklist-divider" : ""}`}>
      <div className="min-w-0">
        <h3>{divider && group.type === "Program" ? "Program requirements" : group.name || "Your program"}</h3>
        <p>{divider && group.type === "Program" ? group.name : label}{group.uoc ? ` · ${group.uoc} UOC` : ""}</p>
      </div>
      {action}
    </div>
  );
}

export function MinorControls({ uoc, options, value, saving, onChange }) {
  return (
    <div className="course-checklist-minor-controls" id="course-checklist-minor-controls">
      <span>Optional minor{uoc ? ` · ${uoc} UOC` : ""}</span>
      {options.length ? (
        <label>
          <span className="sr-only">Choose a minor</span>
          <select value={value || ""} disabled={saving} onChange={(event) => onChange(event.target.value)}>
            <option value="">No minor</option>
            {options.map((minor) => <option key={minor.id} value={minor.id}>{minor.major_name}</option>)}
          </select>
        </label>
      ) : <p>No minors are listed for your program in the Handbook.</p>}
      {saving && <span role="status">Saving…</span>}
    </div>
  );
}

export function RuleLine({ section, rows }) {
  const check = rows ? ruleCheck(section, rows) : null;
  const Icon = check?.met ? CircleCheck : Info;
  return (
    <div className="course-checklist-note">
      <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${check?.met ? "text-green-700 dark:text-green-400" : "text-ink-muted"}`} />
      <div>
        <p className="font-medium text-ink-strong">{section.title}</p>
        {check ? <p>{check.have} of {check.need} UOC at level {check.level} or above{check.met ? ", rule met" : ""}</p> : hasContent(section.description) && <p>{section.description}</p>}
      </div>
    </div>
  );
}

export function UnlistedLine({ section }) {
  return (
    <div className="course-checklist-note">
      <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
      <div>
        <p className="font-medium text-ink-strong">{section.title} · {section.uoc} UOC</p>
        <p>The course list for this isn't in UniVise yet. Check the Handbook for the courses that count.</p>
      </div>
    </div>
  );
}

function DoneCheck({ done, code, onClick, tour }) {
  return (
    <button type="button" onClick={onClick} role="checkbox" aria-checked={done} aria-label={`${code} done`} data-tour={tour ? "course-tick" : undefined} className="course-checklist-completion">
      <span className={done ? "is-complete" : ""}><Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} /></span>
    </button>
  );
}

function AddToggle({ added, onClick }) {
  const Icon = added ? Check : Plus;
  return (
    <button type="button" onClick={onClick} aria-pressed={added} className={`course-checklist-add-toggle${added ? " is-added" : ""}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />{added ? "Added" : "Add"}
    </button>
  );
}

function SectionProgress({ progress }) {
  const { done, total, unit } = progress;
  if (total > 0 && done >= total) return <span className="course-checklist-section-count is-complete"><Check aria-hidden="true" className="h-4 w-4" />All done</span>;
  return <span className="course-checklist-section-count">{unit ? `${done} of ${total} ${unit}` : total ? `${done} of ${total} completed` : "None picked yet"}</span>;
}

export function CourseSection({ section, isOpen, onToggle, onCourseClick, completed, progress, onToggleDone, options, added, notNeeded, onToggleAdded, onAdd, rules = [], ruleRows }) {
  const count = section.courses?.length || 0;
  const total = section.uoc ?? (section.courses || []).reduce((sum, course) => sum + (Number(course.uoc) || 0), 0);
  const listedCount = section.courses?.filter((course) => !course.extra).length || 0;
  const patterns = section.elective ? sectionRules(section) : [];
  const meta = section.open
    ? `${count} added · needs ${section.uoc} UOC`
    : section.elective && Number(section.uoc) > 0
      ? `${listedCount} listed${count > listedCount ? ` · ${count - listedCount} added` : ""} · needs ${section.uoc} UOC`
      : `${count} ${count === 1 ? "course" : "courses"} · ${total} UOC`;

  return (
    <div className="course-checklist-section">
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className="course-checklist-section-toggle">
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${isOpen ? "" : "-rotate-90"}`} />
        <span className="min-w-0"><span className="course-checklist-section-title">{section.title}</span><span className="course-checklist-section-meta">{meta}</span></span>
        {progress && <SectionProgress progress={progress} />}
      </button>
      {isOpen && (
        <div className="course-checklist-section-body">
          <div className="course-checklist-course-list">
            {section.courses?.map((course, index) => (
              <div key={course.code || index} className={`course-checklist-course-row${notNeeded?.has(course.code) ? " is-not-needed" : ""}`}>
                {onToggleDone && <DoneCheck done={!!completed?.[course.code]?.is_completed} code={course.code} tour onClick={() => onToggleDone(course, section.title)} />}
                <div className="course-checklist-course-copy">
                  <button type="button" onClick={() => onCourseClick?.(course)} className="course-checklist-course-details">
                    <span className="course-checklist-course-code">{course.code}</span><span className="course-checklist-course-name">{course.name}</span>
                  </button>
                  {notNeeded?.has(course.code) && <span className="text-xs font-medium text-ink-muted">Not needed</span>}
                  {course.list && <span className="block text-xs text-ink-muted">{course.list}</span>}
                  {course.extra && section.elective && (!patterns.length || canCheckRules(patterns)) && !matchesRule(course.code, patterns) && <span className="block text-xs font-medium text-amber-700 dark:text-amber-400">Not on the Handbook list. Check with your school.</span>}
                </div>
                {course.uoc != null && course.uoc !== "" && <span className="course-checklist-course-uoc">{course.uoc} UOC</span>}
                {onToggleAdded && options?.has(course.code) && (section.open || !completed?.[course.code]?.is_completed) && <AddToggle added={added.has(course.code)} onClick={() => onToggleAdded(course)} />}
              </div>
            ))}
          </div>
          {(section.open || section.elective) && count === 0 && (
            <p className="course-checklist-empty">{section.open && !onAdd ? `${section.note || "Any approved UNSW course"}.` : section.open ? `No courses here yet. Add the courses you've taken or plan to take for ${section.title}.` : "The Handbook data doesn't list courses for this. Add the courses you take and check the rule with your school."}</p>
          )}
          {onAdd && <button type="button" onClick={onAdd} className="course-checklist-link course-checklist-add-course"><Plus aria-hidden="true" className="h-4 w-4" />Add a course to {section.title}</button>}
          {rules.map((rule) => <RuleLine key={rule.title} section={rule} rows={ruleRows} />)}
        </div>
      )}
    </div>
  );
}

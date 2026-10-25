import { useEffect, useState } from "react";
import {
  Bookmark,
  CalendarDays,
  Check,
  ExternalLink,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  availabilityOf,
  categoryOf,
  CATEGORIES,
  destinationOf,
  PLANNING_STATES,
  planningOf,
  snapshotOf,
  sydneyDate,
  titleOf,
} from "../utils/shortlist";

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-strong focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function SavedItemCard({ item, now, onUpdate, onRemove }) {
  const data = snapshotOf(item);
  const plan = planningOf(item);
  const availability = availabilityOf(item, now);
  const title = titleOf(item);
  const category = categoryOf(item);
  const href = destinationOf(item);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(item.personal_notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  useEffect(() => {
    if (!editing) setNotes(item.personal_notes || "");
  }, [item.personal_notes, editing]);

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch {
      setError("Couldn't save this change. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const updatePlan = (change) =>
    run(() =>
      onUpdate(item.id, {
        item_data: { ...data, _shortlist: { ...plan, ...change } },
      }),
    );
  const saveNotes = () =>
    run(async () => {
      await onUpdate(item.id, { personal_notes: notes.trim() });
      setEditing(false);
    });
  const expired = availability.state === "expired";
  const meta = [
    data.organisation || data.company || data.provider || data.faculty,
    data.location,
    data.code || data.degree_code || data.major_code,
  ].filter(Boolean);
  const description =
    data.why ||
    data.reason ||
    data.summary ||
    data.description ||
    data.why_join ||
    data.relevance ||
    data.overview_description;
  const details = [
    data.time || data.timeline || data.duration,
    data.cost,
    data.application_period && `Usually opens ${data.application_period}`,
    data.date_label,
    data.salary_range,
  ].filter((value) => typeof value === "string" && value);
  const savedDate = Number.isFinite(Date.parse(item.saved_at))
    ? new Date(item.saved_at).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Australia/Sydney",
      })
    : "earlier";
  const moreDetails = [
    ["Careers this supports", data.careers],
    ["Requirements", data.requirements || data.eligibility],
    ["Progression", data.career_progression],
    ["Suggested timing", data.when],
    ["Level", data.level],
    ["Activities", data.key_activities],
    ["Membership benefits", data.membership_benefits],
    ["Additional notes", data.notes],
  ]
    .map(([label, value]) => [
      label,
      Array.isArray(value)
        ? value.filter((part) => typeof part === "string").join(" · ")
        : value,
    ])
    .filter(([, value]) => typeof value === "string" && value.trim());
  const overdue =
    plan.target_date &&
    plan.target_date < sydneyDate(now) &&
    plan.status !== "done";
  const canClose =
    ["jobs", "internships", "networking"].includes(category) &&
    item.item_type !== "calendar";

  return (
    <article
      className={`flex min-w-0 flex-col rounded-2xl border bg-surface p-5 ${expired ? "border-amber-300 dark:border-amber-800" : "border-line"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {CATEGORIES[category]}
        </span>
        {availability.label && (
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${expired ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
          >
            {availability.label}
          </span>
        )}
      </div>
      <h2 className="mt-3 break-words text-lg font-bold leading-snug text-ink-strong">
        {title}
      </h2>
      {meta.length > 0 && (
        <p className="mt-1 text-sm text-ink-muted">{meta.join(" · ")}</p>
      )}
      {typeof description === "string" && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink">
          {description}
        </p>
      )}
      {details.length > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          {details.join(" · ")}
        </p>
      )}
      {Array.isArray(data.skills || data.key_skills) && (
        <p className="mt-2 text-xs text-ink-muted">
          Skills: {(data.skills || data.key_skills).join(" · ")}
        </p>
      )}
      {availability.reason && (
        <p
          className={`mt-3 text-xs leading-relaxed ${expired ? "text-amber-800 dark:text-amber-200" : "text-ink-muted"}`}
        >
          {availability.deadline && !expired
            ? `${availability.label}: ${availability.deadline}. Check the source for current details.`
            : availability.reason}
        </p>
      )}
      {moreDetails.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-link">
            Saved details
          </summary>
          <dl className="mt-3 space-y-2">
            {moreDetails.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold text-ink-muted">
                  {label}
                </dt>
                <dd className="mt-0.5 leading-relaxed text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold">
        {href && (
          <a
            href={href}
            target={href.startsWith("/") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-link hover:underline"
          >
            {["courses", "programs"].includes(category)
              ? "UNSW Handbook"
              : item.item_type === "career_path"
                ? "Career outlook"
                : "Open saved link"}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
        {canClose && (
          <button
            type="button"
            disabled={busy}
            onClick={() => updatePlan({ closed: !plan.closed })}
            className="text-xs text-ink-muted underline-offset-2 hover:underline disabled:opacity-50"
          >
            {plan.closed ? "Clear closed marker" : "Mark closed"}
          </button>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
        <label className="min-w-0 text-xs font-semibold text-ink-muted">
          Plan status
          <select
            aria-label={`Plan status for ${title}`}
            value={plan.status}
            disabled={busy}
            onChange={(event) => updatePlan({ status: event.target.value })}
            className={`${input} mt-1.5`}
          >
            {Object.entries(PLANNING_STATES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-xs font-semibold text-ink-muted">
          Target date
          <input
            aria-label={`Target date for ${title}`}
            type="date"
            value={plan.target_date}
            disabled={busy}
            onChange={(event) =>
              updatePlan({ target_date: event.target.value })
            }
            className={`${input} mt-1.5 min-w-0`}
          />
        </label>
      </div>
      {overdue && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-200">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Your target date has passed.
        </p>
      )}
      <div className="mt-4">
        {editing ? (
          <div>
            <label
              className="text-xs font-semibold text-ink-muted"
              htmlFor={`notes-${item.id}`}
            >
              Your next steps or notes
            </label>
            <textarea
              id={`notes-${item.id}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              rows={4}
              className={`${input} mt-1.5 resize-y`}
              placeholder="What interests you? What will you do next?"
              disabled={busy}
              autoFocus
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-ink-muted">
                {notes.length}/2000
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing(false)}
                  className="text-xs text-ink-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveNotes}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-link disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {busy ? "Saving…" : "Save notes"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {item.personal_notes && (
              <p className="mb-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-ink dark:bg-slate-800">
                {item.personal_notes}
              </p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-link"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {item.personal_notes ? "Edit notes" : "Add notes & next steps"}
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          Saved {savedDate}
        </span>
        {confirmRemove ? (
          <div className="flex items-center gap-2">
            <span>Remove item and notes?</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => onRemove(item.id))}
              className="font-semibold text-red-700 dark:text-red-300"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              aria-label="Cancel removal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="inline-flex items-center gap-1 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Remove
          </button>
        )}
      </div>
    </article>
  );
}

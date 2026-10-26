import { useEffect, useState } from "react";
import { Check, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { availabilityOf, destinationOf, snapshotOf, titleOf } from "../utils/shortlist";
import { sectionOf, trackedData, trackOf } from "../utils/sections";

const control =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-strong focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50";
const toggle = (on) =>
  `inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
    on
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900"
      : "bg-surface text-ink-strong ring-1 ring-line hover:ring-blue-400"
  }`;

const formatDay = (day) =>
  day ? new Date(`${day}T12:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "";

function CourseControl({ code, course }) {
  if (!course?.ready) return null;
  if (course.completed(code)) {
    return <span className={toggle(true)}><Check className="h-4 w-4" aria-hidden="true" /> Completed</span>;
  }
  if (course.inPlan(code)) {
    return <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">In My courses</span>;
  }
  return (
    <button type="button" disabled={!!course.saving} onClick={course.add} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400">
      <Plus className="h-4 w-4" aria-hidden="true" /> {course.saving === code ? "Adding..." : "Add to My courses"}
    </button>
  );
}

export default function SavedRow({ item, now, onUpdate, onRemove, course }) {
  const data = snapshotOf(item);
  const section = sectionOf(item);
  const track = trackOf(item);
  const title = titleOf(item);
  const href = destinationOf(item);
  const availability = availabilityOf(item, now);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(item.personal_notes || "");
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
  const update = (change) => run(() => onUpdate(item.id, { item_data: trackedData(item, change, now) }));

  const detail = [
    data.organisation || data.company || data.provider || data.faculty,
    data.location,
    section.key === "courses" || section.key === "programs" ? data.code || data.degree_code || data.major_code : null,
    availability.state === "expired" ? (section.key === "events" ? "Past event" : "Closed") : availability.deadline ? `${availability.label} ${formatDay(availability.deadline)}` : null,
    section.key === "jobs" && track.applied_at ? `Applied ${formatDay(track.applied_at)}` : null,
  ].filter(Boolean);

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-[17px] font-semibold leading-snug text-ink-strong">{title}</p>
          {detail.length > 0 && <p className="mt-0.5 text-sm text-ink-muted">{detail.join(" · ")}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {section.statuses && (
            <select aria-label={`Status for ${title}`} value={track.status} disabled={busy} onChange={(e) => update({ status: e.target.value })} className={control}>
              {Object.entries(section.statuses).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}
          {section.key === "certifications" && (
            <input type="date" aria-label={`Exam or target date for ${title}`} title="Exam or target date" value={track.target_date} disabled={busy} onChange={(e) => update({ target_date: e.target.value })} className={control} />
          )}
          {section.key === "events" && item.item_type !== "calendar" && (
            <button type="button" aria-pressed={track.going} disabled={busy} onClick={() => update({ going: !track.going })} className={toggle(track.going)}>
              {track.going && <Check className="h-4 w-4" aria-hidden="true" />} Going
            </button>
          )}
          {section.key === "communities" && (
            <button type="button" aria-pressed={track.joined} disabled={busy} onClick={() => update({ joined: !track.joined })} className={toggle(track.joined)}>
              {track.joined && <Check className="h-4 w-4" aria-hidden="true" />} Joined
            </button>
          )}
          {section.key === "courses" && <CourseControl code={data.code || item.item_id} course={course} />}
        </div>
      </div>

      {item.personal_notes && !editing && (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{item.personal_notes}</p>
      )}
      {editing && (
        <div className="mt-3">
          <textarea
            aria-label={`Notes for ${title}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={3}
            className={`${control} w-full resize-y`}
            placeholder="Next steps, contacts, what to prepare"
            disabled={busy}
            autoFocus
          />
          <div className="mt-2 flex gap-4 text-sm font-semibold">
            <button type="button" disabled={busy} onClick={() => run(async () => { await onUpdate(item.id, { personal_notes: notes.trim() }); setEditing(false); })} className="text-link disabled:opacity-50">
              {busy ? "Saving..." : "Save notes"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-ink-muted">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
        {href && (
          <a href={href} target={href.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-link hover:underline">
            {section.key === "courses" || section.key === "programs" ? "Handbook" : section.key === "careers" ? "Career outlook" : "Open"}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
        {section.key === "jobs" && (
          <button type="button" disabled={busy} onClick={() => update({ closed: !track.closed })} className="text-ink-muted hover:underline disabled:opacity-50">
            {track.closed ? "Clear closed" : "Mark closed"}
          </button>
        )}
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-link hover:underline">
            {item.personal_notes ? "Edit notes" : "Add notes"}
          </button>
        )}
        {confirmRemove ? (
          <span className="inline-flex items-center gap-2 font-normal text-ink-muted">
            Remove this and its notes?
            <button type="button" disabled={busy} onClick={() => run(() => onRemove(item.id))} className="font-semibold text-red-700 dark:text-red-300">Remove</button>
            <button type="button" onClick={() => setConfirmRemove(false)} aria-label="Cancel removal"><X className="h-4 w-4" /></button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmRemove(true)} className="inline-flex items-center gap-1 text-ink-muted hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </li>
  );
}

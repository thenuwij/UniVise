import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Award, BookOpen, Bookmark, BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, GraduationCap, Route, Search, Users } from "lucide-react";
import AppNav from "@/shared/layout/AppNav";
import PageHeader from "@/shared/layout/PageHeader";
import { UserAuth } from "@/app/AuthContext";
import { filterPill } from "@/shared/ui/cardStyles";
import { useEnrolledProgram } from "@/features/program/hooks/useEnrolledProgram";
import { usePlanCourses } from "@/features/program/hooks/usePlanCourses";
import { fetchCompletedCourses } from "@/features/program/utils/completedCourses";
import { listSavedItems, removeSavedItem, updateSavedItem } from "../api";
import SavedRow from "../components/SavedRow";
import { deadlineOf, snapshotOf, titleOf } from "../utils/shortlist";
import { isPastEvent, SECTIONS, sectionByKey, sectionOf, sectionSummary, trackOf } from "../utils/sections";

const SEARCH_FROM = 7;
const ICONS = { jobs: BriefcaseBusiness, certifications: Award, courses: BookOpen, events: CalendarDays, careers: Route, programs: GraduationCap, communities: Users, other: Bookmark };
const card = "rounded-2xl bg-gradient-to-br from-white to-blue-50/70 shadow-sm ring-1 ring-slate-200 dark:from-slate-900 dark:to-blue-950/40 dark:ring-slate-800";

function filtersFor(section, courseStatus) {
  if (section.statuses) return Object.entries(section.statuses).map(([key, label]) => ({ key, label, test: (item) => trackOf(item).status === key }));
  if (section.key === "events") return [{ key: "going", label: "Going", test: (item) => trackOf(item).going }, { key: "not_going", label: "Not going", test: (item) => !trackOf(item).going }];
  if (section.key === "communities") return [{ key: "joined", label: "Joined", test: (item) => trackOf(item).joined }, { key: "not_joined", label: "Not joined", test: (item) => !trackOf(item).joined }];
  if (section.key === "courses") {
    const codeOf = (item) => snapshotOf(item).code || item.item_id;
    const status = (item) => courseStatus(item);
    return [
      { key: "completed", label: "Completed", test: (item) => status(item).completed(codeOf(item)) },
      { key: "in_plan", label: "In My courses", test: (item) => !status(item).completed(codeOf(item)) && status(item).inPlan(codeOf(item)) },
      { key: "not_in_plan", label: "Not in My courses", test: (item) => !status(item).completed(codeOf(item)) && !status(item).inPlan(codeOf(item)) },
    ];
  }
  return [];
}

function useCourseStatus(userId, enabled) {
  const { program } = useEnrolledProgram();
  const plan = usePlanCourses(enabled ? program?.degree_code : null, userId);
  const [completed, setCompleted] = useState(null);
  useEffect(() => {
    if (!enabled || !userId) return;
    let active = true;
    fetchCompletedCourses(userId).then((rows) => {
      if (active) setCompleted(new Set(rows.filter((r) => r.is_completed).map((r) => r.course_code)));
    });
    return () => { active = false; };
  }, [enabled, userId]);
  return (item) => {
    const code = snapshotOf(item).code || item.item_id;
    return {
      ready: plan.ready && !!completed,
      completed: (c) => completed?.has(c),
      inPlan: plan.inPlan,
      saving: plan.saving,
      add: () => plan.addToPlan({ code, name: snapshotOf(item).name || titleOf(item).replace(/^\S+\s·\s/, "") }),
    };
  };
}

function orderItems(section, items, now) {
  const recent = (a, b) => (Date.parse(b.saved_at) || 0) - (Date.parse(a.saved_at) || 0);
  if (section.statuses) {
    const order = Object.keys(section.statuses);
    return [...items].sort((a, b) => order.indexOf(trackOf(a).status) - order.indexOf(trackOf(b).status) || (deadlineOf(a) || "9999").localeCompare(deadlineOf(b) || "9999") || recent(a, b));
  }
  if (section.key === "events") {
    return [...items].sort((a, b) => Number(isPastEvent(a, now)) - Number(isPastEvent(b, now)) || (deadlineOf(a) || "9999").localeCompare(deadlineOf(b) || "9999"));
  }
  return [...items].sort(recent);
}

function SectionNote({ section }) {
  if (section.key === "careers") return "Saved careers shape your Certifications in My Career. Remove one and the list updates.";
  if (section.key === "courses") return "Courses you tick in My courses show as Completed here.";
  return null;
}

export default function ShortlistPage() {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(null);
  const [now, setNow] = useState(Date.now);
  const [searchParams, setSearchParams] = useSearchParams();
  const section = sectionByKey(searchParams.get("section"));
  const courseStatus = useCourseStatus(userId, section?.key === "courses");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: loadError } = await listSavedItems(userId);
      if (loadError) throw loadError;
      setItems(data || []);
    } catch {
      setError("Your shortlist couldn't be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = setInterval(update, 60000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);

  const updateItem = async (id, changes) => {
    const { data, error: updateError } = await updateSavedItem(userId, id, changes);
    if (updateError) throw updateError;
    setItems((previous) => previous.map((item) => (item.id === id ? data : item)));
  };
  const removeItem = async (id) => {
    const { error: removeError } = await removeSavedItem(userId, id);
    if (removeError) throw removeError;
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const bySection = useMemo(() => {
    const groups = Object.fromEntries(SECTIONS.map((s) => [s.key, []]));
    for (const item of items) groups[sectionOf(item).key].push(item);
    return groups;
  }, [items]);
  const shownSections = SECTIONS.filter((s) => s.key !== "other" || bySection.other.length);
  const open = (key) => {
    setQuery("");
    setFilter(null);
    setSearchParams(key ? { section: key } : {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sectionItems = section ? orderItems(section, bySection[section.key], now) : [];
  const filters = section ? filtersFor(section, courseStatus) : [];
  const activeFilter = filters.find((f) => f.key === filter);
  const filtered = activeFilter ? sectionItems.filter(activeFilter.test) : sectionItems;
  const words = query.trim().toLowerCase();
  const visible = words ? filtered.filter((item) => `${titleOf(item)} ${item.personal_notes || ""}`.toLowerCase().includes(words)) : filtered;
  const upcoming = section?.key === "events" ? visible.filter((item) => !isPastEvent(item, now)) : visible;
  const past = section?.key === "events" ? visible.filter((item) => isPastEvent(item, now)) : [];
  const note = section && SectionNote({ section });
  const rows = (list) => (
    <ul className="divide-y divide-line">
      {list.map((item) => (
        <SavedRow key={item.id} item={item} now={now} onUpdate={updateItem} onRemove={removeItem} course={section.key === "courses" ? courseStatus(item) : null} />
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen app-page">
      <AppNav />
      <PageHeader eyebrow="Your next steps" title="My shortlist" subtitle="Everything you've saved, tracked the way each kind of thing needs." />
      <main className="mx-auto max-w-[1680px] px-5 py-8 md:px-10">
        {loading ? (
          <div role="status" className="space-y-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full w-1/3 animate-loading-slide rounded-full bg-blue-500" />
            </div>
            <p className="text-[15px] text-ink-muted">Loading your shortlist.</p>
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-ink">{error}</p>
            <button type="button" onClick={load} className="mt-3 font-semibold text-link">Try again</button>
          </div>
        ) : !section ? (
          <>
            {!items.length && (
              <div className="mb-6 rounded-2xl border border-line bg-surface px-6 py-10 text-center">
                <Bookmark className="mx-auto h-8 w-8 text-link" aria-hidden="true" />
                <h2 className="mt-3 text-xl font-bold text-ink-strong">Nothing saved yet</h2>
                <p className="mx-auto mt-2 max-w-lg text-[15px] text-ink-muted">Use the bookmark buttons across My Program and My Career. Saved items appear in the matching section below.</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shownSections.map((s) => (
                <button key={s.key} type="button" onClick={() => open(s.key)} className={`group flex min-h-40 flex-col justify-between p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-300 dark:hover:ring-blue-800 ${card}`}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {(() => { const Icon = ICONS[s.key]; return <Icon className="h-5 w-5" aria-hidden="true" />; })()}
                    </span>
                    <span className="text-3xl font-bold text-ink-strong">{bySection[s.key].length}</span>
                  </span>
                  <span className="mt-5 flex items-end justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-lg font-bold text-ink-strong">{s.title}</span>
                      <span className="mt-1 block text-sm text-ink-muted">{sectionSummary(s, bySection[s.key], now)}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => open(null)} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link hover:underline">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> All sections
            </button>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-ink-strong">{section.title}</h2>
                <p className="mt-1 text-[15px] text-ink-muted">{sectionSummary(section, bySection[section.key], now)}</p>
                {note && <p className="mt-1 text-sm text-ink-muted">{note}</p>}
              </div>
              {section.find && (
                <Link to={section.find.to} className="text-sm font-semibold text-link hover:underline">{section.find.label} ›</Link>
              )}
            </div>
            {sectionItems.length >= SEARCH_FROM && (
              <label className="relative mt-5 block max-w-md">
                <span className="sr-only">Search {section.title}</span>
                <Search className="absolute left-3 top-3 h-4 w-4 text-ink-muted" aria-hidden="true" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names and notes" className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink-strong focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
            )}
            {filters.length > 0 && sectionItems.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={`Filter ${section.title}`}>
                <button type="button" aria-pressed={!filter} onClick={() => setFilter(null)} className={filterPill(!filter)}>
                  All <span className="ml-1 opacity-75">{sectionItems.length}</span>
                </button>
                {filters.map((f) => {
                  const n = sectionItems.filter(f.test).length;
                  return (
                    <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(filter === f.key ? null : f.key)} className={filterPill(filter === f.key)}>
                      {f.label} <span className="ml-1 opacity-75">{n}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className={`mt-4 px-5 ${card}`}>
              {visible.length ? (
                <>
                  {upcoming.length > 0 && rows(upcoming)}
                  {past.length > 0 && (
                    <details className="border-t border-line py-3">
                      <summary className="cursor-pointer text-sm font-semibold text-ink-muted">Past events ({past.length})</summary>
                      {rows(past)}
                    </details>
                  )}
                </>
              ) : (
                <p className="py-8 text-center text-[15px] text-ink-muted">
                  {sectionItems.length ? "Nothing matches that filter or search." : "Nothing saved here yet."}
                  {!sectionItems.length && section.find && (
                    <> <Link to={section.find.to} className="font-semibold text-link hover:underline">{section.find.label} ›</Link></>
                  )}
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

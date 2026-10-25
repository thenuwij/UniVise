import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, CalendarDays, CheckCircle2, Search } from "lucide-react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import {
  careerSectionUrl,
  roadmapStepUrl,
} from "@/features/program/utils/roadmapSteps";
import SavedItemCard from "../components/SavedItemCard";
import {
  availabilityOf,
  categoryOf,
  CATEGORIES,
  filterItems,
  isDueSoon,
  PLANNING_STATES,
  planningOf,
} from "../utils/shortlist";

const control =
  "rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink-strong focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function ShortlistPage() {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [now, setNow] = useState(Date.now);
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: loadError } = await supabase
        .from("user_saved_items")
        .select("*")
        .eq("user_id", userId)
        .order("saved_at", { ascending: false });
      if (loadError) throw loadError;
      setItems(data || []);
    } catch {
      setError(
        "Your shortlist couldn't be loaded. Please try again to view your saved items.",
      );
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
    const { data, error: updateError } = await supabase
      .from("user_saved_items")
      .update(changes)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (updateError) throw updateError;
    setItems((previous) =>
      previous.map((item) => (item.id === id ? data : item)),
    );
  };
  const removeItem = async (id) => {
    const { error: removeError } = await supabase
      .from("user_saved_items")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);
    if (removeError) throw removeError;
    setItems((previous) => previous.filter((item) => item.id !== id));
  };
  const visible = filterItems(items, { category, status, query, sort }, now);
  const expired = items.filter(
    (item) => availabilityOf(item, now).state === "expired",
  ).length;
  const check = items.filter(
    (item) => availabilityOf(item, now).state === "check",
  ).length;
  const due = items.filter((item) => isDueSoon(item, now)).length;
  const done = items.filter(
    (item) => planningOf(item).status === "done",
  ).length;
  const reset = () => {
    setCategory("all");
    setStatus("all");
    setQuery("");
  };

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar
        onMenuClick={() => setIsOpen(true)}
        isMenuOpen={isOpen}
      />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      <PageHeader
        eyebrow="Your next steps"
        title="My shortlist"
        subtitle="Keep what interests you. Turn it into a plan."
      >
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-band-soft">
          Save courses, careers and opportunities, add a target date and keep
          track of what you want to do next. This is your personal plan,
          separate from official applications and enrolment.
        </p>
      </PageHeader>
      <main className="mx-auto max-w-[1680px] space-y-6 px-5 py-8 md:px-10">
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Saved items",
                value: items.length,
                icon: Bookmark,
                filter: "all",
              },
              {
                label: "Due soon or overdue",
                value: due,
                icon: CalendarDays,
                filter: "due",
              },
              {
                label: "Needs review",
                value: check + expired,
                icon: Search,
                filter: "attention",
              },
              {
                label: "Done",
                value: done,
                icon: CheckCircle2,
                filter: "done",
              },
            ].map(({ label, value, icon: Icon, filter }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setStatus(filter);
                  setCategory("all");
                  setQuery("");
                }}
                className="rounded-2xl border border-line bg-surface p-4 text-left hover:border-blue-400"
              >
                <Icon className="mb-3 h-5 w-5 text-link" aria-hidden="true" />
                <p className="text-2xl font-bold text-ink-strong">{value}</p>
                <p className="mt-1 text-xs font-medium text-ink-muted">
                  {label}
                </p>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-link">
          <Link to={careerSectionUrl("jobs")} className="hover:underline">
            Find opportunities →
          </Link>
          <Link to={roadmapStepUrl("next")} className="hover:underline">
            Explore next courses →
          </Link>
        </div>
        {!error && items.length > 0 && (
          <>
            <nav
              aria-label="Shortlist categories"
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {Object.entries(CATEGORIES)
                .filter(
                  ([key]) =>
                    key === "all" ||
                    items.some((item) => categoryOf(item) === key),
                )
                .map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={category === key}
                    onClick={() => setCategory(key)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${category === key ? "border-blue-600 bg-blue-600 text-white" : "border-line bg-surface text-ink-muted hover:border-blue-400"}`}
                  >
                    {label}{" "}
                    <span className="ml-1 text-xs opacity-80">
                      {key === "all"
                        ? items.length
                        : items.filter((item) => categoryOf(item) === key)
                            .length}
                    </span>
                  </button>
                ))}
            </nav>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Search your shortlist</span>
                <Search
                  className="absolute left-3 top-3 h-4 w-4 text-ink-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search items, organisations or your notes"
                  className={`${control} w-full pl-9`}
                />
              </label>
              <label>
                <span className="sr-only">
                  Filter by planning status or availability
                </span>
                <select
                  className={`${control} w-full`}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  {Object.entries(PLANNING_STATES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                  <option value="due">Due soon or overdue</option>
                  <option value="attention">Needs review</option>
                  <option value="expired">Expired</option>
                  <option value="check">Check availability</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Sort saved items</span>
                <select
                  className={`${control} w-full`}
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="recent">Recently saved</option>
                  <option value="date">Next date first</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              Expired labels use saved closing dates, event dates or a closed
              marker. Older ads without a deadline say “Check availability”. We
              do not continuously check external websites; open the source for
              current details. Target dates are your own planning dates.
            </p>
            <p className="text-sm text-ink-muted" role="status">
              {visible.length} of {items.length} saved items
              {expired ? ` · ${expired} expired` : ""}
            </p>
          </>
        )}
        {loading ? (
          <p role="status" className="py-16 text-center text-ink-muted">
            Loading your shortlist…
          </p>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <p className="text-ink">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 font-semibold text-link"
            >
              Try again
            </button>
          </div>
        ) : visible.length ? (
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                now={now}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center">
            <Bookmark className="mx-auto h-9 w-9 text-link" />
            <h2 className="mt-4 text-xl font-bold text-ink-strong">
              {items.length
                ? "No items match your filters"
                : "Make room for your next step"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
              {items.length
                ? "Try another category, status or search. Your other saved items are still here."
                : "Use the bookmark buttons across My Program and My Career. Save a course, certification, job, event or society, then add notes and a target date here."}
            </p>
            {items.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="mt-4 font-semibold text-link"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

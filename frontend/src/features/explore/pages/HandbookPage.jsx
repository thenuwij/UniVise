import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Search, X } from "lucide-react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import { supabase } from "@/shared/lib/supabase";
import { toSearchTerm } from "@/shared/lib/search";
import { card, clickable } from "@/features/roadmap/utils/cardStyles";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const MAX_RESULTS = 50;
const SHOWN_RESULTS = 6;

const GROUPS = [
  {
    key: "degrees",
    label: "Degrees",
    query: (term) =>
      supabase
        .from("unsw_degrees_final")
        .select("id, program_name, degree_code, faculty", { count: "exact" })
        .eq("is_offered", true)
        .or(`program_name.ilike.%${term}%,degree_code.ilike.%${term}%`)
        .order("program_name")
        .limit(MAX_RESULTS),
    toItem: (d) => ({ id: d.id, to: `/degrees/${d.id}`, title: d.program_name, code: d.degree_code, meta: d.faculty }),
  },
  {
    key: "specialisations",
    label: "Majors, minors and honours",
    query: (term) =>
      supabase
        .from("unsw_specialisations")
        .select("id, major_name, major_code, specialisation_type, faculty", { count: "exact" })
        .or(`major_name.ilike.%${term}%,major_code.ilike.%${term}%`)
        .order("major_name")
        .limit(MAX_RESULTS),
    toItem: (s) => ({
      id: s.id,
      to: `/specialisation/${s.specialisation_type === "Major" ? "major" : s.specialisation_type === "Minor" ? "minor" : "honours"}/${s.id}`,
      title: s.major_name,
      code: s.major_code,
      tag: s.specialisation_type,
      meta: s.faculty,
    }),
  },
  {
    key: "courses",
    label: "Courses",
    query: (term) =>
      supabase
        .from("unsw_courses")
        .select("id, code, title, faculty, uoc", { count: "exact" })
        .or(`code.ilike.%${term}%,title.ilike.%${term}%`)
        .order("code")
        .limit(MAX_RESULTS),
    toItem: (c) => ({ id: c.id, to: `/course/${c.id}`, title: c.title, code: c.code, meta: [c.uoc && `${c.uoc} UOC`, c.faculty].filter(Boolean).join(" · ") }),
  },
];

const FILTERS = [{ key: "all", label: "All" }, ...GROUPS.map(({ key, label }) => ({ key, label }))];

function ResultGroup({ group, result }) {
  const [expanded, setExpanded] = useState(false);
  const items = result.rows.map(group.toItem);
  const shown = expanded ? items : items.slice(0, SHOWN_RESULTS);

  return (
    <section>
      <h2 className="flex items-baseline gap-2 text-[22px] md:text-2xl font-bold tracking-tight text-slate-700 dark:text-slate-200">
        {group.label}
        <span className="text-base font-semibold text-slate-400 dark:text-slate-500">{result.count}</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-base text-slate-500 dark:text-slate-400">No matches.</p>
      ) : (
        <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {shown.map((item) => (
            <Link key={item.id} to={item.to} className={`${card} ${clickable} group flex items-center justify-between gap-3 px-5 py-4`}>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  {item.code && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{item.code}</span>}
                  {item.tag && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30">
                      {item.tag}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-base font-semibold text-slate-900 dark:text-white line-clamp-2">{item.title}</span>
                {item.meta && <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{item.meta}</span>}
              </span>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      )}
      {items.length > SHOWN_RESULTS && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 hover:border-blue-400 dark:hover:bg-blue-900/50 transition-colors"
        >
          {expanded ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
      {expanded && result.count > items.length && (
        <p className="mt-2 text-sm text-center text-slate-500 dark:text-slate-400">
          Showing the first {items.length} of {result.count}. Add more words to narrow it down.
        </p>
      )}
    </section>
  );
}

export default function HandbookPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState("idle");
  const [attempt, setAttempt] = useState(0);
  const filter = FILTERS.some((f) => f.key === searchParams.get("type")) ? searchParams.get("type") : "all";
  const term = toSearchTerm(query);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (term.length < MIN_CHARS) {
      setResults(null);
      setStatus("idle");
      return;
    }
    let active = true;
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const responses = await Promise.all(GROUPS.map((g) => g.query(term)));
        if (!active) return;
        const failed = responses.find((r) => r.error);
        if (failed) throw failed.error;
        setResults(Object.fromEntries(GROUPS.map((g, i) => [g.key, { rows: responses[i].data || [], count: responses[i].count ?? 0 }])));
        setStatus("done");
      } catch (err) {
        console.error("Handbook search failed:", err);
        if (active) setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term, attempt]);

  const onQueryChange = (value) => {
    setQuery(value);
    updateParams({ q: value.trim() });
  };

  const visibleGroups = GROUPS.filter((g) => filter === "all" || g.key === filter);
  const total = results ? visibleGroups.reduce((sum, g) => sum + results[g.key].count, 0) : 0;

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950 text-primary transition-colors duration-500">
      <DashboardNavBar onMenuClick={() => setIsMenuOpen(true)} isMenuOpen={isMenuOpen} />
      <MenuBar isOpen={isMenuOpen} handleClose={() => setIsMenuOpen(false)} />

      <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-600 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div aria-hidden className="absolute -top-36 -right-20 h-[480px] w-[480px] rounded-full bg-blue-300/15 dark:bg-blue-400/10" />
        <div className="relative max-w-[1440px] mx-auto px-5 md:px-10 pt-8 pb-9">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-blue-200">UNSW 2026</p>
          <h1 className="mt-2 text-4xl md:text-[42px] md:leading-[1.1] font-bold tracking-tight text-white">Handbook</h1>
          <p className="mt-2 text-lg text-blue-100">Search UNSW degrees, majors and courses</p>
          <div className="relative mt-6 max-w-3xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Try COMP1511, Computer Science or Finance"
              aria-label="Search the Handbook"
              className="w-full pl-13 pr-12 py-4 rounded-2xl text-lg text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-0 shadow-lg shadow-blue-950/20 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-300/60 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => updateParams({ type: f.key === "all" ? "" : f.key })}
              aria-pressed={filter === f.key}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filter === f.key
                  ? "text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {status === "idle" && (
            <p className="text-base text-slate-500 dark:text-slate-400">
              Type at least {MIN_CHARS} characters to search every degree, major, minor, honours plan and course in the 2026 Handbook.
            </p>
          )}
          {status === "loading" && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[84px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          )}
          {status === "error" && (
            <div className={`${card} p-6`}>
              <p className="text-base text-slate-700 dark:text-slate-300">The search couldn't be loaded.</p>
              <button
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-3 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
          {status === "done" && total === 0 && (
            <p className="text-base text-slate-500 dark:text-slate-400">
              Nothing matches "{term}". Check the spelling or try a course code.
            </p>
          )}
          {status === "done" && total > 0 && (
            <div className="space-y-10">
              {visibleGroups
                .filter((g) => filter !== "all" || results[g.key].count > 0)
                .map((g) => (
                  <ResultGroup key={`${g.key}-${term}`} group={g} result={results[g.key]} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

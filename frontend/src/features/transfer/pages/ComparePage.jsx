import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, CircleCheck, CircleX, GraduationCap, Info, MessageCircle, Search, X } from "lucide-react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";
import FormattedText from "@/shared/ui/FormattedText";
import { card } from "@/shared/ui/cardStyles";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";
import { supabase } from "@/shared/lib/supabase";
import { toSearchTerm } from "@/shared/lib/search";
import { useEnrolledProgram } from "@/features/roadmap/hooks/useEnrolledProgram";
import { fetchChosenSpecialisations, fetchSpecialisationOptions } from "@/features/roadmap/utils/programCourses";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";
import { fetchCompletedCourses } from "../utils/completedCourses";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const SHOWN_CODES = 8;

const panel = "rounded-2xl bg-slate-200/50 dark:bg-slate-800/50";
const TINTS = {
  green: "rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/60",
  amber: "rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60",
  red: "rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60",
  blue: "rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60",
};
const secondary =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold text-blue-900 dark:text-blue-100 bg-blue-200 dark:bg-blue-900/70 border-2 border-blue-400 dark:border-blue-600 hover:bg-blue-300 hover:border-blue-500 dark:hover:bg-blue-900 transition-colors";

const VERDICTS = {
  recommended: "text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40",
  conditional: "text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40",
  not_recommended: "text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/40",
};

function useProgramSearch(query) {
  const [results, setResults] = useState([]);
  const term = toSearchTerm(query);

  useEffect(() => {
    if (term.length < MIN_CHARS) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      let request = supabase.from("unsw_degrees_final").select("degree_code, program_name, faculty").eq("is_offered", true);
      if (/^\d+$/.test(term)) {
        request = request.ilike("degree_code", `${term}%`);
      } else {
        for (const word of term.split(" ").filter((w) => w.length > 1)) request = request.ilike("program_name", `%${word}%`);
      }
      const { data } = await request.order("program_name").limit(40);
      const ranked = (data || []).sort((a, b) => a.program_name.length - b.program_name.length || a.program_name.localeCompare(b.program_name));
      if (active) setResults(ranked.slice(0, 12));
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term]);

  return results;
}

function Stat({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4">
      <p className="text-sm font-semibold text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink-strong">{value}</p>
      {detail && <p className="mt-1 text-sm text-ink-muted leading-snug">{detail}</p>}
    </div>
  );
}

function CodeLines({ courses, note }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {courses.map((c) => (
        <li key={c.code} className="text-sm">
          <Link to={`/course/${c.code}`} className="font-bold text-link hover:underline">{c.code}</Link>
          <span className="text-ink"> {c.name}</span>
          {note && c[note] && <span className="text-ink-muted"> · {c[note]}</span>}
        </li>
      ))}
    </ul>
  );
}

function PanelTitle({ icon: Icon, tone, children, count }) {
  return (
    <p className="flex items-center gap-2 text-base font-bold text-ink-strong">
      <Icon className={`h-5 w-5 ${tone}`} />
      {children}
      {count != null && <span className="font-normal text-ink-muted">({count})</span>}
    </p>
  );
}

function FreeElectivesPanel({ pool }) {
  const count = pool.candidates.length;
  const allFit = pool.fits_count >= count;
  return (
    <div className={`${TINTS.amber} p-5`}>
      <PanelTitle icon={AlertTriangle} tone="text-amber-600 dark:text-amber-400" count={count}>
        Could fill free electives
      </PanelTitle>
      <p className="mt-2 text-sm text-ink">
        {allFit
          ? `These aren't in its course lists, but all of them fit in its ${pool.uoc} UOC of free electives.`
          : `These aren't in its course lists. Its free electives have room for ${pool.uoc} UOC, so only ${pool.fits_count} of these ${count} can count. You'd choose which.`}
      </p>
      <CodeLines courses={pool.candidates} />
    </div>
  );
}

function StillToDo({ items, uocNeeded, noMajor }) {
  return (
    <div className={`${TINTS.blue} p-5`}>
      <PanelTitle icon={GraduationCap} tone="text-blue-600 dark:text-blue-400" count={uocNeeded != null ? `${uocNeeded} UOC` : null}>
        Still to do
      </PanelTitle>
      {noMajor && (
        <p className="mt-3 text-sm">
          <span className="font-semibold text-ink-strong">Your major</span>
          <span className="block text-ink-muted">Most of what's left. Choose a major above to see its courses.</span>
        </p>
      )}
      {items.length ? (
        <ul className="mt-3 space-y-2.5">
          {items.map((item) => (
            <li key={item.title} className="text-sm">
              <p className="font-semibold text-ink-strong">{item.title}</p>
              <p className="text-ink-muted">
                {item.type === "core"
                  ? [
                      item.left.length ? `${item.left.length} left: ${item.left.slice(0, SHOWN_CODES).join(", ")}${item.left.length > SHOWN_CODES ? ` and ${item.left.length - SHOWN_CODES} more` : ""}` : "",
                      item.choices.length ? `${item.choices.length} "one of" ${item.choices.length === 1 ? "choice" : "choices"}: ${item.choices.map((codes) => codes.join(" or ")).join("; ")}` : "",
                    ].filter(Boolean).join(" · ")
                  : item.type === "elective"
                  ? `${item.uoc_left} UOC to choose from ${item.options} listed courses${item.also ? ` or ${item.also}` : ""}`
                  : `${item.uoc_left} UOC of ${item.note}`}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">{uocNeeded ? "Its course lists are covered. The rest is set by the Handbook's rules." : "Nothing left. Your courses already cover this program."}</p>
      )}
    </div>
  );
}

function extraStat(summary) {
  const extra = summary.extra_uoc ?? 0;
  const terms = summary.extra_terms ?? 0;
  const courses = Math.round(Math.abs(extra) / 6);
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  if (extra > 0) {
    return {
      value: `+${extra} UOC`,
      detail: `About ${plural(courses, "more course")} than staying. ${terms > 0 ? `Roughly ${plural(terms, "extra term")}.` : "Fits in the same terms with a heavier load."}`,
    };
  }
  if (extra < 0) {
    return { value: `${-extra} UOC less`, detail: `About ${plural(courses, "course")} fewer than staying.${terms < 0 ? ` Roughly ${plural(-terms, "term")} sooner.` : ""}` };
  }
  return { value: "None", detail: "Same amount left as staying." };
}

function Answer({ target, comparison, advice, adviceLoading, noMajor }) {
  const transfer = comparison.transfer_analysis || {};
  const summary = comparison.summary || {};
  const pool = transfer.free_pool || { uoc: 0, used_uoc: 0, fits_count: 0, candidates: [] };
  const lost = transfer.wasted_courses || [];
  const overflow = Math.max(pool.candidates.length - pool.fits_count, 0);
  const extra = extraStat(summary);
  const listedCount = (transfer.transferred_courses || []).length;

  return (
    <section className="space-y-6">
      <div className={`${card} p-6`}>
        {advice ? (
          <>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${VERDICTS[advice.verdict] || VERDICTS.conditional}`}>
              {advice.verdict_label}
            </span>
            <p className="mt-3 text-[17px] leading-relaxed text-ink">{advice.summary}</p>
          </>
        ) : (
          <p className="text-[15px] text-ink-muted">{adviceLoading ? "The advisor is weighing this switch for you..." : "The advisor's view isn't available right now. The numbers below are still accurate."}</p>
        )}
      </div>

      {noMajor && (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-4 py-3 text-[15px] text-ink">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          No major was chosen. Most of this program's courses sit in its majors, so pick one above and compare again for an accurate result.
        </p>
      )}

      <p className="flex items-start gap-2 text-sm text-ink-muted">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        This is an estimate from your ticked courses. A course counts when it's in the new program's course lists (up to each list's limit) or matches one of its elective rules. Others can fill its free electives while there's room. Confirm with the school before switching.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Courses that count"
          value={`${transfer.transferred_count ?? 0} of ${transfer.total_completed_courses ?? 0}`}
          detail={
            !transfer.total_completed_courses
              ? "Tick your completed courses to see this"
              : pool.fits_count
              ? `${listedCount} in its course lists, ${pool.fits_count} as free electives`
              : listedCount
              ? "All from its course lists"
              : "None fit this program"
          }
        />
        <Stat label="UOC carried over" value={`${transfer.transferred_uoc ?? 0} UOC`} detail={`Of the ${summary.completed_uoc ?? 0} UOC you've done`} />
        <Stat label="Extra study" value={extra.value} detail={extra.detail} />
        <Stat
          label="Estimated finish"
          value={summary.estimated_completion || "Unknown"}
          detail={summary.estimated_terms ? `${summary.estimated_terms} terms left at 3 courses a term` : null}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <div className={`${TINTS.green} p-5`}>
          <PanelTitle icon={CircleCheck} tone="text-green-600 dark:text-green-400" count={(transfer.transferred_courses || []).length}>
            Counts in {target.program_name}
          </PanelTitle>
          {transfer.transferred_courses?.length ? (
            <CodeLines courses={transfer.transferred_courses} note="section" />
          ) : (
            <p className="mt-2 text-sm text-ink-muted">None of your ticked courses are in its course lists.</p>
          )}
        </div>
        {pool.candidates.length > 0 && <FreeElectivesPanel pool={pool} />}
        <div className={`${TINTS.red} p-5`}>
          <PanelTitle icon={CircleX} tone="text-red-600 dark:text-red-400" count={lost.length + overflow}>
            Won't count
          </PanelTitle>
          {lost.length ? <CodeLines courses={lost} /> : null}
          {overflow > 0 && (
            <p className="mt-2 text-sm text-ink">
              {lost.length ? "Plus " : ""}{overflow} of the free elective courses above, as there's no room for them.
            </p>
          )}
          {!lost.length && !overflow && <p className="mt-2 text-sm text-ink-muted">Every ticked course has a place in this program.</p>}
        </div>
        <StillToDo items={transfer.still_to_do || []} uocNeeded={summary.uoc_needed} noMajor={noMajor} />
      </div>

      {advice && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`${panel} p-5`}>
              <p className="text-base font-bold text-ink-strong">Reasons to switch</p>
              <ul className="mt-2 space-y-1.5">
                {advice.pros.map((pro, i) => (
                  <li key={i} className="flex gap-2 text-[15px] text-ink leading-relaxed">
                    <Check className="h-4 w-4 mt-1 flex-shrink-0 text-green-600 dark:text-green-400" strokeWidth={3} />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${panel} p-5`}>
              <p className="text-base font-bold text-ink-strong">Reasons to stay</p>
              <ul className="mt-2 space-y-1.5">
                {advice.cons.map((con, i) => (
                  <li key={i} className="flex gap-2 text-[15px] text-ink leading-relaxed">
                    <X className="h-4 w-4 mt-1 flex-shrink-0 text-slate-500" strokeWidth={3} />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {advice.action_steps?.length > 0 && (
            <div className={`${panel} p-5`}>
              <p className="text-base font-bold text-ink-strong">Next steps</p>
              <ol className="mt-2 space-y-1.5">
                {advice.action_steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-[15px] text-ink leading-relaxed">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {advice.detailed_analysis && (
            <div className={`${panel} p-5`}>
              <p className="text-base font-bold text-ink-strong">Advisor's analysis</p>
              <div className="mt-2">
                <FormattedText text={advice.detailed_analysis} collapsedHeight={null} />
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to={`/roadmap?program=${target.degree_code}`} className={secondary}>
          Explore this program's roadmap
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/chat" className={secondary}>
          <MessageCircle className="h-4 w-4" />
          Ask Eunice about this switch
        </Link>
      </div>
    </section>
  );
}

export default function ComparePage() {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const { program, loading } = useEnrolledProgram();
  const [isOpen, setIsOpen] = useState(false);
  const [specNames, setSpecNames] = useState([]);
  const [uocDone, setUocDone] = useState(0);
  const [minimumUoc, setMinimumUoc] = useState(null);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState(null);
  const [majorGroups, setMajorGroups] = useState([]);
  const [majorCode, setMajorCode] = useState("");
  const [comparison, setComparison] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [noMajor, setNoMajor] = useState(false);
  const [status, setStatus] = useState("idle");
  const results = useProgramSearch(query);
  const [nearby, setNearby] = useState([]);

  useEffect(() => {
    if (!program || !userId) return;
    fetchChosenSpecialisations(program.degree_code, userId).then((found) => setSpecNames(found.map((s) => s.name)));
    fetchCompletedCourses(userId).then((rows) => {
      const done = rows.filter((r) => r.is_completed);
      setUocDone(done.reduce((sum, r) => sum + (Number(r.uoc) || 0), 0));
    });
    supabase
      .from("unsw_degrees_final")
      .select("minimum_uoc, faculty")
      .eq("degree_code", program.degree_code)
      .maybeSingle()
      .then(async ({ data }) => {
        setMinimumUoc(data?.minimum_uoc || null);
        if (!data?.faculty) return;
        const { data: same } = await supabase
          .from("unsw_degrees_final")
          .select("degree_code, program_name, faculty")
          .eq("is_offered", true)
          .eq("faculty", data.faculty)
          .neq("degree_code", program.degree_code)
          .order("program_name")
          .limit(8);
        setNearby(same || []);
      });
  }, [program, userId]);

  useEffect(() => {
    setMajorCode("");
    setMajorGroups([]);
    if (!target) return;
    fetchSpecialisationOptions(target.degree_code).then(setMajorGroups);
  }, [target]);

  const sameProgram = !!target && target.degree_code === program?.degree_code;
  const majors = useMemo(
    () => majorGroups.flatMap((g) => g.options).filter((m) => !sameProgram || !specNames.includes(m.major_name)),
    [majorGroups, sameProgram, specNames]
  );

  const chooseTarget = (choice) => {
    setTarget(choice);
    setQuery("");
    setComparison(null);
    setAdvice(null);
    setStatus("idle");
  };

  const compare = async () => {
    if (!program || !target) return;
    setStatus("comparing");
    setNoMajor(majors.length > 0 && !majorCode);
    setComparison(null);
    setAdvice(null);
    const request = {
      base_program_code: program.degree_code,
      base_specialisation_codes: [],
      target_program_code: target.degree_code,
      target_specialisation_codes: majorCode ? [majorCode] : [],
    };
    try {
      const compared = await apiJson("/compare", { method: "POST", retry: true, token: session?.access_token, body: request });
      setComparison(compared);
      setStatus("advising");
      try {
        setAdvice(await apiJson("/switch-advisor", { method: "POST", retry: true, token: session?.access_token, body: { ...request, comparison_data: compared } }));
      } catch (err) {
        console.error("Switch advisor failed:", err);
      }
      setStatus("done");
    } catch (err) {
      console.error("Comparison failed:", err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      <PageHeader eyebrow="Compare programs" title="Compare programs" subtitle="See how your courses would count in another UNSW program." />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        <div className="space-y-8">
          {loading ? (
            <div className={`${card} h-40 animate-pulse`} />
          ) : !program ? (
            <div className={`${card} p-6`}>
              <p className="text-lg font-semibold text-ink-strong">Compare needs your program</p>
              <p className="mt-1 text-[15px] text-ink-muted">Your program isn't in our list, so there's nothing to compare from. You can still explore any program's roadmap to see what it involves.</p>
              <Link to="/roadmap" className={`${secondary} mt-4`}>Explore a program's roadmap</Link>
            </div>
          ) : (
            <>
              <section className="space-y-7">
                <div className="flex gap-4">
                  <span className="h-8 w-8 flex-shrink-0 rounded-full inline-flex items-center justify-center text-sm font-bold text-white bg-blue-600">1</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-muted">Your program</p>
                    <p className="mt-0.5 text-lg font-bold text-ink-strong">{program.program_name}</p>
                    <p className="text-[15px] text-ink-muted">
                      {[specNames.join(", ") || "No specialisation chosen", `${uocDone}${minimumUoc ? ` of ${minimumUoc}` : ""} UOC done`].join(" · ")}
                    </p>
                    <p className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
                      <Link to={roadmapStepUrl("structure")} className="text-sm font-semibold text-link hover:underline">Update ticked courses</Link>
                      <Link to={`/roadmap?program=${program.degree_code}`} className="text-sm font-semibold text-link hover:underline">Change specialisation</Link>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-line">
                  <span className="h-8 w-8 flex-shrink-0 rounded-full inline-flex items-center justify-center text-sm font-bold text-white bg-blue-600">2</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-muted">Compare with</p>
                    {target ? (
                      <div className="mt-0.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-bold text-ink-strong">{target.program_name}</p>
                          <p className="text-[15px] text-ink-muted">{[target.degree_code, target.faculty].filter(Boolean).join(" · ")}</p>
                        </div>
                        <button type="button" onClick={() => chooseTarget(null)} className="flex-shrink-0 text-sm font-semibold text-link hover:underline">Change</button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search a program, e.g. Computer Science or 3778"
                            aria-label="Search for a program to compare with"
                            className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[15px] text-ink-strong focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {results.length > 0 ? (
                          <ul className="mt-2 rounded-xl border border-line bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                            {results.map((p) => (
                              <li key={p.degree_code}>
                                <button
                                  type="button"
                                  onClick={() => chooseTarget(p)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <span className="block text-[15px] font-semibold text-ink-strong">
                                    {p.program_name}
                                    {p.degree_code === program.degree_code && (
                                      <span className="ml-2 align-middle px-2 py-0.5 rounded-full text-xs font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50">Your program</span>
                                    )}
                                  </span>
                                  <span className="block text-sm text-ink-muted">{[p.degree_code, p.faculty].filter(Boolean).join(" · ")}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          !query.trim() &&
                          nearby.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-ink-muted">Or pick one from your faculty</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {nearby.map((p) => (
                                  <button
                                    key={p.degree_code}
                                    type="button"
                                    onClick={() => chooseTarget(p)}
                                    className="px-3.5 py-1.5 rounded-full text-sm font-semibold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                                  >
                                    {p.program_name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {target && majors.length > 0 && (
                      <label className="mt-4 block">
                        <span className="text-sm font-semibold text-ink">
                          {sameProgram ? "Specialisation to compare with" : "Major or stream (optional)"}
                        </span>
                        <select
                          value={majorCode}
                          onChange={(e) => setMajorCode(e.target.value)}
                          className="mt-1 w-full px-3 py-2.5 rounded-xl border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-900 text-[15px] text-ink-strong focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{sameProgram ? "Choose one" : "Not sure yet (less accurate)"}</option>
                          {majors.map((m) => (
                            <option key={m.id} value={m.major_code}>{m.major_name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-line">
                  <button
                    type="button"
                    onClick={compare}
                    disabled={!target || (sameProgram && !majorCode) || status === "comparing" || status === "advising"}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {status === "comparing" ? "Comparing your courses..." : "Compare"}
                    {status !== "comparing" && <ArrowRight className="h-5 w-5" />}
                  </button>
                  {!comparison && (
                    <p className="mt-3 text-center text-sm text-ink-muted">
                      You'll see which of your courses count, what's left, the extra study, and an advisor's view.
                    </p>
                  )}
                </div>
              </section>

              {status === "error" && (
                <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[15px] text-red-800 dark:text-red-200">The comparison couldn't be run. Please try again.</p>
                  <button type="button" onClick={compare} className={secondary}>Try again</button>
                </div>
              )}

              {comparison && target && <Answer target={target} comparison={comparison} advice={advice} adviceLoading={status === "advising"} noMajor={noMajor} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, CircleCheck, CircleX, GraduationCap, MessageCircle, Search, X } from "lucide-react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";
import ExpandToggle from "@/shared/ui/ExpandToggle";
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
const secondary =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold text-blue-900 dark:text-blue-100 bg-blue-200 dark:bg-blue-900/70 border-2 border-blue-400 dark:border-blue-600 hover:bg-blue-300 hover:border-blue-500 dark:hover:bg-blue-900 transition-colors";

const VERDICTS = {
  recommended: "text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40",
  conditional: "text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40",
  not_recommended: "text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/40",
};

function useProgramSearch(query, excludeCode) {
  const [results, setResults] = useState([]);
  const term = toSearchTerm(query);

  useEffect(() => {
    if (term.length < MIN_CHARS) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("unsw_degrees_final")
        .select("degree_code, program_name, faculty")
        .eq("is_offered", true)
        .or(`program_name.ilike.%${term}%,degree_code.ilike.%${term}%`)
        .order("program_name")
        .limit(8);
      if (active) setResults((data || []).filter((p) => p.degree_code !== excludeCode));
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term, excludeCode]);

  return results;
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4">
      <p className="text-2xl font-bold text-ink-strong">{value}</p>
      <p className="mt-0.5 text-sm text-ink-muted">{label}</p>
    </div>
  );
}

function CourseList({ title, icon: Icon, tone, courses, empty }) {
  return (
    <div className={`${panel} p-5`}>
      <p className="flex items-center gap-2 text-base font-bold text-ink-strong">
        <Icon className={`h-5 w-5 ${tone}`} />
        {title}
        <span className="font-normal text-ink-muted">({courses.length})</span>
      </p>
      {courses.length ? (
        <ul className="mt-3 space-y-1.5">
          {courses.map((c) => (
            <li key={c.code} className="text-sm">
              <Link to={`/course/${c.code}`} className="font-bold text-link hover:underline">{c.code}</Link>
              <span className="text-ink"> {c.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">{empty}</p>
      )}
    </div>
  );
}

function StillToDo({ levels, uocNeeded }) {
  return (
    <div className={`${panel} p-5`}>
      <p className="flex items-center gap-2 text-base font-bold text-ink-strong">
        <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        Still to do
        {uocNeeded != null && <span className="font-normal text-ink-muted">({uocNeeded} UOC)</span>}
      </p>
      {levels.length ? (
        <ul className="mt-3 space-y-3">
          {levels.map((level) => (
            <li key={level.level}>
              <p className="text-sm font-semibold text-ink-strong">
                {level.level_name}
                <span className="font-normal text-ink-muted"> · {level.total_courses} courses · {level.total_uoc} UOC</span>
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {level.courses.slice(0, SHOWN_CODES).map((c) => c.code).join(", ")}
                {level.courses.length > SHOWN_CODES ? ` and ${level.courses.length - SHOWN_CODES} more` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">Nothing listed. Check the Handbook for this program's rules.</p>
      )}
    </div>
  );
}

function Answer({ target, comparison, advice, adviceLoading }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const transfer = comparison.transfer_analysis || {};
  const summary = comparison.summary || {};
  const levels = Object.values(comparison.requirements_by_level || {});
  const extraTerms = advice?.additional_terms ?? summary.estimated_terms;

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat value={`${transfer.transferred_count ?? 0} of ${transfer.total_completed_courses ?? 0}`} label="of your courses count" />
        <Stat value={`${transfer.transferred_uoc ?? 0} UOC`} label="carried over" />
        <Stat value={extraTerms > 0 ? `+${extraTerms}` : "None"} label="extra terms" />
        <Stat value={advice?.estimated_completion || summary.estimated_completion || "Unknown"} label="estimated finish" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <CourseList
          title={`Counts in ${target.program_name}`}
          icon={CircleCheck}
          tone="text-green-600 dark:text-green-400"
          courses={transfer.transferred_courses || []}
          empty="None of your ticked courses count here."
        />
        <CourseList
          title="Won't count"
          icon={CircleX}
          tone="text-slate-500 dark:text-slate-400"
          courses={transfer.wasted_courses || []}
          empty="Every ticked course counts. Nothing is lost."
        />
        <StillToDo levels={levels} uocNeeded={summary.uoc_needed} />
      </div>

      {comparison.critical_issues?.length > 0 && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-5 space-y-2">
          {comparison.critical_issues.map((issue, i) => (
            <p key={i} className="flex items-start gap-2 text-sm text-ink">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              {issue.message}
            </p>
          ))}
        </div>
      )}

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
            <div>
              <ExpandToggle open={showAnalysis} onClick={() => setShowAnalysis(!showAnalysis)}>
                {showAnalysis ? "Hide full analysis" : "Show full analysis"}
              </ExpandToggle>
              {showAnalysis && (
                <div className="mt-4">
                  <FormattedText text={advice.detailed_analysis} collapsedHeight={null} />
                </div>
              )}
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
  const [status, setStatus] = useState("idle");
  const results = useProgramSearch(query, program?.degree_code);

  useEffect(() => {
    if (!program || !userId) return;
    fetchChosenSpecialisations(program.degree_code, userId).then((found) => setSpecNames(found.map((s) => s.name)));
    fetchCompletedCourses(userId).then((rows) =>
      setUocDone(rows.filter((r) => r.is_completed).reduce((sum, r) => sum + (Number(r.uoc) || 0), 0))
    );
    supabase
      .from("unsw_degrees_final")
      .select("minimum_uoc")
      .eq("degree_code", program.degree_code)
      .maybeSingle()
      .then(({ data }) => setMinimumUoc(data?.minimum_uoc || null));
  }, [program, userId]);

  useEffect(() => {
    setMajorCode("");
    setMajorGroups([]);
    if (!target) return;
    fetchSpecialisationOptions(target.degree_code).then(setMajorGroups);
  }, [target]);

  const majors = useMemo(() => majorGroups.flatMap((g) => g.options), [majorGroups]);

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

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8 space-y-8">
        {loading ? (
          <div className={`${card} h-40 animate-pulse`} />
        ) : !program ? (
          <div className={`${card} p-6`}>
            <p className="text-lg font-semibold text-ink-strong">Choose your program first</p>
            <p className="mt-1 text-[15px] text-ink-muted">Compare programs uses your program and the courses you've ticked in your roadmap.</p>
            <Link to="/dashboard" className={`${secondary} mt-4`}>Go to your dashboard</Link>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-4 items-start">
              <div className={`${panel} p-6`}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">Your program</p>
                <p className="mt-1 text-xl font-bold text-ink-strong">{program.program_name}</p>
                <p className="mt-1 text-[15px] text-ink-muted">
                  {[specNames.join(", ") || "No specialisation chosen", `${uocDone}${minimumUoc ? ` of ${minimumUoc}` : ""} UOC done`].join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                  <Link to={roadmapStepUrl("structure")} className="text-sm font-semibold text-link hover:underline">Update ticked courses</Link>
                  <Link to={`/roadmap?program=${program.degree_code}`} className="text-sm font-semibold text-link hover:underline">Change specialisation</Link>
                </div>
              </div>

              <div className={`${card} p-6`}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-link">Compare with</p>
                {target ? (
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-ink-strong">{target.program_name}</p>
                      <p className="mt-0.5 text-[15px] text-ink-muted">{[target.degree_code, target.faculty].filter(Boolean).join(" · ")}</p>
                    </div>
                    <button type="button" onClick={() => chooseTarget(null)} className="text-sm font-semibold text-link hover:underline">Change</button>
                  </div>
                ) : (
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search a program, e.g. Computer Science or 3778"
                      aria-label="Search for a program to compare with"
                      className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[15px] text-ink-strong focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {results.length > 0 && (
                      <ul className="mt-2 rounded-xl border border-line bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                        {results.map((p) => (
                          <li key={p.degree_code}>
                            <button
                              type="button"
                              onClick={() => chooseTarget(p)}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <span className="block text-[15px] font-semibold text-ink-strong">{p.program_name}</span>
                              <span className="block text-sm text-ink-muted">{[p.degree_code, p.faculty].filter(Boolean).join(" · ")}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {target && majors.length > 0 && (
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-ink">Major or stream (optional)</span>
                    <select
                      value={majorCode}
                      onChange={(e) => setMajorCode(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-900 text-[15px] text-ink-strong focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Not sure yet</option>
                      {majors.map((m) => (
                        <option key={m.id} value={m.major_code}>{m.major_name}</option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  type="button"
                  onClick={compare}
                  disabled={!target || status === "comparing" || status === "advising"}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === "comparing" ? "Comparing your courses..." : "Compare"}
                  {status !== "comparing" && <ArrowRight className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {status === "error" && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[15px] text-red-800 dark:text-red-200">The comparison couldn't be run. Please try again.</p>
                <button type="button" onClick={compare} className={secondary}>Try again</button>
              </div>
            )}

            {comparison && target && <Answer target={target} comparison={comparison} advice={advice} adviceLoading={status === "advising"} />}
          </>
        )}
      </main>
    </div>
  );
}

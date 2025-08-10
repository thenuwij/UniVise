import RoadmapCard from "./RoadmapCard";
import CourseChip from "./CourseChip";

const TERM_ORDER = { T1: 1, T2: 2, T3: 3 };

function SumUoC(list = []) {
  return list.reduce((s, c) => s + (Number(c?.uoc) || 0), 0);
}

function TermColumn({ term }) {
  const total = SumUoC(term?.courses || []);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">{term.term}</div>
        <div className="text-xs rounded-full border border-slate-200 px-2 py-0.5">
          {total} UoC
        </div>
      </div>
      <ul className="space-y-2">
        {(term.courses || []).map((c, idx) => (
          <CourseChip
            key={c.code || idx}
            code={c.code}
            title={c.title}
            term={term.term}
            uoc={c.uoc}
            type={c.type}
          />
        ))}
        {(!term.courses || term.courses.length === 0) && (
          <li className="text-sm text-slate-500">No courses listed.</li>
        )}
      </ul>
    </div>
  );
}

function YearUNSW({ y }) {
  const terms = [...(y?.terms || [])].sort(
    (a, b) => (TERM_ORDER[a?.term] ?? 99) - (TERM_ORDER[b?.term] ?? 99)
  );
  const yearUoC = terms.reduce((s, t) => s + SumUoC(t?.courses || []), 0);

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium">Year {y?.year ?? "—"}</div>
        <div className="text-xs rounded-full border border-slate-200 px-2 py-0.5">
          Year total {yearUoC} UoC
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {terms.map((t, i) => <TermColumn key={i} term={t} />)}
      </div>
    </div>
  );
}

function YearSchool({ y }) {
  // Backward-compatible: original flat list rendering for “school” mode
  return (
    <div className="p-4 rounded-2xl border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-slate-300" />
        <div className="font-medium">Year {y?.year ?? "—"}</div>
      </div>

      {y?.overview && <p className="text-slate-700 mb-3">{y.overview}</p>}

      {Array.isArray(y?.courses) && y.courses.length > 0 ? (
        <ul className="space-y-2">
          {y.courses.map((c, j) => (
            <CourseChip key={j} code={c.code} title={c.title} term={c.term} uoc={c.uoc} type={c.type} />
          ))}
        </ul>
      ) : (
        <div className="text-sm text-slate-500">No courses listed.</div>
      )}
    </div>
  );
}

export default function ProgramStructure({ years = [], unsw = false }) {
  const hasUNSWShape = years.some((y) => Array.isArray(y?.terms));

  return (
    <RoadmapCard
      title="Program Structure"
      subtitle={unsw ? "UNSW-specific plan by year & term." : "General year-by-year structure."}
    >
      <div className="space-y-4">
        {/* UNSW layout: Year → T1/T2/T3 columns */}
        {unsw || hasUNSWShape ? (
          years.length ? (
            <div className="space-y-4">
              {years.map((y, i) => <YearUNSW key={i} y={y} />)}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No years found.</div>
          )
        ) : (
          // School layout fallback (original behavior)
          <div className="grid md:grid-cols-2 gap-4">
            {years.map((y, i) => <YearSchool key={i} y={y} />)}
          </div>
        )}
      </div>
    </RoadmapCard>
  );
}

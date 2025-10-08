import RoadmapCard from "./RoadmapCard";
import CourseChip from "./CourseChip";

const TERM_ORDER = { T1: 1, T2: 2, T3: 3 };

const isElective = (course) => {
  const kind = (course?.type || "").toLowerCase();
  if (!kind.includes("elective")) return false;
  return !kind.includes("core");
};

const normaliseTerm = (term) => {
  const label = typeof term === "string" ? term.toUpperCase() : term?.term?.toUpperCase();
  return TERM_ORDER[label] ? label : term?.term || label || "T?";
};

function YearSchool({ y }) {
  // Backward-compatible: original flat list rendering for “school” mode
  return (
    <div className="p-4 rounded-2xl border border-border-light dark:border-border-medium bg-card">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-accent dark:bg-secondary" />
        <div className="font-medium text-primary">Year {y?.year ?? "—"}</div>
      </div>

      {y?.overview && <p className="text-primary mb-3">{y.overview}</p>}

      {Array.isArray(y?.courses) && y.courses.length > 0 ? (
        <ul className="space-y-2">
          {y.courses.map((c, j) => (
            <CourseChip
              key={j}
              code={c.code}
              title={c.title}
              term={c.term}
              uoc={c.uoc}
              type={c.type}
            />
          ))}
        </ul>
      ) : (
        <div className="text-sm text-secondary">No courses listed.</div>
      )}
    </div>
  );
}

function summariseYear(year) {
  const terms = Array.isArray(year?.terms) ? year.terms : [];
  const details = [];
  const electiveTally = new Map();

  terms.forEach((term) => {
    const termName = normaliseTerm(term);
    (term?.courses || []).forEach((course, index) => {
      const entry = {
        ...course,
        term: termName,
        key: course?.code || `${termName}-${index}`,
      };

      if (isElective(course)) {
        electiveTally.set(termName, (electiveTally.get(termName) || 0) + 1);
        return;
      }

      const codeKey = course?.code || entry.key;
      const existing = details.find((item) => item.code && item.code === codeKey);
      if (existing) {
        existing.terms = Array.from(new Set([...(existing.terms || []), termName]));
      } else {
        details.push({
          ...entry,
          terms: [termName],
        });
      }
    });
  });

  return {
    yearNumber: year?.year ?? "—",
    coreCourses: details,
    electiveSlots: Array.from(electiveTally.entries()).map(([termName, count]) => ({ term: termName, count })),
  };
}

function CoreYearCard({ summary }) {
  const { yearNumber, coreCourses, electiveSlots } = summary;
  const keyTakeaway = coreCourses.length
    ? `${coreCourses.length} core ${coreCourses.length === 1 ? "course" : "courses"}`
    : "No core courses detected";

  return (
    <div className="rounded-2xl border border-border-light dark:border-border-medium bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-primary">Year {yearNumber}</div>
        <div className="text-xs rounded-full border border-border-light dark:border-border-medium px-2 py-0.5 text-secondary">
          {keyTakeaway}
        </div>
      </div>

      {coreCourses.length ? (
        <ul className="space-y-3">
          {coreCourses.map((course) => (
            <li key={course.key} className="flex flex-col">
              <div className="text-sm font-medium text-primary">
                {course.code ? `${course.code} — ${course.title ?? "Course"}` : course.title ?? "Course"}
              </div>
              <div className="text-xs text-secondary">
                {course.uoc ? `${course.uoc} UOC • ` : ""}
                {course.terms?.length ? `Offered ${course.terms.join(", ")}` : `Planned ${course.term}`}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-secondary">Core requirements could not be verified for this year.</div>
      )}

      <ElectiveSummary slots={electiveSlots} />
    </div>
  );
}

function ElectiveSummary({ slots }) {
  if (!slots?.length) {
    return (
      <p className="text-xs text-secondary bg-slate-900/20 dark:bg-slate-800/40 border border-border-light/80 dark:border-border-medium/60 rounded-xl px-3 py-2">
        No elective slots were surfaced for this year in the AI draft. Use the handbook to select electives that fit your goals.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border-light/70 dark:border-border-medium/60 bg-slate-900/20 dark:bg-slate-800/40 px-3 py-2 text-xs text-secondary">
      <div className="font-medium text-primary/80 mb-1">Elective slots to fill</div>
      <div className="flex flex-wrap gap-2">
        {slots.map(({ term, count }) => (
          <span key={term} className="inline-flex items-center gap-1 rounded-full bg-slate-900/40 dark:bg-slate-700/40 px-2 py-0.5">
            <span className="font-semibold text-primary/80">{term}</span>
            <span className="text-secondary">×{count}</span>
          </span>
        ))}
      </div>
      <p className="mt-1">
        Choose electives that meet stream or major rules. Explore the handbook or elective ideas below.
      </p>
    </div>
  );
}

function ElectiveGuidance({ suggestedSpecialisations = [], flexibilityOptions = [] }) {
  if (!suggestedSpecialisations.length && !flexibilityOptions.length) return null;

  return (
    <div className="rounded-2xl border border-border-light dark:border-border-medium bg-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-primary">Plan your electives</h3>
        <p className="text-xs text-secondary mt-1">
          Use these suggestions to shape majors, streams, or industry experiences. Confirm availability and rules in the UNSW Handbook.
        </p>
      </div>

      {suggestedSpecialisations.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-primary/80 uppercase tracking-wide">Suggested specialisations</div>
          <ul className="mt-2 space-y-1 text-sm text-primary">
            {suggestedSpecialisations.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {flexibilityOptions.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-primary/80 uppercase tracking-wide">Flexibility ideas</div>
          <ul className="mt-2 space-y-1 text-sm text-primary">
            {flexibilityOptions.map((option, index) => (
              <li key={`${option}-${index}`} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>{option}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-secondary">
        Tip: bring shortlisted electives into MyPlanner to experiment with workload before enrolling.
      </p>
    </div>
  );
}

export default function ProgramStructure({
  years = [],
  unsw = false,
  suggestedSpecialisations = [],
  flexibilityOptions = [],
}) {
  const hasUNSWShape = years.some((y) => Array.isArray(y?.terms));
  const renderUNSWView = unsw && hasUNSWShape;

  return (
    <RoadmapCard
      title="Program Structure"
      subtitle={unsw ? "UNSW-specific plan by year & term." : "General year-by-year structure."}
    >
      <div className="space-y-4">
        {renderUNSWView ? (
          years.length ? (
            <div className="space-y-4">
              {years.map((year, index) => (
                <CoreYearCard key={index} summary={summariseYear(year)} />
              ))}
              <ElectiveGuidance
                suggestedSpecialisations={suggestedSpecialisations}
                flexibilityOptions={flexibilityOptions}
              />
            </div>
          ) : (
            <div className="text-sm text-secondary">No verified structure was generated for this degree yet.</div>
          )
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {years.map((y, i) => <YearSchool key={i} y={y} />)}
          </div>
        )}
      </div>
    </RoadmapCard>
  );
}

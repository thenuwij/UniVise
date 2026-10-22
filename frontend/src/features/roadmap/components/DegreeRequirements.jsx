import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { UserAuth } from "@/app/AuthContext";
import { hasContent } from "@/shared/lib/format";
import FormattedText from "@/shared/ui/FormattedText";
import SectionHeading from "@/shared/ui/SectionHeading";
import { fetchChosenSpecialisations, parseSections } from "../utils/programCourses";

const levelOf = (title) => (/level\s*(\d+)/i.test(title) ? parseInt(title.match(/level\s*(\d+)/i)[1], 10) : 99);
const uocOf = (section) => section.uoc ?? (section.courses || []).reduce((sum, c) => sum + (Number(c?.uoc) || 0), 0);

function RequirementPart({ section }) {
  const uoc = uocOf(section);
  return (
    <div className="rounded-2xl bg-surface px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-ink-strong">{section.title}</h3>
        {uoc > 0 && (
          <span className="flex-shrink-0 text-sm text-ink-muted">{uoc} UOC</span>
        )}
      </div>
      {hasContent(section.description) && (
        <div className="mt-2">
          <FormattedText text={section.description} collapsedHeight="5.5rem" className="text-[15px] text-ink" maxWidth="max-w-none" />
        </div>
      )}
      {hasContent(section.notes) && (
        <div className="mt-2 pt-2 border-t border-line">
          <FormattedText text={section.notes} collapsedHeight="5.5rem" className="text-sm text-ink" maxWidth="max-w-none" />
        </div>
      )}
    </div>
  );
}

export default function DegreeRequirements({ degreeCode, onChangeSpecialisation }) {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [degree, setDegree] = useState(null);
  const [specs, setSpecs] = useState(null);

  useEffect(() => {
    if (!degreeCode) return;
    let active = true;
    supabase
      .from("unsw_degrees_final")
      .select("program_name, sections, minimum_uoc, special_notes")
      .eq("degree_code", degreeCode)
      .maybeSingle()
      .then(({ data }) => active && setDegree(data || {}));
    fetchChosenSpecialisations(degreeCode, userId).then((found) => active && setSpecs(found));
    return () => { active = false; };
  }, [degreeCode, userId]);

  if (!degree) return null;

  const groups = [
    {
      key: "program",
      label: "Program requirements",
      name: degree.program_name,
      parts: parseSections(degree.sections)
        .filter((s) => s?.title && !s.title.toLowerCase().includes("overview"))
        .sort((a, b) => levelOf(a.title) - levelOf(b.title)),
    },
    ...(specs || []).map((spec) => ({
      key: spec.id,
      label: spec.type === "Honours" ? "Honours specialisation" : spec.type || "Specialisation",
      name: spec.name,
      uoc: spec.uoc,
      parts: spec.sections,
    })),
  ].filter((g) => g.parts.length);

  return (
    <section className="space-y-6">
      <SectionHeading
        subtitle="What you need to complete to graduate. Tick your courses in the Courses step."
        action={
          degree.minimum_uoc ? (
            <p className="text-[15px] text-ink-muted">
              <span className="text-lg font-bold text-ink-strong">{degree.minimum_uoc} UOC</span> to graduate
            </p>
          ) : null
        }
      >
        Degree requirements
      </SectionHeading>

      {specs && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 px-6 py-5 dark:border-blue-900/70 dark:from-blue-950/50 dark:via-slate-900 dark:to-indigo-950/50">
          <div className="min-w-0">
            <div className="min-w-0">
              <p className="text-sm text-blue-700 dark:text-blue-300">Your specialisation</p>
              <p className="mt-0.5 text-lg font-semibold leading-snug text-ink-strong">
                {specs.length ? specs.map((sp) => sp.name).join(", ") : "None chosen yet"}
              </p>
            </div>
          </div>
          {onChangeSpecialisation && (
            <button
              onClick={onChangeSpecialisation}
              aria-label={specs.length ? "Change specialisation" : undefined}
              className="flex-shrink-0 rounded-xl bg-white px-4 py-2.5 text-[15px] font-semibold text-blue-800 shadow-sm hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800 transition-colors"
            >
              {specs.length ? "Change" : "Choose a specialisation"}
            </button>
          )}
        </div>
      )}

      {groups.map((g) => (
        <div key={g.key} className="space-y-3 pt-2">
          <div>
            <p className="text-sm text-ink-muted">
              {g.label}
              {g.uoc ? ` · ${g.uoc} UOC` : ""}
            </p>
            {g.name && <h3 className="mt-1 text-xl font-bold text-ink-strong">{g.name}</h3>}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {g.parts.map((section, i) => (
              <RequirementPart key={`${section.title}-${i}`} section={section} />
            ))}
          </div>
        </div>
      ))}

      {hasContent(degree.special_notes) && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Important information</h4>
          <FormattedText text={degree.special_notes} className="text-sm font-medium text-ink-strong" maxWidth="max-w-none" />
        </div>
      )}
    </section>
  );
}

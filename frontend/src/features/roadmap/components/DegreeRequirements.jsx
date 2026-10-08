import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { supabase } from "@/shared/lib/supabase";
import { UserAuth } from "@/app/AuthContext";
import { hasContent } from "@/shared/lib/format";
import FormattedText from "@/shared/ui/FormattedText";
import SectionHeading from "@/shared/ui/SectionHeading";
import { card } from "@/shared/ui/cardStyles";
import { fetchChosenSpecialisations, parseSections } from "../utils/programCourses";

const levelOf = (title) => (/level\s*(\d+)/i.test(title) ? parseInt(title.match(/level\s*(\d+)/i)[1], 10) : 99);
const uocOf = (section) => section.uoc ?? (section.courses || []).reduce((sum, c) => sum + (Number(c?.uoc) || 0), 0);

function RequirementPart({ section }) {
  const uoc = uocOf(section);
  return (
    <div className={`${card} px-5 py-4`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-ink-strong">{section.title}</h3>
        {uoc > 0 && (
          <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50">
            {uoc} UOC
          </span>
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
      .select("sections, minimum_uoc, special_notes")
      .eq("degree_code", degreeCode)
      .maybeSingle()
      .then(({ data }) => active && setDegree(data || {}));
    fetchChosenSpecialisations(degreeCode, userId).then((found) => active && setSpecs(found));
    return () => { active = false; };
  }, [degreeCode, userId]);

  if (!degree) return null;

  const parts = [
    ...parseSections(degree.sections)
      .filter((s) => s?.title && !s.title.toLowerCase().includes("overview"))
      .sort((a, b) => levelOf(a.title) - levelOf(b.title)),
    ...(specs || []).flatMap((spec) => spec.sections.map((sec) => ({ ...sec, title: `${spec.name}: ${sec.title}` }))),
  ];

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
        <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 dark:from-blue-950/60 dark:via-slate-900 dark:to-indigo-950/60 px-6 py-5">
          <div aria-hidden className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-white/50 dark:bg-white/5" />
          <div className="relative flex items-center gap-4 min-w-0">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 ring-1 ring-blue-200 dark:ring-blue-800">
              <Compass className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">Your specialisation</p>
              <p className="mt-1 text-lg sm:text-xl font-bold leading-snug text-ink-strong">
                {specs.length ? specs.map((sp) => sp.name).join(", ") : "None chosen yet"}
              </p>
            </div>
          </div>
          {onChangeSpecialisation && (
            <button
              onClick={onChangeSpecialisation}
              className="relative flex-shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:shadow-lg transition-all"
            >
              {specs.length ? "Change specialisation" : "Choose a specialisation"}
            </button>
          )}
        </div>
      )}

      {parts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {parts.map((section, i) => (
            <RequirementPart key={`${section.title}-${i}`} section={section} />
          ))}
        </div>
      )}

      {hasContent(degree.special_notes) && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Important information</h4>
          <FormattedText text={degree.special_notes} className="text-sm font-medium text-ink-strong" maxWidth="max-w-none" />
        </div>
      )}
    </section>
  );
}

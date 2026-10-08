import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Repeat } from "lucide-react";
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

export default function DegreeRequirements({ degreeCode, isOwnProgram, onChangeSpecialisation }) {
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
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm shadow-blue-600/20">
              {degree.minimum_uoc} UOC to graduate
            </span>
          ) : null
        }
      >
        Degree requirements
      </SectionHeading>

      {specs && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Specialisation</span>
          <span className="text-[15px] font-semibold text-ink-strong">
            {specs.length ? specs.map((s) => s.name).join(", ") : "None chosen yet"}
          </span>
          {onChangeSpecialisation && (
            <button
              onClick={onChangeSpecialisation}
              className="px-3 py-1 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              {specs.length ? "Change" : "Choose one"}
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
          <FormattedText text={degree.special_notes} className="text-sm font-medium text-ink-strong" />
        </div>
      )}

      {isOwnProgram && (
        <Link
          to="/progress"
          className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <span className="flex items-center gap-3">
            <Repeat className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-[15px] text-ink">Thinking of changing programs?</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-link">
            Switch Degree
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      )}
    </section>
  );
}

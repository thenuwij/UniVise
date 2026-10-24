import { ExternalLink } from "lucide-react";
import { card, clickable } from "@/shared/ui/cardStyles";
import { describeBody } from "@/features/roadmap/utils/professionalBodies";
import { SubLabel } from "./CareersSection";

export default function ProfessionalBodies({ societies }) {
  const profDev = societies?.professional_development || {};
  const bodies = profDev.professional_bodies || (profDev.student_chapters || []).map((name) => ({ name, url: null }));
  if (!bodies.length) return null;

  return (
    <div>
      <SubLabel hint="Join as a student member to meet people and grow in your field">Professional bodies</SubLabel>
      <div className={`mt-4 grid gap-4 ${bodies.length === 1 ? "" : bodies.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {bodies.map((body) => {
          const { short, about } = describeBody(body.name);
          const inner = (
            <>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 min-w-[3rem] h-12 px-2 rounded-xl inline-flex items-center justify-center text-sm font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-200 dark:ring-blue-800">
                  {short}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-ink-strong leading-snug break-words">{body.name}</p>
                  {about && <p className="mt-1 text-[15px] text-ink-muted leading-relaxed">{about}</p>}
                </div>
              </div>
              {body.url && (
                <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-link">
                  Visit website <ExternalLink className="h-4 w-4" />
                </span>
              )}
            </>
          );
          return body.url ? (
            <a
              key={body.name}
              href={body.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${card} ${clickable} flex flex-col p-5`}
            >
              {inner}
            </a>
          ) : (
            <div key={body.name} className="rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 flex flex-col p-5">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

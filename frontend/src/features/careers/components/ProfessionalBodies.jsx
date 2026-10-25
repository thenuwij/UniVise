import { ExternalLink } from "lucide-react";
import SaveButton from "@/shared/ui/SaveButton";
import { card } from "@/shared/ui/cardStyles";
import { describeBody } from "@/features/roadmap/utils/professionalBodies";
import { SubLabel } from "./CareersSection";

export default function ProfessionalBodies({ societies }) {
  const profDev = societies?.professional_development || {};
  const bodies = profDev.professional_bodies || (profDev.student_chapters || []).map((name) => ({ name, url: null }));
  if (!bodies.length) return null;
  return (
    <div>
      <SubLabel hint="Join as a student member to meet people and grow in your field">Professional bodies</SubLabel>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bodies.map((body) => {
          const { short, about } = describeBody(body.name);
          return (
            <div key={body.name} className={`${card} flex flex-col p-5`}>
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-xl bg-blue-50 px-2 text-sm font-extrabold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">{short}</span>
                <SaveButton itemType="professional_body" itemId={body.name} itemName={body.name} itemData={{ ...body, description: about }} />
              </div>
              <p className="mt-3 text-lg font-bold leading-snug text-ink-strong">{body.name}</p>
              {about && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{about}</p>}
              {body.url && <a href={body.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-link hover:underline">Visit website <ExternalLink className="h-4 w-4" /></a>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

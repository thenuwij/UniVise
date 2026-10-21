import { ExternalLink, Library } from "lucide-react";
import { SubLabel } from "./CareersSection";

const RESOURCES = [
  { name: "UNSWConnect", desc: "Internships, part-time jobs and graduate roles", url: "https://unswconnect.unsw.edu.au" },
  { name: "UNSW Prosple", desc: "Graduate programs and early career opportunities", url: "https://unsw.prosple.com" },
];

export default function CareerResources() {
  return (
    <div>
      <SubLabel icon={Library} hint="Job boards run by UNSW Careers">UNSW career resources</SubLabel>
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {RESOURCES.map(({ name, desc, url }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 hover:border-blue-300 hover:bg-surface-tint transition-colors"
          >
            <span>
              <span className="block text-base font-medium text-ink-strong group-hover:text-link">{name}</span>
              <span className="block text-sm text-ink-muted">{desc}</span>
            </span>
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-ink-muted group-hover:text-link" />
          </a>
        ))}
      </div>
    </div>
  );
}

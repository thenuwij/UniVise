import { officialHandbookHref } from "@/shared/lib/handbook";
import { ExternalLink } from "lucide-react";

export function SourceLink({ href, children }) {
  return (
    <a href={officialHandbookHref(href)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 hover:underline">
      {children} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

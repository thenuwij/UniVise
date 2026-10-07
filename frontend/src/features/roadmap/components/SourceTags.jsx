import { ExternalLink } from "lucide-react";

export function SourceLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 hover:underline">
      {children} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

export function AiSuggestedTag() {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 ring-1 ring-slate-200 dark:ring-slate-600">
      AI-suggested
    </span>
  );
}

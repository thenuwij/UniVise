import { useState } from "react";
import { X } from "lucide-react";
import IndependenceNotice from "./IndependenceNotice";

export const BANNER_DISMISSED_KEY = "independence-banner-dismissed";

function isDismissed() {
  try {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function IndependenceBanner({ innerClassName = "px-6 py-2" }) {
  const [dismissed, setDismissed] = useState(isDismissed);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, "1");
    } catch {
      return;
    }
  };

  return (
    <div className="border-y border-line bg-slate-50 dark:bg-slate-900">
      <div className={`flex items-start justify-between gap-3 ${innerClassName}`}>
        <IndependenceNotice />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notice"
          className="-m-1 shrink-0 rounded p-1 text-ink-muted hover:bg-slate-200 hover:text-ink-strong dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

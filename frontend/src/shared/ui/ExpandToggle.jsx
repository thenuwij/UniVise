import ExpandIcon from "./ExpandIcon";
import { ChevronDown } from "lucide-react";

export default function ExpandToggle({ open, onClick, children, wide = false, large = false, quiet = false, plain = false, as: Tag = "button" }) {
  if (plain) {
    return (
      <Tag
        {...(Tag === "button" ? { type: "button", onClick, "aria-expanded": open } : {})}
        className="mt-2 inline-flex items-center text-sm font-semibold text-link underline-offset-4 hover:underline"
      >
        {children}
      </Tag>
    );
  }
  if (quiet) {
    return (
      <Tag
        {...(Tag === "button" ? { type: "button", onClick, "aria-expanded": open } : {})}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[15px] font-semibold text-link shadow-sm ring-1 ring-slate-300 hover:bg-slate-50 hover:ring-blue-400 dark:bg-slate-900 dark:ring-slate-600 dark:hover:bg-slate-800 transition-colors"
      >
        {children}
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </Tag>
    );
  }
  const size = wide
    ? "mt-5 w-full justify-center px-5 py-3 rounded-2xl text-base"
    : large
      ? "pl-5 pr-2 py-2 rounded-full text-base"
      : "pl-4 pr-1.5 py-1.5 rounded-full text-sm";
  return (
    <Tag
      {...(Tag === "button" ? { type: "button", onClick, "aria-expanded": open } : {})}
      className={`group inline-flex items-center gap-2 font-bold text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/50 ring-1 ring-blue-300 dark:ring-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors ${size}`}
    >
      {children}
      <ExpandIcon open={open} small />
    </Tag>
  );
}

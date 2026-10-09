import { ChevronDown } from "lucide-react";

export default function ExpandIcon({ open, small = false }) {
  return (
    <span className={`inline-flex flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm group-hover:bg-blue-700 transition-colors ${small ? "h-6 w-6" : "h-9 w-9"}`}>
      <ChevronDown className={`transition-transform duration-200 ${open ? "rotate-180" : ""} ${small ? "h-4 w-4" : "h-5 w-5"}`} strokeWidth={3} />
    </span>
  );
}

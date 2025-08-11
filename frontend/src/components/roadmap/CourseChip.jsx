import TermBadge from "./TermBadge";

export default function CourseChip({ code, title, term, uoc, type }) {
  return (
    <li className="px-3 py-2 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
      <div className="min-w-0">
        <div className="truncate">
          <span className="font-medium">{code}</span>
          {title && <span className="text-slate-600 ml-2">{title}</span>}
        </div>
        {(uoc || type) && (
          <div className="text-xs text-slate-500 mt-0.5">
            {uoc ? `${uoc} UoC` : null}{uoc && type ? " · " : null}{type || null}
          </div>
        )}
      </div>
      <TermBadge term={term} />
    </li>
  );
}

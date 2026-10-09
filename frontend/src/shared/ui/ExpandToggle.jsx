import ExpandIcon from "./ExpandIcon";

export default function ExpandToggle({ open, onClick, children, wide = false, large = false, as: Tag = "button" }) {
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

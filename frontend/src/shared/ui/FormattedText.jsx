import { useEffect, useMemo, useRef, useState } from "react";
import { toBlocks } from "@/shared/lib/format";

export default function FormattedText({ text, collapsedHeight = "14rem", className = "text-base text-ink", lists = true, maxWidth = "max-w-[72ch]" }) {
  const blocks = useMemo(() => toBlocks(text, { lists }), [text, lists]);
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded || !collapsedHeight) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [blocks, expanded, collapsedHeight]);

  if (!blocks.length) return null;

  const collapsed = collapsedHeight && !expanded;

  return (
    <div>
      <div
        ref={ref}
        className={`${maxWidth} space-y-3 leading-relaxed ${collapsed ? "overflow-hidden" : ""} ${className}`}
        style={
          collapsed
            ? {
                maxHeight: collapsedHeight,
                maskImage: clamped ? "linear-gradient(to bottom, black 75%, transparent)" : undefined,
                WebkitMaskImage: clamped ? "linear-gradient(to bottom, black 75%, transparent)" : undefined,
              }
            : undefined
        }
      >
        {blocks.map((block, i) => {
          if (block.type === "ol") {
            return (
              <ol key={i} className="list-decimal pl-6 space-y-1.5 marker:font-semibold marker:text-link">
                {block.items.map((item, j) => <li key={j}>{item}</li>)}
              </ol>
            );
          }
          if (block.type === "ul") {
            return (
              <ul key={i} className={`list-disc pl-6 space-y-1 marker:text-link ${block.items.length > 8 ? "sm:columns-2 sm:gap-8" : ""}`}>
                {block.items.map((item, j) => <li key={j} className="break-inside-avoid">{item}</li>)}
              </ul>
            );
          }
          return <p key={i}>{block.text}</p>;
        })}
      </div>
      {(clamped || expanded) && (
        <button onClick={() => setExpanded(!expanded)} className="mt-2 text-sm font-semibold text-link hover:underline">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

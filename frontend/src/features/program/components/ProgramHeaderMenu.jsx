import { useEffect, useRef, useState } from "react";
import { Ellipsis, ExternalLink } from "lucide-react";

const ITEM = "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-strong hover:bg-surface-tint";

export default function ProgramHeaderMenu({ handbookLink, onTour, onExplore }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!wrapper.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (action) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/35 text-white transition-colors hover:bg-white/10"
      >
        <Ellipsis className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-30 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-lg">
          {handbookLink && (
            <a href={handbookLink} target="_blank" rel="noopener noreferrer" role="menuitem" className={ITEM}>
              Program rules on UNSW Handbook <ExternalLink className="ml-auto h-4 w-4 text-ink-muted" aria-hidden="true" />
            </a>
          )}
          {onTour && <button type="button" role="menuitem" onClick={choose(onTour)} className={ITEM}>How this page works</button>}
          <button type="button" role="menuitem" onClick={choose(onExplore)} className={ITEM}>Explore a different degree</button>
        </div>
      )}
    </div>
  );
}

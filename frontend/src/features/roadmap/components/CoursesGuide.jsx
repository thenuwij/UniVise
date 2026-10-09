import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowBigDown, ArrowRight, X } from "lucide-react";
import { markCoursesGuideSeen } from "../utils/coursesGuide";

const STEPS = [
  { title: "Tick what you've done", text: "Tick the box next to each course you've finished. Each part shows how much is left." },
  { title: "See what's next", text: "CourseMesh shows what your ticked courses unlock and which ones you can take next." },
];

const CARD_W = 320;
const GAP = 14;
const ARROW = 44;

function findTarget(step) {
  if (step === 0) {
    return document.querySelector('[data-tour="course-tick"][aria-checked="false"]') || document.querySelector('[data-tour="course-tick"]');
  }
  return document.querySelector('[data-tour="coursemesh-strip"]');
}

export default function CoursesGuide({ onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardH, setCardH] = useState(170);
  const cardRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const finish = () => {
    markCoursesGuideSeen();
    closeRef.current();
  };

  useEffect(() => {
    const el = findTarget(step);
    if (!el) {
      if (step + 1 < STEPS.length) setStep(step + 1);
      else finish();
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const track = () => {
      const r = el.getBoundingClientRect();
      setRect((prev) =>
        prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height }
      );
    };
    track();
    const timer = setInterval(track, 100);
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [step]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [step, rect]);

  if (!rect) return null;

  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_W, vw - 24);
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(Math.max(centerX - width / 2, 12), vw - width - 12);
  const below = rect.top + rect.height + GAP + ARROW + cardH < vh;
  const top = Math.min(Math.max(12, below ? rect.top + rect.height + GAP + ARROW : rect.top - GAP - ARROW - cardH), vh - cardH - 12);
  const arrowTop = below ? rect.top + rect.height + 4 : rect.top - ARROW - 4;
  const pad = 6;

  return createPortal(
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div
        aria-hidden
        className="absolute rounded-xl ring-4 ring-blue-400 transition-all duration-300"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        }}
      />
      <ArrowBigDown
        aria-hidden
        className={`absolute h-11 w-11 fill-blue-500 text-blue-600 drop-shadow-lg animate-bounce ${below ? "rotate-180" : ""}`}
        style={{ top: arrowTop, left: centerX - 22 }}
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-label={current.title}
        className="pointer-events-auto absolute rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 shadow-2xl p-4 transition-all duration-300"
        style={{ top, left, width }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Step {step + 1} of {STEPS.length}
          </p>
          <button onClick={finish} aria-label="Close guide" className="-mt-1 -mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-lg font-bold text-ink-strong">{current.title}</p>
        <p className="mt-1 text-sm text-ink-muted leading-relaxed">{current.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button onClick={finish} className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Skip
          </button>
          <button
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition-colors"
          >
            {last ? "Got it" : "Next"}
            {!last && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

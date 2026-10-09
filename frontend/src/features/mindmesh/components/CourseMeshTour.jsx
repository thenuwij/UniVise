import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowBigDown, ArrowLeft, ArrowRight, Check, Hand, Mouse, MousePointer2, MousePointerClick, X } from "lucide-react";
import { markGuideSeen } from "../utils/onboarding";

const STEPS = [
  { target: "node", title: "This is a course", text: "Each box is a course. Green means done, blue you can take next, grey not yet. Lines lead to the courses it unlocks." },
  { target: "graph", inside: true, title: "Try it: zoom and move", text: "Zoom in or out, then drag an empty spot to move the map.", waitFor: "zoom-pan", demo: "both" },
  { target: "node", title: "Try it: click a course", text: "Click this course, or any other box, to see what it needs.", waitFor: "course", demo: "click" },
  { target: "course-card", title: "What a course needs", text: "Ticks show what you've already done. Press Mark as done when you finish a course." },
  { target: "node", title: "Try it: double-click a course", text: "Double-click opens the courses it needs, one level deeper.", waitFor: "expand", demo: "dblclick" },
  { target: "view-tools", title: "Find your way back", text: "Undo steps back and Reset view returns to the full map. Fit to screen brings every course into view, and Arrange by level lines them up from level 1 to 4." },
  { target: "suggested", title: "Suggested next", text: "Courses that fit your goals. Open it any time." },
  { target: "plan-actions", title: "Keep your plan up to date", text: "Tick finished courses in your roadmap, and add any course you plan to take." },
];

const CARD_W = 320;
const GAP = 16;
const ARROW = 44;

function DemoStep({ done, children }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${done ? "bg-green-50 dark:bg-green-950/40" : "bg-blue-50 dark:bg-blue-950/50"}`}>
      {children}
      {done && <Check className="ml-auto h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={3} />}
    </div>
  );
}

function Demo({ kind, progress }) {
  if (kind === "both") {
    return (
      <div className="mt-3 space-y-2">
        <DemoStep done={progress.zoomed}>
          <span className="relative">
            <Mouse className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="tour-anim absolute left-1/2 top-2 -ml-[2px] h-2 w-1 rounded-full bg-blue-600 dark:bg-blue-400" style={{ animation: "tour-scroll 1.2s ease-in-out infinite" }} />
          </span>
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Scroll or pinch to zoom</span>
        </DemoStep>
        <DemoStep done={progress.moved}>
          <Hand className="tour-anim h-8 w-8 text-blue-600 dark:text-blue-400" style={{ animation: "tour-drag 1.6s ease-in-out infinite" }} />
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Drag an empty spot to move</span>
        </DemoStep>
      </div>
    );
  }
  if (kind === "click" || kind === "dblclick") {
    const double = kind === "dblclick";
    return (
      <div className="mt-3 flex items-center justify-center gap-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 py-4">
        <span className="relative inline-flex">
          <span className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-sm">COMP2521</span>
          <span className="absolute -bottom-3 -right-3 inline-flex">
            <span className="tour-anim absolute inset-0 m-auto h-7 w-7 rounded-full border-2 border-blue-500" style={{ animation: double ? "tour-dblclick 2s ease-out infinite" : "tour-click 1.8s ease-out infinite" }} />
            <MousePointer2 className="relative h-6 w-6 fill-white text-blue-700 dark:fill-slate-900 dark:text-blue-300" />
          </span>
        </span>
        <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">{double ? "Click twice, quickly" : "Click once"}</span>
      </div>
    );
  }
  return null;
}

export default function CourseMeshTour({ open, onClose, focusedId, expandCount, getTransform, getNodeRect }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardH, setCardH] = useState(170);
  const [progress, setProgress] = useState({ zoomed: false, moved: false });
  const cardRef = useRef(null);
  const direction = useRef(1);
  const baseline = useRef(null);
  const expandBase = useRef(expandCount);
  const live = useRef({ onClose, getTransform, getNodeRect, expandCount });
  live.current = { onClose, getTransform, getNodeRect, expandCount };

  const finish = () => {
    markGuideSeen();
    live.current.onClose();
  };

  const advance = () => {
    direction.current = 1;
    setStep((s) => (s + 1 < STEPS.length ? s + 1 : s));
  };

  useEffect(() => {
    if (open) {
      direction.current = 1;
      setStep(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const current = STEPS[step];
    baseline.current = live.current.getTransform();
    expandBase.current = live.current.expandCount;
    let missing = 0;
    let prev = null;
    let panned = 0;
    let zoomed = false;
    setProgress({ zoomed: false, moved: false });

    const track = () => {
      const r = current.target === "node" ? live.current.getNodeRect() : document.querySelector(`[data-tour="${current.target}"]`)?.getBoundingClientRect();
      if (!r || r.width === 0 || r.height === 0) {
        missing += 1;
        if (missing === 3) {
          const next = step + direction.current;
          if (next < 0 || next >= STEPS.length) finish();
          else setStep(next);
        }
        return;
      }
      missing = 0;
      setRect((prev) =>
        prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height }
      );

      const t = live.current.getTransform();
      if (!baseline.current && t) baseline.current = t;
      const b = baseline.current;
      if (current.waitFor === "zoom-pan" && t && b) {
        if (Math.abs(t.k - b.k) / b.k > 0.08) zoomed = true;
        if (prev && Math.abs(t.k - prev.k) / prev.k < 0.01) panned += Math.hypot(t.x - prev.x, t.y - prev.y) * t.k;
        prev = t;
        const moved = panned > 60;
        setProgress((p) => (p.zoomed === zoomed && p.moved === moved ? p : { zoomed, moved }));
        if (zoomed && panned > 60) advance();
      }
      if (current.waitFor === "expand" && live.current.expandCount > expandBase.current) advance();
    };

    track();
    const timer = setInterval(track, 200);
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, step]);

  const focusedAtStart = useRef(focusedId);

  useEffect(() => {
    focusedAtStart.current = focusedId;
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && STEPS[step].waitFor === "course" && focusedId && focusedId !== focusedAtStart.current) advance();
  }, [open, step, focusedId]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [step, rect]);

  if (!open || !rect) return null;

  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const go = (delta) => {
    direction.current = delta;
    const next = step + delta;
    if (next >= STEPS.length) finish();
    else setStep(Math.max(0, next));
  };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = current.inside ? 4 : 8;
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(Math.max(centerX - CARD_W / 2, 12), vw - CARD_W - 12);

  let top;
  let below = true;
  if (current.inside) {
    top = rect.top + 72;
  } else {
    below = rect.top + rect.height + GAP + ARROW + cardH < vh;
    top = below ? rect.top + rect.height + GAP + ARROW : rect.top - GAP - ARROW - cardH;
  }
  top = Math.min(Math.max(12, top), vh - cardH - 12);
  const arrowTop = below ? rect.top + rect.height + 6 : rect.top - ARROW - 6;

  return createPortal(
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div
        aria-hidden
        className="absolute rounded-2xl ring-4 ring-blue-400 transition-all duration-300"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: `0 0 0 9999px rgba(15, 23, 42, ${current.inside ? 0.3 : 0.55})`,
        }}
      />
      {!current.inside && (
        <ArrowBigDown
          aria-hidden
          className={`tour-anim absolute h-11 w-11 fill-blue-500 text-blue-600 drop-shadow-lg animate-bounce ${below ? "rotate-180" : ""}`}
          style={{ top: arrowTop, left: centerX - 22 }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-label={current.title}
        className="pointer-events-auto absolute rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 shadow-2xl p-4 transition-all duration-300"
        style={{ top, left, width: CARD_W }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-blue-600" : i < step ? "w-1.5 bg-blue-300" : "w-1.5 bg-slate-200 dark:bg-slate-700"}`} />
            ))}
          </div>
          <button onClick={finish} aria-label="Skip tour" className="-mt-1 -mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-lg font-bold text-ink-strong">{current.title}</p>
        <p className="mt-1 text-sm text-ink-muted leading-relaxed">{current.text}</p>
        {current.demo && <Demo kind={current.demo} progress={progress} />}
        {current.waitFor && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <MousePointerClick className="h-4 w-4" />
            Give it a go. The tour moves on when you do.
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button onClick={finish} className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => go(-1)}
                aria-label="Previous step"
                className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-blue-700 dark:text-blue-200 bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => go(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition-colors"
            >
              {last ? "Done" : "Next"}
              {!last && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Hand,
  LayoutGrid,
  ListChecks,
  Maximize2,
  MousePointerClick,
  Move,
  Network,
  Plus,
  RotateCcw,
  Sparkles,
  X,
  ZoomIn,
} from "lucide-react";
import { STATUS } from "../utils/availability";
import { markGuideSeen } from "../utils/onboarding";

function Row({ icon: Icon, title, text }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex-shrink-0 h-9 w-9 rounded-xl inline-flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-100 dark:ring-blue-900">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span>
        <span className="block text-[15px] font-semibold text-ink-strong">{title}</span>
        <span className="block text-sm text-ink-muted">{text}</span>
      </span>
    </li>
  );
}

function CourseBox({ code, color }) {
  return (
    <span className="px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm" style={{ backgroundColor: color }}>
      {code}
    </span>
  );
}

const STEPS = [
  {
    title: "Welcome to CourseMesh",
    lead: "CourseMesh shows how the courses in your program connect.",
    body: () => (
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-950/50 dark:to-slate-900">
          <CourseBox code="COMP1511" color={STATUS.completed.color} />
          <span className="h-0.5 w-10 bg-blue-500 relative">
            <span className="absolute -right-1 -top-[5px] border-y-[6px] border-y-transparent border-l-[8px] border-l-blue-500" />
          </span>
          <CourseBox code="COMP2521" color={STATUS.available.color} />
        </div>
        <ul className="space-y-3">
          <Row icon={Network} title="Each box is a course" text="It shows the course code and its units of credit (UOC)." />
          <Row icon={ArrowRight} title="Lines show what a course unlocks" text="An arrow goes from a course to the courses that need it first." />
        </ul>
      </div>
    ),
  },
  {
    title: "What the colours mean",
    lead: "Colours come from the courses you've ticked as done.",
    body: () => (
      <ul className="space-y-3">
        {[
          ["completed", "You've ticked it as done."],
          ["available", "Everything it needs is done, so you can take it."],
          ["locked", "Something it needs is still missing."],
          ["not_needed", "You picked a different option from the same choice."],
        ].map(([key, text]) => (
          <li key={key} className="flex items-center gap-3">
            <span className="flex-shrink-0 h-8 w-12 rounded-lg shadow-sm" style={{ backgroundColor: STATUS[key].color }} />
            <span>
              <span className="block text-[15px] font-semibold text-ink-strong">{STATUS[key].label}</span>
              <span className="block text-sm text-ink-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: "Moving around",
    lead: "The graph works like a map.",
    body: () => (
      <ul className="space-y-3">
        <Row icon={ZoomIn} title="Scroll to zoom" text="Use your mouse wheel or pinch on a trackpad." />
        <Row icon={Hand} title="Drag the background to move" text="Click on an empty spot and drag." />
        <Row icon={Move} title="Drag a course to move it" text="Handy when boxes overlap." />
        <Row icon={Maximize2} title="Fit to screen" text="Brings every course back into view." />
        <Row icon={LayoutGrid} title="Arrange by level" text="Lines courses up from level 1 to level 4." />
      </ul>
    ),
  },
  {
    title: "Exploring a course",
    lead: "Click any course to learn more about it.",
    body: () => (
      <ul className="space-y-3">
        <Row icon={MousePointerClick} title="Click a course" text="A card shows what it needs, ticked off against what you've done." />
        <Row icon={ListChecks} title="Read the checklist" text={`"One of" means any single course from that group is enough.`} />
        <Row icon={Check} title="Mark as done" text="Tick a course right from the card, and the colours update." />
        <Row icon={Network} title="Double-click to dig deeper" text="Opens that course's own prerequisites." />
        <Row icon={RotateCcw} title="Undo and Reset view" text="Step back, or return to the full graph." />
      </ul>
    ),
  },
  {
    title: "Plan what's next",
    lead: "Use CourseMesh alongside your roadmap.",
    body: () => (
      <ul className="space-y-3">
        <Row icon={Sparkles} title="Suggested next" text="Courses that fit your goals, at the top right of the graph." />
        <Row icon={ListChecks} title="Tick courses in your roadmap" text="Keep your completed courses up to date so the colours stay right." />
        <Row icon={Plus} title="Add electives" text="Add the electives you plan to take so they appear here." />
      </ul>
    ),
  },
];

export default function WelcomeModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    const onKey = (e) => {
      if (e.key === "Escape") {
        markGuideSeen();
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const close = () => {
    markGuideSeen();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="coursemesh-guide-title" className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-navy via-brand-blue to-brand-indigo dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 px-6 py-5">
          <div aria-hidden className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-blue-300/20" />
          <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-band-soft">CourseMesh guide · {step + 1} of {STEPS.length}</p>
          <h2 id="coursemesh-guide-title" className="relative mt-1 text-2xl font-extrabold text-band-ink">{current.title}</h2>
          <p className="relative mt-1 text-[15px] text-band-soft">{current.lead}</p>
          <button
            onClick={close}
            aria-label="Close guide"
            className="absolute top-4 right-4 h-9 w-9 inline-flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 min-h-[18rem]">{current.body()}</div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-line">
          <div className="flex items-center gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.title} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-blue-600" : "w-2 bg-blue-200 dark:bg-slate-700"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step === 0 ? (
              <button onClick={close} className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink-strong hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Skip
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              onClick={last ? close : () => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              {last ? "Start exploring" : "Next"}
              {!last && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

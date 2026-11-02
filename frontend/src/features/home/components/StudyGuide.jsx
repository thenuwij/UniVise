import { useEffect } from "react";

const STEPS = [
  {
    title: "Explore My Program",
    points: ["Tick the courses you've already done.", "Open Next courses to see what you can take next.", "Open CourseMesh to see how your courses connect."],
  },
  {
    title: "Explore My Career",
    points: ["Look through Jobs and Internships.", "Check Networking, Certifications and Career outlook."],
  },
  {
    title: "Ask Eunice",
    points: ["Ask a question about your courses or career.", "For example: which electives suit the career I want?"],
  },
];

export default function StudyGuide({ onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="study-guide" className="my-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
        <h2 id="study-guide" className="text-2xl font-bold text-ink-strong">Your usability test: 3 steps</h2>
        <p className="mt-1 text-[15px] text-ink-muted">Follow these in order and take your time. All of them are in the menu at the top of the page.</p>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <p className="font-bold text-ink-strong">
                <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-sm text-white">{index + 1}</span>
                {step.title}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-slate-600 dark:text-slate-300">
                {step.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-slate-200 pt-4 text-[15px] font-medium text-ink-strong dark:border-slate-700">When you've finished all 3 steps, complete the post-experiment questionnaire. Thank you for taking part!</p>
        <button type="button" autoFocus onClick={onClose} className="button-primary mt-5 w-full rounded-xl px-6 py-3 text-base font-semibold sm:w-auto">I got it</button>
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { TERMS_CONTACT, TERMS_OPERATOR } from "../data/termsContent";

export function LegalDocument({ id, title, meta, summary, sections, scrollable = true }) {
  return (
    <article className={scrollable ? "max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600" : ""}>
      <h1 className="mb-3 text-2xl font-bold text-ink-strong">{title}</h1>
      <p className="mb-6 text-sm text-ink-muted">{meta}</p>
      <div className="mb-6 rounded-xl border border-line bg-slate-50 p-4 dark:bg-slate-800">
        <p className="mb-2 text-sm font-semibold text-ink-strong">In short</p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink">
          {summary.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </div>
      <nav aria-label={`${title} contents`} className="mb-8">
        <p className="mb-3 font-semibold text-ink-strong">Contents</p>
        <ol className="space-y-2 text-sm sm:columns-2 sm:gap-6">
          {sections.map((section) => (
            <li key={section.id} className="break-inside-avoid">
              <a href={`#${id}-${section.id}`} className="text-link underline-offset-2 hover:underline">{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`${id}-${section.id}`} className="mt-8">
          <h2 id={`${id}-${section.id}`} className="mb-4 scroll-mt-4 text-xl font-semibold text-ink-strong">{section.title}</h2>
          {section.paragraphs.map((paragraph, index) => <p key={index} className="mb-4 leading-relaxed text-ink">{paragraph}</p>)}
        </section>
      ))}
      <p className="mt-8 border-t border-line pt-4 text-sm text-ink-muted">
        {TERMS_OPERATOR} · <a href={`mailto:${TERMS_CONTACT}`} className="text-link underline">{TERMS_CONTACT}</a>
        {" · "}<Link to="/terms" className="text-link underline">Terms and conditions</Link>
        {" · "}<Link to="/privacy" className="text-link underline">Privacy Policy</Link>
      </p>
    </article>
  );
}

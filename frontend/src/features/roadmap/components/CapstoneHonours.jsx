import { ChevronDown, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import SectionHeading from "@/shared/ui/SectionHeading";
import { useState } from "react";

const honoursRuleSet = (faculty = "") => {
  const f = faculty.toLowerCase();
  if (/business|commerce|economics/.test(f)) return "Business School";
  if (f.includes("engineering")) return "Engineering";
  return "UNSW";
};

export default function CapstoneHonours({ data, handbookUrl, faculty, children }) {
  const [activeTab, setActiveTab] = useState(0);
  const [honoursOpen, setHonoursOpen] = useState(false);

  const formatTextContent = (text) => {
    if (!text) return text;
    
    const textStr = typeof text === 'string' ? text : String(text);
    const paragraphs = textStr.split(/\n\n+/);
    
    return paragraphs.map((para, idx) => {
      return para.trim() && (
        <p key={idx} className="leading-relaxed">
          {para.trim()}
        </p>
      );
    });
  };

  const summary = data?.summary;

  const honours = data?.honours || {};
  const {
    classes = [],
    entryCriteria,
    structure,
    calculation,
    requirements,
    wamRestrictions,
    progressionRules,
    awards,
    careerOutcomes,
  } = honours;

  const overviewSections = [
    { title: "Entry Criteria", text: entryCriteria },
    { title: "Program Structure", text: structure },
    { title: "Honours Calculation", text: calculation },
    { title: "Academic Requirements", text: requirements },
    { title: "WAM & Eligibility Rules", text: wamRestrictions },
    { title: "Progression Rules", text: progressionRules },
  ].filter((s) => s.text);

  const honoursTabs = [
    {
      label: "Entry",
      sections: overviewSections.filter(s => ["Entry Criteria", "Program Structure"].includes(s.title))
    },
    {
      label: "Grades & calculation",
      sections: overviewSections.filter(s => ["Honours Calculation", "WAM & Eligibility Rules"].includes(s.title)),
      extra: "classes"
    },
    {
      label: "Requirements",
      sections: overviewSections.filter(s => ["Academic Requirements", "Progression Rules"].includes(s.title))
    },
    {
      label: "Awards & careers",
      sections: [],
      extra: "awards"
    }
  ].filter(tab => tab.sections.length > 0 || tab.extra);

  const hasHonours = overviewSections.length > 0 || classes.length > 0 || awards || careerOutcomes;

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800 [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      {summary && (
        <section>
          <SectionHeading>About this program</SectionHeading>
          <p className="mt-6 text-base md:text-[17px] leading-relaxed text-slate-700 dark:text-slate-300">{summary}</p>
        </section>
      )}

      {children}

      {hasHonours && (
        <section>
          <div className="overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 dark:from-blue-950/60 dark:via-slate-900 dark:to-indigo-950/60">
            <button
              type="button"
              onClick={() => setHonoursOpen((open) => !open)}
              aria-expanded={honoursOpen}
              className="group w-full flex items-center justify-between gap-4 px-6 md:px-8 py-5 text-left"
            >
              <span className="min-w-0">
                <span className="block text-lg font-semibold text-slate-900 dark:text-slate-100">Honours: general {honoursRuleSet(faculty)} rules</span>
                <span className="mt-1 block text-[15px] text-slate-500 dark:text-slate-400">These are the faculty's general rules. Check the Handbook for your program's exact Honours rules.</span>
              </span>
              <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800 shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-colors">
                {honoursOpen ? "Hide rules" : "Show rules"}
                <ChevronDown className={`h-4 w-4 transition-transform ${honoursOpen ? "rotate-180" : ""}`} />
              </span>
            </button>
            {honoursOpen && (
              <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2">
                <div className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {honoursTabs.map((tab, i) => (
                      <button
                        key={tab.label}
                        onClick={() => setActiveTab(i)}
                        className={`relative px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                          activeTab === i ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        {activeTab === i && (
                          <motion.span layoutId="honours-tab" className="absolute inset-0 rounded-lg bg-white dark:bg-slate-700 shadow" transition={{ type: "spring", stiffness: 450, damping: 38 }} />
                        )}
                        <span className="relative">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  {honoursTabs[activeTab]?.sections.map((sec) => (
                    <div key={sec.title}>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{sec.title}</h4>
                      <div className="mt-1.5 text-[17px] text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">{formatTextContent(sec.text)}</div>
                    </div>
                  ))}

                  {honoursTabs[activeTab]?.extra === "classes" && classes.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">Classes of honours</h4>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {classes.map((cls) => (
                          <span key={cls} className="px-3.5 py-1.5 rounded-full text-sm font-medium text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/30">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {honoursTabs[activeTab]?.extra === "awards" && (
                    <>
                      {awards && (
                        <div>
                          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">Awards and recognition</h4>
                          <div className="mt-1.5 text-[17px] text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">{formatTextContent(awards)}</div>
                        </div>
                      )}
                      {careerOutcomes && (
                        <div>
                          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">Career paths and further study</h4>
                          <div className="mt-1.5 text-[17px] text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">{formatTextContent(careerOutcomes)}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {handbookUrl && (
        <div>
          <a
            href={handbookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 shadow-sm hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View this program in the official UNSW Handbook
          </a>
        </div>
      )}
    </div>
  );
}

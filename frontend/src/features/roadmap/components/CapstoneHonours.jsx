import { ChevronRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { getLevelColor } from "@/features/mindmesh/utils";
import SectionHeading from "@/shared/ui/SectionHeading";
import { card, clickable } from "@/shared/ui/cardStyles";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase";


export default function CapstoneHonours({ data, handbookUrl }) {
  const navigate = useNavigate();
  const [validCourses, setValidCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch and validate courses on mount
  useEffect(() => {
    const fetchValidCourses = async () => {
      const capstoneCourses = data?.capstone?.courses || [];
      if (capstoneCourses.length === 0) {
        setLoadingCourses(false);
        return;
      }

      // Extract course codes
      const courseCodes = capstoneCourses
        .map(course => {
          if (typeof course === "string") {
            const match = course.match(/[A-Z]{4}\d{4}/i);
            return match ? match[0].toUpperCase() : null;
          } else if (typeof course === "object") {
            return course.code || null;
          }
          return null;
        })
        .filter(Boolean);

      if (courseCodes.length === 0) {
        setLoadingCourses(false);
        return;
      }

      // Fetch from database
      try {
        const { data: courseData, error } = await supabase
          .from("unsw_courses")
          .select("id, code, title")
          .in("code", courseCodes);

        if (!error && courseData) {
          setValidCourses(courseData);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
      
      setLoadingCourses(false);
    };

    fetchValidCourses();
  }, [data?.capstone?.courses]);

  const handleCourseClick = (courseId) => {
    if (courseId) navigate(`/course/${courseId}`);
  };

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

  const highlights = data?.capstone?.highlights;

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
  const levelOf = (code) => Number(String(code).match(/\d/)?.[0]) || null;

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800 [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      {highlights && (
        <section>
          <SectionHeading>What makes this program special</SectionHeading>
          <p className="mt-6 text-base md:text-[17px] leading-relaxed text-slate-700 dark:text-slate-300">{highlights}</p>
        </section>
      )}

      {!loadingCourses && validCourses.length > 0 && (
        <section>
          <SectionHeading>Key courses</SectionHeading>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {validCourses.map((course) => {
              const level = levelOf(course.code);
              return (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className={`${card} ${clickable} group flex items-center justify-between gap-3 px-6 py-5 text-left`}
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wider" style={{ color: getLevelColor(level) }}>
                      {level ? `Level ${level}` : "Course"}
                    </span>
                    <span className="mt-1 block text-lg font-bold text-slate-900 dark:text-white">{course.code}</span>
                    <span className="block text-[15px] text-slate-600 dark:text-slate-300 line-clamp-2">{course.title}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {hasHonours && (
        <section>
          <SectionHeading>Honours</SectionHeading>
          <div className={`${card} mt-6 p-6 md:p-8`}>
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
        </section>
      )}

      {handbookUrl && (
        <div>
          <a
            href={handbookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <ExternalLink className="h-4 w-4" />
            Official UNSW Handbook
          </a>
        </div>
      )}
    </div>
  );
}

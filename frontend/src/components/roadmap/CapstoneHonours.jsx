import { Award, BookOpen, CheckCircle2, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";


export default function CapstoneHonours({ data }) {
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

  const highlights = data?.capstone?.highlights || "—";

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
    { title: "Entry Criteria", text: entryCriteria, icon: CheckCircle2 },
    { title: "Program Structure", text: structure, icon: BookOpen },
    { title: "Honours Calculation", text: calculation, icon: TrendingUp },
    { title: "Academic Requirements", text: requirements, icon: Award },
    { title: "WAM & Eligibility Rules", text: wamRestrictions, icon: Star },
    { title: "Progression Rules", text: progressionRules, icon: CheckCircle2 },
  ].filter((s) => s.text);

  const honoursTabs = [
    {
      label: "Overview",
      sections: overviewSections.filter(s => ["Entry Criteria", "Program Structure"].includes(s.title))
    },
    {
      label: "Grades & Calculation",
      sections: overviewSections.filter(s => ["Honours Calculation", "WAM & Eligibility Rules"].includes(s.title)),
      extra: "classes"
    },
    {
      label: "Requirements",
      sections: overviewSections.filter(s => ["Academic Requirements", "Progression Rules"].includes(s.title))
    },
    {
      label: "Awards & Careers",
      sections: [],
      extra: "awards"
    }
  ].filter(tab => tab.sections.length > 0 || tab.extra);

  return (
    <>

      {/* CAPSTONE SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6">

        
       {/* Header - COMPACT */}
        <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                        px-6 py-4 -mx-6 -mt-6 mb-5 border-b-2 border-slate-200 dark:border-slate-700
                        rounded-t-2xl">
          
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
              <BookOpen className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Program Highlights
            </h2>
          </div>
        </div>

        {/* Courses Grid - Only show if valid courses exist */}
        {!loadingCourses && validCourses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Featured Courses
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {validCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="group relative p-4 rounded-xl border-2 border-slate-300 dark:border-slate-700
                            bg-white dark:bg-slate-900
                            hover:bg-gradient-to-br hover:from-blue-100/80 hover:to-indigo-100/60
                            dark:hover:from-blue-900/30 dark:hover:to-indigo-900/20
                            shadow-md hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500
                            hover:-translate-y-1 transition-all duration-200 cursor-pointer
                            text-left w-full"
                >
                  <div className="mb-4">
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400 tracking-tight mb-2">
                      {course.code}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug font-medium line-clamp-2">
                      {course.title}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200 dark:border-slate-700">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-bold group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      View Course Details
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform font-bold text-lg">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            What Makes This Program Special
          </h3>
          <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium line-clamp-4">
            {highlights}
          </p>
        </div>
      </div>

      {/* HONOURS SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6">
        
        {/* Header - COMPACT */}
        <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                        px-6 py-4 -mx-6 -mt-6 mb-5 border-b-2 border-slate-200 dark:border-slate-700
                        rounded-t-2xl">
          
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
              <Award className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Honours Program
            </h2>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-5 border border-slate-200 dark:border-slate-700">
          {honoursTabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                activeTab === i
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md border-blue-500"
                  : "text-slate-600 dark:text-slate-300 border-blue-700 dark:border-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/20 hover:text-slate-800 dark:hover:text-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {honoursTabs[activeTab]?.sections.map((sec, i) => (
            <div key={i} className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{sec.title}</h3>
              <div className="text-base text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                {formatTextContent(sec.text)}
              </div>
            </div>
          ))}

          {honoursTabs[activeTab]?.extra === "classes" && classes.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Classification Grades</h3>
              <div className="flex flex-wrap gap-2">
                {classes.map((cls, i) => (
                  <span key={i} className="px-4 py-2 text-sm font-semibold bg-purple-50 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-xl text-purple-700 dark:text-purple-300">
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}

          {honoursTabs[activeTab]?.extra === "awards" && (
            <div className="space-y-4">
              {awards && (
                <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Awards & Recognition
                  </h3>
                  <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">{formatTextContent(awards)}</div>
                </div>
              )}
              {careerOutcomes && (
                <div className="p-5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-300 dark:border-indigo-700">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Career Paths & Further Study
                  </h3>
                  <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">{formatTextContent(careerOutcomes)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* No Data Message */}
        {!(overviewSections.length || classes.length || awards || careerOutcomes) && (
          <div className="text-center py-12 px-6 rounded-xl border-2 border-slate-300 dark:border-slate-600
                        bg-slate-50 dark:bg-slate-800/50">
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
              No Honours information available for this program.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
import { Award, BookOpen, CheckCircle2, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";


export default function CapstoneHonours({ data }) {
  const navigate = useNavigate();
  const [validCourses, setValidCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

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

  return (
    <div className="space-y-6">

      {/* CAPSTONE SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-xl">

        {/* Top Accent Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 rounded-t-2xl" />
        
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
                  className="group relative p-6 rounded-xl border-2 border-slate-300 dark:border-slate-700
                            bg-white dark:bg-slate-900
                            shadow-md hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500
                            hover:-translate-y-1 transition-all duration-200 cursor-pointer
                            text-left w-full"
                >
                  <div className="mb-4">
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400 tracking-tight mb-2">
                      {course.code}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug font-medium line-clamp-2">
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
        <div className="p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50
                      dark:from-slate-800/60 dark:via-slate-800/80 dark:to-slate-800/60
                      rounded-xl border-2 border-slate-300 dark:border-slate-600 shadow-md">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            What Makes This Program Special
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {highlights}
          </p>
        </div>
      </div>

      {/* HONOURS SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-xl">
        {/* Top Accent Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-t-2xl" />
        
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

        {/* Overview Sections */}
        {overviewSections.length > 0 && (
          <div className="space-y-4 mb-6">
            {overviewSections.map((sec, i) => {
              const IconComponent = sec.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-xl border-2 border-slate-300 dark:border-slate-700
                          bg-white dark:bg-slate-900
                          shadow-md"
                >
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                    {sec.title}
                  </h3>
                  <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed font-medium">
                    {formatTextContent(sec.text)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Honours Classification */}
        {classes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Honours Classification Grades
            </h3>
            <div className="flex flex-wrap gap-3">
              {classes.map((cls, i) => (
                <span
                  key={i}
                  className="px-5 py-3 text-base font-bold
                             bg-purple-50 dark:bg-purple-900/30
                             border-2 border-purple-300 dark:border-purple-700
                             rounded-xl text-purple-700 dark:text-purple-300 shadow-sm"
                >
                  {cls}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Awards & Recognition */}
        {awards && (
          <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50
                        dark:from-amber-900/20 dark:to-orange-900/20 
                        border-2 border-amber-300 dark:border-amber-700 shadow-md">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              Awards & Recognition
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed font-medium">
              {formatTextContent(awards)}
            </div>
          </div>
        )}

        {/* Career Outcomes */}
        {careerOutcomes && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50
                        dark:from-indigo-900/20 dark:to-purple-900/20 
                        border-2 border-indigo-300 dark:border-indigo-700 shadow-md">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Career Paths & Further Study
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed font-medium">
              {formatTextContent(careerOutcomes)}
            </div>
          </div>
        )}

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
    </div>
  );
}
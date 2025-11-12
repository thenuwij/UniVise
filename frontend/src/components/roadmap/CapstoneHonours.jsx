import GradientCard from "../GradientCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Award, BookOpen, TrendingUp, CheckCircle2, Star } from "lucide-react";

/**
 * Premium Capstone & Honours Component
 * 
 * Sophisticated design with:
 * - Elegant blue/sky/indigo gradients
 * - Enhanced visual hierarchy
 * - Premium card layouts
 * - Professional typography
 */
export default function CapstoneHonours({ data }) {
  const navigate = useNavigate();

  const handleCourseClick = async (course) => {
    const text = typeof course === "string" ? course : course.code || "";
    const match = text.match(/[A-Z]{4}\d{4}/i);

    if (!match) {
      console.warn("No valid course code found in:", text);
      return;
    }

    const code = match[0].toUpperCase();

    const { data: matchData, error } = await supabase
      .from("unsw_courses")
      .select("id")
      .ilike("code", code)
      .maybeSingle();

    if (error) console.error(error);
    if (matchData?.id) navigate(`/course/${matchData.id}`);
    else console.warn("Course not found in DB:", code);
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

  const capstoneCourses = data?.capstone?.courses || [];
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
    <div className="space-y-8">
      {/* ========== CAPSTONE SECTION ========== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
        {/* Top Accent Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 rounded-t-2xl" />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm">
            <BookOpen className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Capstone Experience
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Key courses featuring applied, project-based learning
            </p>
          </div>
        </div>

        {/* Courses Grid */}
        {capstoneCourses.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">
              Capstone Courses
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {capstoneCourses.map((course, i) => {
                let code = "";
                let name = "";

                if (typeof course === "string") {
                  const match = course.match(/[A-Z]{4}\d{4}/i);
                  if (match) {
                    code = match[0].toUpperCase();
                    name = course.replace(match[0], "").trim();
                  } else {
                    code = course;
                  }
                } else if (typeof course === "object") {
                  code = course.code || "";
                  name = course.name || "";
                }

                return (
                  <div
                    key={i}
                    onClick={() => handleCourseClick(course)}
                    className="group relative p-5 rounded-xl border border-blue-200/70 dark:border-blue-700/70
                              bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100
                              dark:from-blue-950/30 dark:via-sky-950/20 dark:to-indigo-950/30
                              hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500
                              hover:bg-gradient-to-br hover:from-blue-50 hover:via-sky-50 hover:to-indigo-50
                              hover:-translate-y-1 transition-all duration-300 cursor-pointer"

                  >
                    <div className="mb-3">
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400 tracking-tight">
                        {code}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-snug line-clamp-2">
                        {name || "Capstone Course"}
                      </p>
                    </div>

                    <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-150">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                        View Details
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Highlights */}
        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 
                      dark:from-slate-800/50 dark:to-slate-800/30 
                      rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
            Key Highlights
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {highlights}
          </p>
        </div>
      </div>

      {/* ========== HONOURS SECTION ========== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
        {/* Top Accent Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500 rounded-t-2xl shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl shadow-sm">
            <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Honours Program
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Entry requirements, structure, and grading details for the Honours year.
            </p>
          </div>
        </div>

        {/* Overview Sections */}
        {overviewSections.length > 0 && (
          <div className="space-y-6 mb-8">
            {overviewSections.map((sec, i) => {
              const IconComponent = sec.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-slate-200 dark:border-slate-700
                          bg-gradient-to-br from-slate-50 via-white to-slate-100/70 
                          dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/70
                          shadow-sm transition-colors duration-200"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex-1">
                      {sec.title}
                    </h3>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed pl-11">
                    {formatTextContent(sec.text)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Honours Classification */}
        {classes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">
              Honours Classification
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {classes.map((cls, i) => (
                <span
                  key={i}
                  className="px-4 py-2 text-sm font-semibold
                             bg-gradient-to-r from-blue-50 to-indigo-50 
                             dark:from-blue-900/20 dark:to-indigo-900/20
                             border border-blue-200 dark:border-blue-700
                             rounded-lg text-blue-700 dark:text-blue-300 shadow-sm"
                >
                  {cls}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Awards & Recognition */}
        {awards && (
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 
                        dark:from-amber-900/10 dark:to-orange-900/10 
                        border border-amber-200/60 dark:border-amber-800/60">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Awards & Recognition
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
              {formatTextContent(awards)}
            </div>
          </div>
        )}

        {/* Career Outcomes */}
        {careerOutcomes && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 
                        dark:from-indigo-900/10 dark:to-purple-900/10 
                        border border-indigo-200/60 dark:border-indigo-700/60">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Career & Further Study
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
              {formatTextContent(careerOutcomes)}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!(overviewSections.length || classes.length || awards || careerOutcomes) && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
            No Honours information available for this program.
          </div>
        )}
      </div>
    </div>
  );
}
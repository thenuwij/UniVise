import GradientCard from "../GradientCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";


/**
 * Capstone & Honours combined section (stacked layout)
 * - Capstone full width on top
 * - Honours below with smoother narrative and visual hierarchy
 * - Enhanced text formatting for detailed honours information
 */
export default function CapstoneHonours({ data }) {

  const navigate = useNavigate();

  const handleCourseClick = async (course) => {
    const text = typeof course === "string" ? course : course.code || "";
    const match = text.match(/[A-Z]{4}\d{4}/i); // find something like ACTL3142

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

  /**
   * Format text content to be more readable:
   * - Simply displays text as paragraphs
   * - Preserves paragraph breaks
   * - No conversion to bullet lists
   */
  const formatTextContent = (text) => {
    if (!text) return text;
    
    // Ensure text is a string
    const textStr = typeof text === 'string' ? text : String(text);
    
    // Split by double newlines to preserve paragraphs
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
    { title: "Entry Criteria", text: entryCriteria },
    { title: "Program Structure", text: structure },
    { title: "Honours Calculation", text: calculation },
    { title: "Academic Requirements", text: requirements },
    { title: "WAM & Eligibility Rules", text: wamRestrictions },
    { title: "Progression Rules", text: progressionRules },
  ].filter((s) => s.text);

  return (
    <div className="space-y-10">
      {/* ---------- CAPSTONE ---------- */}
      <GradientCard
        className="relative overflow-hidden backdrop-blur-md border border-slate-200/60
                   dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 
                   shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                   transition-all duration-300 rounded-2xl"
      >
        <div
          className="absolute inset-x-0 top-0 h-1.5 
                     bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-t-2xl"
        />
        <div className="p-7 space-y-6">
          <h2
            className="text-2xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 
                       bg-clip-text text-transparent"
          >
            Capstone
          </h2>

          {/* --- Courses Section (card-style) --- */}
          {capstoneCourses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                Courses
              </h3>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {capstoneCourses.map((course, i) => {
                  // support "CODE – Name" or object structure later
                  // Extract course code (e.g., ACTL3142) and name
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
                    className="group relative flex flex-col justify-between
                              p-4 rounded-xl border border-sky-200/50 dark:border-sky-800/50
                              bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/40 dark:to-indigo-900/40
                              text-slate-800 dark:text-slate-200
                              hover:shadow-lg hover:scale-[1.02]
                              transition-all duration-200 cursor-pointer"
                  >
                    <div>
                      <p className="text-lg font-bold text-sky-700 dark:text-sky-300 tracking-tight leading-snug">
                        {code}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                        {name || "Capstone Course"}
                      </p>
                    </div>

                    <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-sky-500 dark:text-sky-400 font-medium">
                        View Details →
                      </span>
                    </div>
                  </div>
                                    );
                })}
              </div>
            </div>
          )}

          {/* --- Highlights --- */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Highlights
            </h3>
            <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
              {highlights}
            </p>
          </div>
        </div>
      </GradientCard>

      {/* ---------- HONOURS SECTION ---------- */}
      <GradientCard
        className="relative overflow-hidden backdrop-blur-md border border-slate-200/60
                   dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 
                   shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                   transition-all duration-300 rounded-2xl"
      >
        <div
          className="absolute inset-x-0 top-0 h-1.5 
                     bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-t-2xl"
        />

        <div className="p-8 space-y-8">
          <h2
            className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 
                       bg-clip-text text-transparent drop-shadow-sm"
          >
            Honours Details
          </h2>

          {overviewSections.length > 0 && (
            <div className="space-y-6">
              {overviewSections.map((sec, i) => (
                <div
                  key={i}
                  className={`pl-4 border-l-4 border-sky-200 dark:border-sky-800 ${
                    i !== overviewSections.length - 1
                      ? "pb-6 border-b border-slate-200/40 dark:border-slate-700/40"
                      : ""
                  }`}
                >
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    {sec.title}
                  </h3>
                  <div className="text-[15px] text-slate-700 dark:text-slate-300 space-y-3">
                    {formatTextContent(sec.text)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {classes.length > 0 && (
            <div className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-base font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300 mb-3">
                Honours Classification
              </h3>
              <ul className="flex flex-wrap gap-2">
                {classes.map((cls, i) => (
                  <span
                    key={i}
                    className="inline-block px-3 py-1 text-sm font-medium
                               bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-sky-900/30 dark:to-indigo-900/30
                               border border-sky-200/40 dark:border-sky-700/40
                               rounded-full text-blue-700 dark:text-sky-300 shadow-sm"
                  >
                    {cls}
                  </span>
                ))}
              </ul>
            </div>
          )}

          {awards && (
            <div className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Awards & Recognition
              </h3>
              <div className="text-[15px] text-slate-700 dark:text-slate-300 space-y-3">
                {formatTextContent(awards)}
              </div>
            </div>
          )}

          {careerOutcomes && (
            <div className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Career & Further Study
              </h3>
              <div className="text-[15px] text-slate-700 dark:text-slate-300 space-y-3">
                {formatTextContent(careerOutcomes)}
              </div>
            </div>
          )}

          {!(
            overviewSections.length ||
            classes.length ||
            awards ||
            careerOutcomes
          ) && <p className="text-slate-500 italic">No Honours information available.</p>}
        </div>
      </GradientCard>
    </div>
  );
}
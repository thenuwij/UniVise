// src/components/roadmap/ProgramFlexibility.jsx
import { ArrowRight, CheckCircle2, Info, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function ProgramFlexibility({
  flexibility,
  roadmapId,
  degreeCode,
  userId,
  simulatorLink = "/switching",
}) {
  const easySwitches =
    flexibility?.easy_switches ||
    flexibility?.flexibility_detailed?.easy_switches ||
    [];

  const [degreeLinks, setDegreeLinks] = useState({});
  const [shouldShowFlexibility, setShouldShowFlexibility] = useState(null);

  // Check if flexibility should be shown based on courses
  useEffect(() => {
    const checkIfShouldShow = async () => {
      if (!degreeCode || !userId) {
        setShouldShowFlexibility(false);
        return;
      }

      try {
        // Check if degree has courses
        const { data: degreeData } = await supabase
          .from("unsw_degrees_final")
          .select("sections")
          .eq("degree_code", degreeCode)
          .maybeSingle();

        let hasDegreeCourses = false;
        if (degreeData?.sections) {
          const sections = typeof degreeData.sections === "string" 
            ? JSON.parse(degreeData.sections) 
            : degreeData.sections;
          hasDegreeCourses = sections.some(s => s.courses?.length > 0);
        }

        // Check if user has selected specializations
        const { data: userSpecs } = await supabase
          .from("user_specialisation_selections")
          .select("honours_id, major_id, minor_id")
          .eq("user_id", userId)
          .eq("degree_code", degreeCode)
          .maybeSingle();

        const hasSpecs = !!(userSpecs?.honours_id || userSpecs?.major_id || userSpecs?.minor_id);

        // If has specs, check if they have courses
        let hasSpecCourses = false;
        if (hasSpecs) {
          const specIds = [userSpecs.honours_id, userSpecs.major_id, userSpecs.minor_id].filter(Boolean);
          
          const { data: specData } = await supabase
            .from("unsw_specialisations")
            .select("sections")
            .in("id", specIds);

          if (specData) {
            hasSpecCourses = specData.some(spec => {
              const sections = typeof spec.sections === "string" 
                ? JSON.parse(spec.sections) 
                : spec.sections;
              return sections.some(s => s.courses?.length > 0);
            });
          }
        }

        setShouldShowFlexibility(hasDegreeCourses || hasSpecCourses);
      } catch (err) {
        console.error("Error checking flexibility eligibility:", err);
        setShouldShowFlexibility(false);
      }
    };

    checkIfShouldShow();
  }, [degreeCode, userId]);

  useEffect(() => {
    async function fetchIds() {
      const mapping = {};

      for (const opt of easySwitches) {
        if (!opt.program_name) continue;

        // Use the ID directly from flexibility data if available
        if (opt.id) {
          mapping[opt.program_name] = opt.id;
          continue;
        }

        // Try exact match first
        let { data, error } = await supabase
          .from("unsw_degrees_final")
          .select("id")
          .eq("program_name", opt.program_name)
          .maybeSingle();

        // Fallback to ilike if exact match fails
        if (!data?.id) {
          const result = await supabase
            .from("unsw_degrees_final")
            .select("id")
            .ilike("program_name", `%${opt.program_name}%`)
            .limit(1)
            .maybeSingle();
          
          data = result.data;
          error = result.error;
        }

        if (data?.id) {
          mapping[opt.program_name] = data.id;
        } else {
          console.warn(`Could not find degree ID for: ${opt.program_name}`);
        }
      }

      setDegreeLinks(mapping);
    }

    if (easySwitches.length > 0) {
      fetchIds();
    }
  }, [easySwitches]);

  const hasNewData = easySwitches?.length > 0;

  const LoadingShimmer = () => (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-24" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-24" />
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
      
    {/* HEADER */}
    <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                    px-8 py-6 -mx-8 -mt-8 mb-6 border-b-2 border-slate-200 dark:border-slate-700
                    rounded-t-2xl">
      
      {/* Very subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
      
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
          <RefreshCw className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Program Flexibility
        </h3>
      </div>
    </div>

    <div className="mt-6 mb-8 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 
                    dark:from-blue-900/20 dark:to-indigo-900/20 
                    border-2 border-blue-300 dark:border-blue-700 shadow-md flex items-start gap-3">

      {/* Info icon */}
      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />

      {/* Info text */}
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
        The programs listed below show the most compatible degrees to switch into, 
        based on course overlap with your current program
        {easySwitches.some(opt => opt.specialisation) ? (
          <>
            {" "}and selected specialisations. When a specific specialisation is recommended 
            (shown with a purple badge), it means that specialisation significantly improves 
            your course transfer options compared to the base program alone.
          </>
        ) : (
          <>
            . This analysis focuses on core program structure. For recommendations that include 
            specialisation pathways, try regenerating your roadmap after selecting majors, minors, 
            or honours in the Specialisations section.
          </>
        )}
      </p>
    </div>

      {/* DEGREE OPTIONS */}
      {hasNewData && (
        <div className="space-y-5 mb-8">
          {easySwitches.map((opt, i) => {
            const overlap = opt.overlap_percentage || 0;
            const benefits = Array.isArray(opt.key_benefits)
              ? opt.key_benefits
              : typeof opt.key_benefits === "string"
              ? opt.key_benefits.split(/[,•;]/).map((b) => b.trim())
              : [];

            return (
              <div
                key={i}
                className="relative p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600
                          bg-white dark:bg-slate-900
                          shadow-md hover:shadow-lg
                          transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg 
                                     bg-gradient-to-br from-blue-100 to-indigo-100 
                                     dark:from-blue-900/40 dark:to-indigo-900/40 
                                     border-2 border-blue-300 dark:border-blue-700
                                     text-blue-700 dark:text-blue-300 text-sm font-bold shadow-sm">
                        {i + 1}
                      </span>
                      <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 leading-tight">
                        {opt.program_name}
                      </h3>
                    </div>
                    
                    {opt.specialisation && (
                      <div className="ml-11 mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                                    bg-gradient-to-r from-purple-100 to-pink-100 
                                    dark:from-purple-900/40 dark:to-pink-900/40
                                    border-2 border-purple-300 dark:border-purple-700 shadow-sm">
                        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-bold text-purple-800 dark:text-purple-200">
                          {opt.specialisation.name} ({opt.specialisation.type})
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 ml-11 mt-2 font-medium">
                      <span className="font-bold">Faculty:</span>{" "}
                      <span className="text-slate-700 dark:text-slate-300">
                        {opt.faculty || "—"}
                      </span>
                    </p>
                  </div>

                  {/* Overlap Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 text-sm font-bold rounded-xl 
                                   bg-gradient-to-r from-blue-50 to-indigo-50 
                                   dark:from-blue-900/30 dark:to-indigo-900/30
                                   border-2 border-blue-300 dark:border-blue-700
                                   text-blue-700 dark:text-blue-300 shadow-sm">
                      {overlap.toFixed(0)}% Course Overlap
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 via-sky-500 to-indigo-500 
                               dark:from-blue-500 dark:via-sky-600 dark:to-indigo-600 
                               transition-all duration-700 ease-out relative overflow-hidden"
                      style={{ width: `${overlap}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                    animate-shimmer" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {overlap >= 90 ? "Excellent match" : overlap >= 70 ? "Strong match" : "Good match"} - 
                    Most of your courses transfer directly
                  </p>
                </div>

                {/* Reason */}
                {opt.reason && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-5 leading-relaxed font-medium">
                    {opt.reason}
                  </p>
                )}

                {/* Key Benefits */}
                {benefits.length > 0 && (
                  <div className="mb-5">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                      Key Benefits:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {benefits.map(
                        (b, j) =>
                          b && (
                            <span
                              key={j}
                              className="px-3 py-2 rounded-lg text-sm font-bold
                                        bg-gradient-to-r from-indigo-50 to-blue-50 
                                        dark:from-indigo-900/30 dark:to-blue-900/30
                                        border-2 border-indigo-300 dark:border-indigo-700
                                        text-indigo-700 dark:text-indigo-300
                                        shadow-sm"
                            >
                              {b}
                            </span>
                          )
                      )}
                    </div>
                  </div>
                )}

                {/* Shared Courses */}
                {Array.isArray(opt.shared_courses) && opt.shared_courses.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 
                                dark:from-slate-800/60 dark:to-slate-800/80 
                                rounded-xl border-2 border-slate-300 dark:border-slate-600 mb-5 shadow-sm">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                      Shared Courses ({opt.shared_courses.length}):
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-mono font-medium">
                      {opt.shared_courses.join(" • ")}
                    </p>
                  </div>
                )}

                {/* View Details Button */}
                <div className="flex justify-end pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                  {degreeLinks[opt.program_name] ? (
                    <Link
                      to={`/degrees/${degreeLinks[opt.program_name]}`}
                      className="group/btn inline-flex items-center gap-2 px-5 py-3 rounded-xl 
                                text-sm font-bold text-white
                                bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                                hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600
                                shadow-lg hover:shadow-xl hover:-translate-y-0.5
                                transition-all duration-200"
                    >
                      View Full Details
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <span className="text-sm italic text-slate-400 flex items-center gap-2 font-medium">
                      <div className="animate-spin h-4 w-4 border-2 border-slate-300 border-t-blue-500 rounded-full" />
                      Loading...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LOADING/NO DATA STATE */}
      {!hasNewData && (
        <>
        
          {shouldShowFlexibility === null && (
            <div className="mb-8">
              <LoadingShimmer />
            </div>
          )}

          {shouldShowFlexibility === false && (
            <div className="mb-8">
              <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50
                            dark:from-slate-800/60 dark:via-slate-800/80 dark:to-slate-800/60 
                            border-2 border-slate-300 dark:border-slate-600 shadow-md">
                <div className="flex items-start gap-3 mb-3">
                  <Info className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                      Flexibility Information Unavailable
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      Detailed degree switching recommendations are not available for this program. 
                      This typically occurs when the program structure doesn't include specific course 
                      listings in our database. For more information about switching programs, visit the
                      <span className="font-bold text-blue-600 dark:text-blue-400"> My Planner </span> 
                      section or contact UNSW Student Central.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {shouldShowFlexibility === true && (
            <div className="mb-8">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 
                            dark:from-blue-900/20 dark:to-indigo-900/20 
                            border-2 border-blue-300 dark:border-blue-700 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-300 border-t-blue-600 rounded-full flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-blue-700 dark:text-blue-300 mb-2">
                      Generating Degree Flexibility...
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed font-medium">
                      Finding compatible degree switching options based on course overlap.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
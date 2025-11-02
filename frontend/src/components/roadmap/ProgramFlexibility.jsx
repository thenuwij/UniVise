// src/components/roadmap/ProgramFlexibility.jsx
import RoadmapCard from "./RoadmapCard";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function ProgramFlexibility({
  flexibility,
  switchOptions = [],
  simulatorLink = "/switching",
}) {
  console.log("ProgramFlexibility received:", flexibility);

  const easySwitches =
    flexibility?.easy_switches ||
    flexibility?.flexibility_detailed?.easy_switches ||
    [];


  const [degreeLinks, setDegreeLinks] = useState({});

  useEffect(() => {
    async function fetchIds() {
      const mapping = {};

      for (const opt of easySwitches) {
        if (!opt.program_name) continue;

        const { data, error } = await supabase
          .from("unsw_degrees")
          .select("id")
          .ilike("program_name", `%${opt.program_name}%`)
          .maybeSingle();

        if (data?.id) {
          mapping[opt.program_name] = data.id;
        }
      }

      setDegreeLinks(mapping);
    }

    if (easySwitches.length > 0) {
      fetchIds();
    }
  }, [easySwitches]);


  const hasNewData = easySwitches?.length > 0;
  const hasOldData = switchOptions?.length > 0;

  const LoadingShimmer = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
    </div>
  );

  return (
    <RoadmapCard
      title="Program Flexibility"
      subtitle="Easiest degree switch options and related programs to consider."
    >
      {hasNewData && (
        <div className="space-y-5">
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
                className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                           bg-white/60 dark:bg-slate-800/50 p-5 shadow-sm 
                           hover:shadow-md hover:border-sky-300 dark:hover:border-sky-500 
                           transition-all duration-200 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold text-sky-800 dark:text-sky-300 text-lg leading-tight">
                      {i + 1}. {opt.program_name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Faculty:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {opt.faculty || "—"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 text-xs font-medium rounded-full 
                                 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
                    >
                      {overlap.toFixed(0)}% overlap
                    </span>
                  </div>
                </div>

                <div className="mt-2 w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-500 dark:to-indigo-600 transition-all duration-500"
                    style={{ width: `${overlap}%` }}
                  ></div>
                </div>

                {opt.fit_summary && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {opt.fit_summary}
                  </p>
                )}

                {opt.reason && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
                    {opt.reason}
                  </p>
                )}

                {benefits.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {benefits.map(
                      (b, j) =>
                        b && (
                          <span
                            key={j}
                            className="px-2 py-1 rounded-lg text-xs 
                                       bg-sky-50 dark:bg-slate-700/60 
                                       text-sky-800 dark:text-sky-200 border 
                                       border-sky-100 dark:border-slate-600"
                          >
                            {b}
                          </span>
                        )
                    )}
                  </div>
                )}

                {Array.isArray(opt.shared_courses) && opt.shared_courses.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                    Shared courses:{" "}
                    <span className="text-slate-600 dark:text-slate-300">
                      {opt.shared_courses.join(", ")}
                    </span>
                  </p>
                )}

                <div className="flex justify-end mt-5">
                  {degreeLinks[opt.program_name] ? (
                    <Link
                      to={`/degrees/${degreeLinks[opt.program_name]}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg 
                                text-sm font-medium text-sky-700 dark:text-sky-200 
                                bg-gradient-to-r from-sky-100 to-indigo-100 
                                dark:from-sky-900/40 dark:to-indigo-900/40
                                border border-sky-200/60 dark:border-sky-700/60 
                                shadow-sm hover:shadow-md hover:-translate-y-[1px]
                                hover:from-sky-200 hover:to-indigo-200
                                dark:hover:from-sky-800/60 dark:hover:to-indigo-800/60
                                transition-all duration-200"
                    >
                      View details
                      <span className="text-sky-600 dark:text-sky-300 group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </Link>
                  ) : (
                    <span className="text-sm italic text-slate-400">Fetching link...</span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {!hasNewData && hasOldData && (
        <div className="space-y-3 text-primary">
          <div>
            <span className="font-medium">Suggested switch options:</span>{" "}
            {switchOptions.join(", ")}
          </div>
        </div>
      )}

      {!hasNewData && !hasOldData && (
        <div className="flex flex-col gap-3">
          <div className="text-slate-500 dark:text-slate-400 italic">
            Generating flexibility recommendations...
          </div>
          <LoadingShimmer />
        </div>
      )}

      <div className="mt-6">
        <Link
          to={simulatorLink}
          className="inline-block px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 
                     bg-sky-50 dark:bg-slate-800/40 hover:bg-sky-100 dark:hover:bg-slate-700/60 
                     text-sky-700 dark:text-sky-300 transition-colors duration-200 text-sm font-medium"
        >
          Open Switching Major Simulator
        </Link>
      </div>
    </RoadmapCard>
  );
}

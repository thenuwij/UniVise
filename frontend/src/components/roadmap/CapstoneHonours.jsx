import GradientCard from "../GradientCard";

/**
 * Capstone & Honours combined section.
 * Cleaned up layout for clarity and consistency.
 * Both cards now share the same blue gradient palette for unified styling.
 */
export default function CapstoneHonours({ data }) {
  const capstoneCourses = data?.capstone?.courses || [];
  const highlights = data?.capstone?.highlights || "—";
  const classes = data?.honours?.classes || [];
  const requirements = data?.honours?.requirements;
  const wamRestrictions = data?.honours?.wamRestrictions;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* ---------- CAPSTONE ---------- */}
      <GradientCard
        className="relative overflow-hidden backdrop-blur-md border border-slate-200/60
                   dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 
                   shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                   hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_10px_40px_rgb(0,0,0,0.4)]
                   transition-all duration-300 rounded-2xl">
        {/* top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1.5 
                        bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-t-2xl" />

        <div className="p-7 space-y-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 
                         bg-clip-text text-transparent">
            Capstone
          </h2>

          {/* Courses */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Courses
            </h3>
            {capstoneCourses.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {capstoneCourses.map((course, i) => (
                  <span
                    key={i}
                    className="inline-block px-3 py-1 text-sm font-medium
                               bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-indigo-900/30
                               border border-sky-200/40 dark:border-sky-700/40
                               rounded-full text-sky-700 dark:text-sky-300 shadow-sm"
                  >
                    {course}
                  </span>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-500 italic">No courses listed.</p>
            )}
          </section>

          {/* Highlights */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Highlights
            </h3>
            <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
              {highlights}
            </p>
          </section>
        </div>
      </GradientCard>

      {/* ---------- HONOURS ---------- */}
      <GradientCard
        className="relative overflow-hidden backdrop-blur-md border border-slate-200/60
                   dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 
                   shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                   hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_10px_40px_rgb(0,0,0,0.4)]
                   transition-all duration-300 rounded-2xl">
        {/* same gradient as Capstone for visual consistency */}
        <div className="absolute inset-x-0 top-0 h-1.5 
                        bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-t-2xl" />

        <div className="p-7 space-y-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 
                         bg-clip-text text-transparent">
            Honours Requirements
          </h2>

          {/* Classes */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Classes
            </h3>
            {classes.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {classes.map((cls, i) => (
                  <span
                    key={i}
                    className="inline-block px-3 py-1 text-sm font-medium
                               bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-indigo-900/30
                               border border-sky-200/40 dark:border-sky-700/40
                               rounded-full text-sky-700 dark:text-sky-300 shadow-sm"
                  >
                    {cls}
                  </span>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-500 italic">No specific classes required.</p>
            )}
          </section>

          {/* Requirements */}
          {requirements && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Requirements
              </h3>
              <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                {requirements}
              </p>
            </section>
          )}

          {/* WAM Restrictions */}
          {wamRestrictions && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                WAM Restrictions
              </h3>
              <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                {wamRestrictions}
              </p>
            </section>
          )}

          {/* Empty fallback */}
          {!classes.length && !requirements && !wamRestrictions && (
            <div className="text-slate-500 italic">No Honours requirements listed.</div>
          )}
        </div>
      </GradientCard>
    </div>
  );
}

import { useEffect, useState } from "react";
import { HiCheckCircle, HiChevronDown, HiChevronUp, HiInformationCircle, HiPencil } from "react-icons/hi";
import toast from "react-hot-toast";
import { supabase } from "../../supabaseClient";

export default function SpecialisationSelectionPanel({
  enrolledProgram,
  userId,
  onUpdate,
  onReselectProgram,
}) {
  const [availableSpecialisations, setAvailableSpecialisations] = useState([]);
  const [confirmedSpecs, setConfirmedSpecs] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedType, setExpandedType] = useState(null);

  useEffect(() => {
    const fetchSpecialisations = async () => {
      if (!enrolledProgram?.degree_code) return;

      let codesToMatch = [enrolledProgram.degree_code];

      const { data: degreeData } = await supabase
        .from("unsw_degrees_final")
        .select("program_name")
        .eq("degree_code", enrolledProgram.degree_code)
        .single();

      if (degreeData?.program_name?.includes("/")) {
        const programNames = degreeData.program_name.split("/").map((n) => n.trim());
        const { data: individualDegrees } = await supabase
          .from("unsw_degrees_final")
          .select("degree_code, program_name")
          .in("program_name", programNames);
        if (individualDegrees?.length > 0)
          codesToMatch = individualDegrees.map((d) => d.degree_code);
      }

      const { data } = await supabase
        .from("unsw_specialisations")
        .select("major_code, major_name, specialisation_type, faculty, sections_degrees")
        .order("major_name");

      const filtered =
        data?.filter((spec) => {
          if (!spec.sections_degrees) return false;
          try {
            const degrees =
              typeof spec.sections_degrees === "string"
                ? JSON.parse(spec.sections_degrees)
                : spec.sections_degrees;
            return degrees.some((d) => codesToMatch.includes(d.degree_code));
          } catch {
            return false;
          }
        }) || [];

      setAvailableSpecialisations(filtered);

      const confirmed = {};
      if (enrolledProgram.specialisation_codes?.length > 0) {
        enrolledProgram.specialisation_codes.forEach((code) => {
          const spec = filtered.find((s) => s.major_code === code);
          if (spec) confirmed[spec.specialisation_type] = spec;
        });
      }
      setConfirmedSpecs(confirmed);
    };

    fetchSpecialisations();
  }, [enrolledProgram]);

  // Build specsByType from availableSpecialisations
  const specsByType = {};
  availableSpecialisations.forEach((spec) => {
    if (!specsByType[spec.specialisation_type]) specsByType[spec.specialisation_type] = [];
    specsByType[spec.specialisation_type].push(spec);
  });
  const specTypes = Object.keys(specsByType);

  const isSingleType = specTypes.length === 1;

  const advanceToNext = (currentType) => {
    const idx = specTypes.indexOf(currentType);
    setExpandedType(idx < specTypes.length - 1 ? specTypes[idx + 1] : null);
  };

  const handleSelectSpec = async (type, spec) => {
    if (loading) return;

    // Before making any change, check if there are marked completed courses
    // that will be reset. Any specialisation change (select, deselect, swap)
    // wipes ALL completed courses so users never end up with orphaned
    // completion state tied to a specialisation they can no longer see.
    let existingCompletedCount = 0;
    try {
      const { count } = await supabase
        .from("user_completed_courses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      existingCompletedCount = count || 0;
    } catch {
      existingCompletedCount = 0;
    }

    if (existingCompletedCount > 0) {
      const ok = window.confirm(
        `Changing your specialisations will reset all ${existingCompletedCount} of your marked completed courses. Continue?`
      );
      if (!ok) return;
    }

    const isSelected = confirmedSpecs[type]?.major_code === spec.major_code;

    // Optimistic UI update immediately — no waiting
    if (isSelected) {
      setConfirmedSpecs((prev) => { const n = { ...prev }; delete n[type]; return n; });
    } else {
      setConfirmedSpecs((prev) => ({ ...prev, [type]: spec }));
      advanceToNext(type); // smooth instant collapse + open next
    }

    setLoading(true);
    try {
      const currentCodes = enrolledProgram.specialisation_codes || [];
      const currentNames = enrolledProgram.specialisation_names || [];

      if (isSelected) {
        await supabase
          .from("user_enrolled_program")
          .update({
            specialisation_codes: currentCodes.filter((c) => c !== spec.major_code),
            specialisation_names: currentNames.filter((n) => n !== spec.major_name),
          })
          .eq("user_id", userId);
      } else {
        const filteredCodes = currentCodes.filter((code) => {
          const s = availableSpecialisations.find((sp) => sp.major_code === code);
          return s && s.specialisation_type !== type;
        });
        const filteredNames = currentNames.filter((name) => {
          const s = availableSpecialisations.find((sp) => sp.major_name === name);
          return s && s.specialisation_type !== type;
        });

        await supabase
          .from("user_enrolled_program")
          .update({
            specialisation_codes: [...filteredCodes, spec.major_code],
            specialisation_names: [...filteredNames, spec.major_name],
          })
          .eq("user_id", userId);
      }

      // Reset ALL marked completed courses whenever specialisations change.
      // Matches the behaviour when the program itself is changed (see
      // ProgramSetupModal) — keeps the UX consistent and prevents orphaned
      // completion state from a previous spec the user can no longer see.
      if (existingCompletedCount > 0) {
        await supabase
          .from("user_completed_courses")
          .delete()
          .eq("user_id", userId);
      }

      // Sync parent in background after a short delay so the component
      // stays stable — avoids unmount/remount resetting accordion state
      setTimeout(() => onUpdate(), 800);
    } catch {
      if (isSelected) {
        setConfirmedSpecs((prev) => ({ ...prev, [type]: spec }));
      } else {
        setConfirmedSpecs((prev) => { const n = { ...prev }; delete n[type]; return n; });
      }
      toast.error("Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSpecCards = (type, specs) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {specs.map((spec) => {
        const isSelected = confirmedSpecs[type]?.major_code === spec.major_code;
        return (
          <button
            key={spec.major_code}
            onClick={() => handleSelectSpec(type, spec)}
            disabled={loading}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all disabled:opacity-50 ${
              isSelected
                ? "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-md"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-xs text-slate-900 dark:text-white flex-1">
                {spec.major_name}
              </span>
              {isSelected && (
                <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              )}
            </div>
            {isSelected && (
              <span className="mt-1 inline-block text-[11px] font-semibold text-green-600 dark:text-green-400">
                Selected
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Enrolled program badge — sits directly in parent card */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
        <div className="flex items-center gap-3">
          <HiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {enrolledProgram?.program_name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {enrolledProgram?.degree_code}
            </div>
          </div>
        </div>
        <button
          onClick={onReselectProgram}
          className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-bold"
        >
          <HiPencil className="w-3.5 h-3.5" />
          Change
        </button>
      </div>

      {/* Specialisations */}
      {availableSpecialisations.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Specialisations (Optional)
            </h2>
            <div className="relative group inline-flex items-center">
              <HiInformationCircle className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-relaxed">
                A Major is your primary area of focus within your degree. A Minor is a secondary area of study. These are optional — skip if you are unsure.
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Select one from each category if applicable
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-1.5">
            <HiInformationCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Changing a specialisation will reset any courses you have marked as completed.
          </p>

          {isSingleType ? (
            /* ── Single type: no accordion ── */
            <div>
              {renderSpecCards(specTypes[0], specsByType[specTypes[0]])}
            </div>
          ) : (
            /* ── Multiple types: accordion ── */
            <div className="space-y-2">
              {specTypes.map((type) => {
                const specs = specsByType[type];
                const isExpanded = expandedType === type;
                const selectedSpec = confirmedSpecs[type] ?? null;

                return (
                  <div
                    key={type}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      selectedSpec
                        ? "border-green-300 dark:border-green-700"
                        : "border-blue-300 dark:border-blue-700"
                    }`}
                  >
                    {/* Accordion header */}
                    <div
                      className={`flex items-center justify-between px-5 py-4 ${
                        selectedSpec
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40"
                      }`}
                    >
                      <button
                        onClick={() => setExpandedType(isExpanded ? null : type)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex-shrink-0">
                          {type}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          {specs.length} options
                        </span>
                        {selectedSpec ? (
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400 truncate">
                            {selectedSpec.major_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex-shrink-0">
                            Not selected
                          </span>
                        )}
                      </button>
                      <button onClick={() => setExpandedType(isExpanded ? null : type)} className="ml-3 flex-shrink-0">
                        {isExpanded
                          ? <HiChevronUp className="w-5 h-5 text-slate-500" />
                          : <HiChevronDown className="w-5 h-5 text-slate-500" />}
                      </button>
                    </div>

                    {/* Accordion body */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                        {renderSpecCards(type, specs)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* No specialisations */}
      {availableSpecialisations.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <HiInformationCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-base font-medium">
              No specialisations found for this program. You can proceed to the next step.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

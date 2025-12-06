import { useEffect, useState } from "react";
import { HiCheckCircle, HiChevronDown, HiChevronUp, HiPencil } from "react-icons/hi";
import { supabase } from "../../supabaseClient";

export default function SpecialisationSelectionPanel({ 
  enrolledProgram, 
  userId, 
  onUpdate,
  onReselectProgram 
}) {
  const [availableSpecialisations, setAvailableSpecialisations] = useState([]);
  const [confirmedSpecs, setConfirmedSpecs] = useState({});
  const [selectingType, setSelectingType] = useState(null);
  const [tempSelection, setTempSelection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
        const programNames = degreeData.program_name.split("/").map(n => n.trim());
        const { data: individualDegrees } = await supabase
          .from("unsw_degrees_final")
          .select("degree_code, program_name")
          .in("program_name", programNames);

        if (individualDegrees?.length > 0) {
          codesToMatch = individualDegrees.map(d => d.degree_code);
        }
      }

      const { data } = await supabase
        .from("unsw_specialisations")
        .select("major_code, major_name, specialisation_type, faculty, sections_degrees")
        .order("major_name");

      const filtered = data?.filter((spec) => {
        if (!spec.sections_degrees) return false;
        let degrees = [];
        try {
          degrees = typeof spec.sections_degrees === "string" 
            ? JSON.parse(spec.sections_degrees) 
            : spec.sections_degrees;
        } catch {
          return false;
        }
        return degrees.some((d) => codesToMatch.includes(d.degree_code));
      }) || [];

      setAvailableSpecialisations(filtered);

      const confirmed = {};
      if (enrolledProgram.specialisation_codes?.length > 0) {
        enrolledProgram.specialisation_codes.forEach((code) => {
          const spec = filtered.find(s => s.major_code === code);
          if (spec) confirmed[spec.specialisation_type] = spec;
        });
      }
      setConfirmedSpecs(confirmed);
    };

    fetchSpecialisations();
  }, [enrolledProgram]);

  const specsByType = {};
  availableSpecialisations.forEach(spec => {
    if (!specsByType[spec.specialisation_type]) {
      specsByType[spec.specialisation_type] = [];
    }
    specsByType[spec.specialisation_type].push(spec);
  });

  const handleConfirm = async () => {
    if (!tempSelection) return;

    const proceed = window.confirm(
      `Changing your ${selectingType} will reset existing progress for this area. Continue?`
    );
    if (!proceed) {
      setSelectingType(null);
      setTempSelection(null);
      return;
    }

    setLoading(true);

    try {
      const currentCodes = enrolledProgram.specialisation_codes || [];
      const currentNames = enrolledProgram.specialisation_names || [];

      const oldSpecCode = currentCodes.find((code) => {
        const s = availableSpecialisations.find(sp => sp.major_code === code);
        return s && s.specialisation_type === selectingType;
      });

      const filteredCodes = currentCodes.filter((code) => {
        const s = availableSpecialisations.find(sp => sp.major_code === code);
        return s && s.specialisation_type !== selectingType;
      });
      const filteredNames = currentNames.filter((name) => {
        const s = availableSpecialisations.find(sp => sp.major_name === name);
        return s && s.specialisation_type !== selectingType;
      });

      const newCodes = [...filteredCodes, tempSelection.major_code];
      const newNames = [...filteredNames, tempSelection.major_name];

      await supabase
        .from("user_enrolled_program")
        .update({
          specialisation_codes: newCodes,
          specialisation_names: newNames,
        })
        .eq("user_id", userId);

      if (oldSpecCode) {
        const sourceType = selectingType.toLowerCase();
        await supabase
          .from("user_completed_courses")
          .delete()
          .eq("user_id", userId)
          .eq("source_type", sourceType)
          .eq("source_code", oldSpecCode);
      }

      setConfirmedSpecs(prev => ({
        ...prev,
        [selectingType]: tempSelection
      }));

      const selectedSpecName = tempSelection.major_name;
      
      setSelectingType(null);
      setTempSelection(null);
      setLoading(false);
      
      // Trigger update first
      await onUpdate();

      // Auto-scroll to the newly added specialisation section after a short delay
      setTimeout(() => {
        // Look for the specialisation heading in the page
        const headings = document.querySelectorAll('h2');
        let targetHeading = null;
        
        headings.forEach(heading => {
          if (heading.textContent.includes(selectedSpecName)) {
            targetHeading = heading;
          }
        });

        if (targetHeading) {
          // Scroll to the specialisation with smooth behavior
          targetHeading.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
          
          // Add a brief highlight effect
          const parentCard = targetHeading.closest('.rounded-xl');
          if (parentCard) {
            parentCard.style.transition = 'box-shadow 0.3s ease';
            parentCard.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
            setTimeout(() => {
              parentCard.style.boxShadow = '';
            }, 2000);
          }
        }
      }, 500); // Wait 500ms for the UI to update

    } catch {
      alert("Failed to update. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-1 w-10 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {enrolledProgram?.program_name}
            </h2>
          </div>

          {Object.entries(confirmedSpecs).map(([type, spec]) => (
            <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 shadow-sm">
              <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {type}:
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {spec.major_name}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-6 py-3.5 text-base rounded-xl 
                   bg-gradient-to-r from-blue-600 to-indigo-600 
                   hover:from-blue-700 hover:to-indigo-700 
                   text-white font-bold 
                   shadow-lg hover:shadow-xl 
                   hover:scale-105 transition-all duration-200
                   border-2 border-blue-400/50"
        >
          <HiPencil className="w-5 h-5" />
          {isExpanded ? "Close" : "Edit Program"}
          {isExpanded ? <HiChevronUp className="w-5 h-5" /> : <HiChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Manage Your Program
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Change your program or update specialisations
              </p>
            </div>
            <button
              onClick={onReselectProgram}
              className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border-2 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition shadow-sm"
            >
              <HiPencil className="w-4 h-4" />
              Change Program
            </button>
          </div>

          {Object.keys(specsByType).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(specsByType).map(([type, specs]) => {
                const isConfirmed = confirmedSpecs[type];
                const isSelecting = selectingType === type;

                return (
                  <div
                    key={type}
                    className={`rounded-xl overflow-hidden transition-all border-2 ${
                      isSelecting
                        ? "border-blue-500 shadow-md"
                        : "border-slate-200 dark:border-slate-700 shadow-sm"
                    }`}
                  >
                    {!isSelecting && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                            {type}
                          </span>

                          <button
                            onClick={() => {
                              setSelectingType(type);
                              setTempSelection(isConfirmed || null);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                          >
                            {isConfirmed ? "Change" : "Select"}
                          </button>
                        </div>

                        {isConfirmed ? (
                          <div className="flex items-center gap-1.5 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                            <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {isConfirmed.major_name}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center p-2">
                            Not selected yet
                          </p>
                        )}
                      </div>
                    )}

                    {isSelecting && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Select {type}
                          </span>

                          <button
                            onClick={() => {
                              setSelectingType(null);
                              setTempSelection(null);
                            }}
                            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <HiChevronUp className="w-4 h-4" />
                          </button>
                        </div>

                        <select
                          value={tempSelection?.major_code || ""}
                          onChange={(e) => {
                            const spec = specs.find(s => s.major_code === e.target.value);
                            setTempSelection(spec || null);
                          }}
                          className="w-full px-3 py-2.5 text-sm rounded-lg border-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 mb-3 transition"
                        >
                          <option value="">{`Choose a ${type}...`}</option>
                          {specs.map(spec => (
                            <option key={spec.major_code} value={spec.major_code}>
                              {spec.major_name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={handleConfirm}
                          disabled={!tempSelection || loading}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
                        >
                          {loading ? "Saving..." : "Save Selection"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
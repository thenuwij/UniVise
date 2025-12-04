// src/components/progress/SpecialisationSelectionPanel.jsx
import { useEffect, useState } from "react";
import { HiCheckCircle, HiChevronUp, HiPencil } from "react-icons/hi";
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

  // Fetch available specialisations for this degree
  useEffect(() => {
    const fetchSpecialisations = async () => {
      if (!enrolledProgram?.degree_code) return;

      // First check if this is a double degree
      let codesToMatch = [enrolledProgram.degree_code];

      const { data: degreeData } = await supabase
        .from("unsw_degrees_final")
        .select("program_name")
        .eq("degree_code", enrolledProgram.degree_code)
        .single();

      if (degreeData?.program_name?.includes("/")) {

        // It's a double degree, get individual program codes
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

      // Filter specialisations for all matching degree codes
      const filtered = data?.filter((spec) => {
        if (!spec.sections_degrees) return false;
        let degrees = [];
        try {
          degrees = typeof spec.sections_degrees === "string" 
            ? JSON.parse(spec.sections_degrees) 
            : spec.sections_degrees;
        } catch (err) {
          return false;
        }
        return degrees.some((d) => codesToMatch.includes(d.degree_code));
      }) || [];

      setAvailableSpecialisations(filtered);

      // Set currently confirmed specialisations
      const confirmed = {};
      if (enrolledProgram.specialisation_codes && enrolledProgram.specialisation_codes.length > 0) {
        enrolledProgram.specialisation_codes.forEach((code) => {
          const spec = filtered.find(s => s.major_code === code);
          if (spec) {
            confirmed[spec.specialisation_type] = spec;
          }
        });
      }
      setConfirmedSpecs(confirmed);
    };

    fetchSpecialisations();
  }, [enrolledProgram]);

  // Group by type
  const specsByType = {};
  availableSpecialisations.forEach(spec => {
    if (!specsByType[spec.specialisation_type]) {
      specsByType[spec.specialisation_type] = [];
    }
    specsByType[spec.specialisation_type].push(spec);
  });

  const handleConfirm = async () => {
    if (!tempSelection) return;

    const confirmed = window.confirm(
      `Selecting/changing ${selectingType} will reset progress records for this specialisation type. Continue?`
    );

    if (!confirmed) {
      setSelectingType(null);
      setTempSelection(null);
      return;
    }

    setLoading(true);

    try {

      // Get current specialisation codes
      const currentCodes = enrolledProgram.specialisation_codes || [];
      const currentNames = enrolledProgram.specialisation_names || [];

      // Find the old spec code being replaced
      const oldSpecCode = currentCodes.find((code) => {
        const s = availableSpecialisations.find(sp => sp.major_code === code);
        return s && s.specialisation_type === selectingType;
      });

      // Remove old spec of this type
      const filteredCodes = currentCodes.filter((code) => {
        const s = availableSpecialisations.find(sp => sp.major_code === code);
        return s && s.specialisation_type !== selectingType;
      });
      const filteredNames = currentNames.filter((name) => {
        const s = availableSpecialisations.find(sp => sp.major_name === name);
        return s && s.specialisation_type !== selectingType;
      });

      // Add new spec
      const newCodes = [...filteredCodes, tempSelection.major_code];
      const newNames = [...filteredNames, tempSelection.major_name];

      // Update enrolled program
      await supabase
        .from("user_enrolled_program")
        .update({
          specialisation_codes: newCodes,
          specialisation_names: newNames,
        })
        .eq("user_id", userId);

      // Delete completed courses for the OLD specialisation being replaced
      if (oldSpecCode) {

        const sourceType = selectingType.toLowerCase(); // 'major', 'minor', 'honours'
        
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

      setSelectingType(null);
      setTempSelection(null);
      setLoading(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating specialisation:", error);
      alert("Failed to update. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>

      {/* Compact Program Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {enrolledProgram?.program_name}
            </h2>
          </div>
        </div>
        
        <button
          onClick={onReselectProgram}
          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-blue-500 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
        >
          <HiPencil className="w-3.5 h-3.5" />
          <span>Change Program</span>
        </button>
      </div>

      {/* Compact Specialisation Selection */}
      {Object.keys(specsByType).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(specsByType).map(([type, specs]) => {
            const isConfirmed = confirmedSpecs[type];
            const isSelecting = selectingType === type;

            return (
              <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/30">
                
                {/* Collapsed State */}
                {!isSelecting && (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        {type}
                      </span>
                      <button
                        onClick={() => {
                          setSelectingType(type);
                          setTempSelection(isConfirmed || null);
                        }}
                        className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                      >
                        {isConfirmed ? "Change" : "Select"}
                      </button>
                    </div>
                    {isConfirmed ? (
                      <div className="flex items-center gap-2">
                        <HiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                          {isConfirmed.major_name}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Not selected
                      </p>
                    )}
                  </div>
                )}

                {/* Selection State */}
                {isSelecting && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        Select {type}
                      </span>
                      <button
                        onClick={() => {
                          setSelectingType(null);
                          setTempSelection(null);
                        }}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
                      className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 mb-2"
                    >
                      <option value="">Choose...</option>
                      {specs.map(spec => (
                        <option key={spec.major_code} value={spec.major_code}>
                          {spec.major_name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleConfirm}
                      disabled={!tempSelection || loading}
                      className="w-full px-3 py-1.5 text-xs rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Saving..." : "Confirm"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
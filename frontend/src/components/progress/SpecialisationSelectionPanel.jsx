// src/components/progress/SpecialisationSelectionPanel.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { HiPencil, HiCheckCircle, HiChevronDown, HiChevronUp } from "react-icons/hi";

export default function SpecialisationSelectionPanel({ 
  enrolledProgram, 
  userId, 
  onUpdate,
  onReselectProgram 
}) {
  const [availableSpecialisations, setAvailableSpecialisations] = useState([]);
  const [confirmedSpecs, setConfirmedSpecs] = useState({});
  const [selectingType, setSelectingType] = useState(null); // Which type is being selected
  const [tempSelection, setTempSelection] = useState(null); // Temporary selection before confirm
  const [loading, setLoading] = useState(false);

  // Fetch available specialisations for this degree
  useEffect(() => {
    const fetchSpecialisations = async () => {
      if (!enrolledProgram?.degree_code) return;

      const { data } = await supabase
        .from("unsw_specialisations")
        .select("major_code, major_name, specialisation_type, faculty, sections_degrees")
        .order("major_name");

      // Filter specialisations for this degree
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
        return degrees.some((d) => d.degree_code === enrolledProgram.degree_code);
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

      // Delete completed courses for this specialisation type
      await supabase
        .from("user_completed_courses")
        .delete()
        .eq("user_id", userId)
        .ilike("category", `%${selectingType}%`);

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
    <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg">
      {/* Program Info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {enrolledProgram?.program_name}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-16">Program</p>
        </div>
        
        <button
          onClick={onReselectProgram}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
        >
          <HiPencil className="w-4 h-4" />
          <span>Reselect Program</span>
        </button>
      </div>

      {/* Specialisation Selection */}
      {Object.keys(specsByType).length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Specialisations
          </h3>
          
          <div className="space-y-3">
            {Object.entries(specsByType).map(([type, specs]) => {
              const isConfirmed = confirmedSpecs[type];
              const isSelecting = selectingType === type;

              return (
                <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Confirmed or Collapsed State */}
                  {!isSelecting && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {type}:
                        </span>
                        {isConfirmed ? (
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {isConfirmed.major_name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Not selected
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectingType(type);
                          setTempSelection(isConfirmed || null);
                        }}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
                      >
                        {isConfirmed ? "Reselect" : "Select"} {type}
                        <HiChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Selection State */}
                  {isSelecting && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Select {type}
                        </span>
                        <button
                          onClick={() => {
                            setSelectingType(null);
                            setTempSelection(null);
                          }}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm mb-3"
                      >
                        <option value="">Choose {type}...</option>
                        {specs.map(spec => (
                          <option key={spec.major_code} value={spec.major_code}>
                            {spec.major_name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleConfirm}
                        disabled={!tempSelection || loading}
                        className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Saving..." : `Confirm ${type}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
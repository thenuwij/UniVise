// src/components/ProgramSetupModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { HiCheckCircle, HiX } from "react-icons/hi";

export default function ProgramSetupModal({ onClose, userId, onComplete }) {
  const [selectedDegree, setSelectedDegree] = useState(null);
  const [degrees, setDegrees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkExistingData = async () => {
      const { data } = await supabase
        .from("user_completed_courses")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      
      if (data && data.length > 0) {
        setShowWarning(true);
      }
    };
    checkExistingData();
  }, [userId]);

  useEffect(() => {
    const fetchDegrees = async () => {
      const { data } = await supabase
        .from("unsw_degrees_final")
        .select("degree_code, program_name, faculty")
        .order("program_name");
      setDegrees(data || []);
    };
    fetchDegrees();
  }, []);

  const handleSave = async () => {
    if (!selectedDegree) {
      alert("Please select a program");
      return;
    }

    setLoading(true);

    try {
      const { data: degreeData } = await supabase
        .from("unsw_degrees_final")
        .select("minimum_uoc")
        .eq("degree_code", selectedDegree.degree_code)
        .single();

      const totalUOC = parseInt(degreeData?.minimum_uoc || 0);

      await supabase.from("user_enrolled_program").delete().eq("user_id", userId);
      await supabase.from("user_progress_stats").delete().eq("user_id", userId);
      await supabase.from("user_completed_courses").delete().eq("user_id", userId);

      const { data: programData, error: programError } = await supabase
        .from("user_enrolled_program")
        .insert({
          user_id: userId,
          degree_code: selectedDegree.degree_code,
          program_name: selectedDegree.program_name,
          specialisation_codes: [],
          specialisation_names: [],
        })
        .select()
        .single();

      if (programError) {
        console.error("Error saving program:", programError);
        alert("Failed to save program. Please try again.");
        setLoading(false);
        return;
      }

      await supabase.from("user_progress_stats").insert({
        user_id: userId,
        total_uoc_required: totalUOC,
        uoc_completed: 0,
        uoc_remaining: totalUOC,
        current_wam: null,
        courses_completed_count: 0,
        courses_remaining_count: 0,
      });

      setLoading(false);
      onComplete(programData);
    } catch (error) {
      console.error("Error in handleSave:", error);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const filteredDegrees = degrees.filter((d) =>
    d.program_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Select Your Program</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Choose your enrolled degree program
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <HiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {showWarning && (
            <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <HiCheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Warning: Changing your program will reset your progress
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    All completed courses and marks will be cleared. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <input
            type="text"
            placeholder="Search for a program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 mb-4"
          />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredDegrees.map((degree) => (
              <button
                key={degree.degree_code}
                onClick={() => setSelectedDegree(degree)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedDegree?.degree_code === degree.degree_code
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-500"
                }`}
              >
                <p className="font-semibold">{degree.program_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{degree.faculty}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!selectedDegree || loading}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
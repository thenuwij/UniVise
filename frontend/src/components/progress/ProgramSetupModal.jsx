// src/components/ProgramSetupModal.jsx
import { useEffect, useState } from "react";
import { HiCheckCircle, HiX } from "react-icons/hi";
import { supabase } from "../../supabaseClient";

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Select Your Program</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                Choose your enrolled degree to start tracking your academic progress
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <HiX className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          
          {showWarning && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-amber-200 dark:bg-amber-800">
                  <svg className="w-5 h-5 text-amber-700 dark:text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    Warning: Changing your program will reset your progress
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    All completed courses and marks will be cleared. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              Search Programs
            </label>
            <input
              type="text"
              placeholder="Type to search for a program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 
                       bg-white dark:bg-slate-800 
                       focus:border-blue-500 dark:focus:border-blue-400 
                       focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 
                       outline-none transition-all 
                       text-slate-900 dark:text-white 
                       placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Programs List */}
          <div className="space-y-2">
            {filteredDegrees.length > 0 ? (
              filteredDegrees.map((degree) => (
                <button
                  key={degree.degree_code}
                  onClick={() => setSelectedDegree(degree)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedDegree?.degree_code === degree.degree_code
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-100 dark:shadow-blue-900/50"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">
                        {degree.program_name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                        {degree.faculty}
                      </p>
                    </div>
                    {selectedDegree?.degree_code === degree.degree_code && (
                      <HiCheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No programs found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Scroll Indicator Text */}
          {filteredDegrees.length > 5 && (
            <div className="text-center mt-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Showing {filteredDegrees.length} programs • Scroll for more
              </p>
            </div>
          )}
        </div>

        {/* Footer - Always Visible */}
        <div className="p-6 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3 flex-shrink-0 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 
                     bg-white dark:bg-slate-800 
                     text-slate-700 dark:text-slate-300 font-bold 
                     hover:bg-slate-50 dark:hover:bg-slate-700 
                     hover:border-slate-400 dark:hover:border-slate-500
                     transition-all duration-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!selectedDegree || loading}
            className="px-8 py-3 rounded-xl 
                     bg-gradient-to-r from-blue-600 to-indigo-600 
                     hover:from-blue-700 hover:to-indigo-700 
                     text-white font-bold text-base
                     hover:shadow-xl hover:scale-105
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                     shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Program"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
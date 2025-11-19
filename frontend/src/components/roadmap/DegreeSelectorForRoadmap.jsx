// src/components/roadmap/DegreeSelectorForRoadmap.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { HiSearch, HiAcademicCap, HiFilter, HiX } from "react-icons/hi";

function DegreeSelectorForRoadmap({ onSelect, selectedId }) {
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [degrees, setDegrees] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

  // Fetch all degrees once
  useEffect(() => {
    const fetchDegrees = async () => {
      const { data, error } = await supabase
        .from("unsw_degrees_final")
        .select("*")
        .range(0, 2999);
      if (!error && data) {
        setDegrees(data);
        const uniqueFaculties = Array.from(new Set(data.map(d => d.faculty).filter(Boolean))).sort();
        setFaculties(uniqueFaculties);
      }
    };
    fetchDegrees();
  }, []);

  // Filter logic
  const filteredDegrees = degrees.filter((deg) => {
    const matchesQuery =
      !query || deg.program_name.toLowerCase().includes(query.toLowerCase());
    const matchesFaculty = !facultyFilter || deg.faculty === facultyFilter;
    return matchesQuery && matchesFaculty;
  });

  const shouldShowResults = query.length >= 2 || facultyFilter;

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-4">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Type to search UNSW degrees..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg pl-12 pr-12 py-3 text-sm
                     bg-white dark:bg-slate-900/60
                     border border-slate-300 dark:border-slate-700
                     focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none
                     text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500
                     transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <HiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${showFilter 
              ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
          <HiFilter className="w-4 h-4" />
          {showFilter ? 'Hide Filter' : 'Filter by Faculty'}
        </button>
      </div>

      {/* Faculty Filter */}
      {showFilter && (
        <div className="mb-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Select Faculty
          </label>
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                       px-3 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Faculties</option>
            {faculties.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </select>
          {facultyFilter && (
            <button
              onClick={() => setFacultyFilter("")}
              className="mt-2 text-xs text-sky-600 dark:text-sky-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Results Info */}
      {shouldShowResults && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredDegrees.length === 0 
              ? "No degrees found" 
              : `${filteredDegrees.length} degree${filteredDegrees.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      )}

      {/* Results List - Vertical Cards */}
      {shouldShowResults && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filteredDegrees.length > 0 ? (
            filteredDegrees.map((deg) => {
              const isSelected = selectedId === deg.id;
              return (
                <div
                  key={deg.id}
                  onClick={() => onSelect(deg)}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border
                    ${
                      isSelected
                        ? "bg-sky-50 dark:bg-sky-900/40 border-sky-500 shadow-sm"
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-sky-300 dark:hover:border-sky-700"
                    }`}
                >
                  <div className="flex-shrink-0 p-1.5 rounded-md bg-sky-100 dark:bg-sky-900/40 mt-0.5">
                    <HiAcademicCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-snug mb-0.5 ${
                      isSelected
                        ? "text-sky-700 dark:text-sky-300"
                        : "text-slate-900 dark:text-white"
                    }`}>
                      {deg.program_name}
                    </p>
                    {deg.faculty && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {deg.faculty}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1">
                      Selected
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No degrees match your search.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setFacultyFilter("");
                }}
                className="mt-3 text-xs text-sky-600 dark:text-sky-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Initial State Message */}
      {!shouldShowResults && (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <HiSearch className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Start typing to search for degrees
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Or use the filter to browse by faculty
          </p>
        </div>
      )}
    </div>
  );
}

export default DegreeSelectorForRoadmap;
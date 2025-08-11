import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

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
        .from("unsw_degrees")
        .select("*")
        .range(0, 2999); // Up to 3000 results

      if (!error && data) {
        setDegrees(data);

        // Get unique faculties
        const facultyList = Array.from(
          new Set(data.map((d) => d.faculty).filter(Boolean))
        );
        setFaculties(facultyList.sort());
      }
    };

    fetchDegrees();
  }, []);

  // Filter logic (same as CourseSearch)
  const filteredDegrees = degrees.filter((deg) => {
    const matchesQuery =
      query.length === 0 ||
      deg.program_name.toLowerCase().includes(query.toLowerCase());

    const matchesFaculty =
      !facultyFilter || deg.faculty === facultyFilter;

    return matchesQuery && matchesFaculty;
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <p className="ttext-xl font-medium text-slate-800 lg:text-2xl">
          Search UNSW degrees and select one to generate a roadmap.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 justify-center">
        <input
          type="text"
          placeholder="Start typing to search for degrees"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl px-5 py-3 text-base border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all w-full sm:w-auto"
        />

        {!showFilter && (
          <button
            onClick={() => setShowFilter(true)}
            className="px-6 py-3 rounded-full bg-white border border-slate-200 font-semibold text-base hover:shadow-md transition-all shadow flex items-center justify-center"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
              + Add Filter
            </span>
          </button>
        )}
      </div>

      {showFilter && (
        <div className="mb-6">
          <label className="block mb-2 text-slate-700 font-medium">
            Filter by Faculty:
          </label>
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Select faculty</option>
            {faculties.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </select>
        </div>
      )}

      {query.length >= 1 || facultyFilter ? (
        filteredDegrees.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredDegrees.map((deg) => {
              const isSelected = selectedId === deg.id;
              return (
                <div
                  key={deg.id}
                  onClick={() => {
                    if (!isSelected) onSelect(deg);
                  }}
                  className={`cursor-pointer rounded-2xl border px-4 py-3 shadow transition-all duration-200 ${
                    isSelected
                      ? "bg-sky-100 border-sky-600 shadow-md scale-[1.02]"
                      : "bg-white border-slate-300 hover:shadow hover:scale-[1.01]"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {deg.program_name}
                  </h3>
                  <p className="text-sm text-slate-500">{deg.faculty}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-slate-500 mt-8">
            No matching degrees found.
          </p>
        )
      ) : (
        <p className="text-center text-slate-400 mt-6">
          Start typing to search for degrees or add a filter.
        </p>
      )}
    </div>
  );
}

export default DegreeSelectorForRoadmap;

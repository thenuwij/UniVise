import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

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
        <p className="text-xl font-medium text-primary lg:text-2xl">
          Search UNSW degrees and select one to generate a roadmap.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 justify-center">
        <input
          type="text"
          placeholder="Start typing to search for degrees"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-selector flex-1 w-full sm:w-auto"
        />

        {!showFilter && (
          <button
            onClick={() => setShowFilter(true)}
            className="button-base button-secondary rounded-full px-6 py-3 flex items-center justify-center"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
              + Add Filter
            </span>
          </button>
        )}
      </div>

      {showFilter && (
        <div className="mb-6">
          <label className="block mb-2 font-medium text-primary">
            Filter by Faculty:
          </label>
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="input-selector w-full"
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
                  className={`cursor-pointer card-base transition-transform duration-200 ${
                    isSelected
                      ? "border-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-slate-800 scale-[1.02]"
                      : "hover:shadow-md hover:scale-[1.01]"
                  }`}
                >
                  <h3 className="heading-md text-primary mb-1">
                    {deg.program_name}
                  </h3>
                  <p className="text-sm text-secondary">{deg.faculty}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-secondary mt-8">
            No matching degrees found.
          </p>
        )
      ) : (
        <p className="text-center text-muted mt-6">
          Start typing to search for degrees or add a filter.
        </p>
      )}
    </div>
  );
}

export default DegreeSelectorForRoadmap;

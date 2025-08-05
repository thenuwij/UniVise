import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function DegreeSelectorForRoadmap({ onSelect, selectedId }) {
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [results, setResults] = useState([]);
  const [faculties, setFaculties] = useState([]);

  // Fetch faculty list
  useEffect(() => {
    const fetchFaculties = async () => {
      const { data, error } = await supabase
        .from("unsw_degrees")
        .select("faculty")
        .neq("faculty", "");

      if (!error && data) {
        const uniqueFaculties = [...new Set(data.map((d) => d.faculty))];
        setFaculties(uniqueFaculties);
      }
    };
    fetchFaculties();
  }, []);

  // Fetch filtered degrees (only if query is at least 1 character)
  useEffect(() => {
    const fetchDegrees = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }

      let builder = supabase.from("unsw_degrees").select("*");

      builder = builder.ilike("program_name", `%${query}%`);

      if (facultyFilter) {
        builder = builder.eq("faculty", facultyFilter);
      }

      const { data, error } = await builder;
      if (!error) setResults(data);
    };
    fetchDegrees();
  }, [query, facultyFilter]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 justify-center">
        <input
          type="text"
          placeholder="Search degree name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl px-5 py-3 text-base border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all w-full sm:w-auto"
        />

        <select
          value={facultyFilter}
          onChange={(e) => setFacultyFilter(e.target.value)}
          className="rounded-xl px-5 py-3 text-base border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all w-full sm:w-auto"
        >
          <option value="">All Faculties</option>
          {faculties.map((faculty) => (
            <option key={faculty} value={faculty}>
              {faculty}
            </option>
          ))}
        </select>
      </div>

      {query.length === 0 && (
        <p className="text-center text-gray-400 mt-6 text-base">
          Start typing to search for degrees.
        </p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {results.map((deg) => {
            const isSelected = selectedId === deg.id;
            return (
              <div
                key={deg.id}
                onClick={() => {
                  if (!isSelected) {
                    onSelect(deg);
                  }
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
      )}

      {query.length >= 1 && results.length === 0 && (
        <p className="text-center text-gray-400 mt-10 text-base">
          No degrees found. Try another keyword.
        </p>
      )}
    </div>
  );
}

export default DegreeSelectorForRoadmap;

import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function DegreeSearch({ onSelectDegree }) {
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [results, setResults] = useState([]);
  const [faculties, setFaculties] = useState([]);

  // Fetch all faculties once
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

  // Fetch matching degrees
  useEffect(() => {
    const fetchDegrees = async () => {
      let queryBuilder = supabase.from("unsw_degrees").select("*");

      if (query.length >= 2) {
        queryBuilder = queryBuilder.ilike("program_name", `%${query}%`);
      }

      if (facultyFilter) {
        queryBuilder = queryBuilder.eq("faculty", facultyFilter);
      }

      const { data, error } = await queryBuilder;

      if (!error) setResults(data);
    };

    fetchDegrees();
  }, [query, facultyFilter]);

  return (
    <div className="max-w-4xl mx-auto mb-10">
      <h2 className="text-3xl font-bold mb-4">Find your degree</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Type a degree name..."
          className="flex-1 border border-gray-300 p-3 rounded-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="border border-gray-300 p-3 rounded-md w-full md:w-60"
          value={facultyFilter}
          onChange={(e) => setFacultyFilter(e.target.value)}
        >
          <option value="">All Faculties</option>
          {faculties.map((faculty) => (
            <option key={faculty} value={faculty}>
              {faculty}
            </option>
          ))}
        </select>
      </div>

      {results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((degree) => (
            <li
              key={degree.id}
              className="bg-slate-100 hover:bg-slate-200 p-4 rounded-lg cursor-pointer shadow"
              onClick={() => onSelectDegree(degree)}
            >
              <div className="font-semibold text-lg">{degree.program_name}</div>
              <div className="text-sm text-gray-600">{degree.faculty}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 mt-4">No results found.</p>
      )}
    </div>
  );
}

export default DegreeSearch;

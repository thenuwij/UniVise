import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function DegreeSearch({ onSelectDegree }) {
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [results, setResults] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const { session } = UserAuth();

  // Fetch recommended degrees from final_degree_recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session) return;

      const { data, error } = await supabase
        .from("final_degree_recommendations")
        .select("degree_name, reason, year_1_courses, year_2_courses, year_3_courses, year_4_courses, specialisations")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data?.length > 0) {
        const formatted = data.map((deg) => ({
          degreeName: deg.degree_name,
          reason: deg.reason,
          specialisations: deg.specialisations,
          courseBreakdown: {
            "Year 1": deg.year_1_courses,
            "Year 2": deg.year_2_courses,
            "Year 3": deg.year_3_courses,
            "Year 4": deg.year_4_courses,
          },
        }));
        setRecommended(formatted);
      }
    };

    fetchRecommendations();
  }, [session]);

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

  // Fetch filtered degrees
  useEffect(() => {
    const fetchDegrees = async () => {
      let builder = supabase.from("unsw_degrees").select("*");

      if (query.length >= 2) {
        builder = builder.ilike("program_name", `%${query}%`);
      }

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
      {/* 🔹 AI Recommendations Section */}
      {recommended.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 text-center">
            Based on your UniVise recommendations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recommended.map((degree, idx) => (
              <div
                key={idx}
                className="cursor-pointer bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                onClick={() => onSelectDegree(degree)}
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-1">
                  {degree.degreeName}
                </h3>
                <p className="text-sm text-slate-600">{degree.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔍 Search & Filter Controls */}
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

      {/* 🎓 Matching Degrees Section */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {results.map((degree) => (
            <div
              key={degree.id}
              className="cursor-pointer bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200"
              onClick={() => onSelectDegree(degree)}
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                {degree.program_name}
              </h3>
              <p className="text-sm text-slate-500">{degree.faculty}</p>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query.length >= 2 && (
        <p className="text-center text-gray-400 mt-10 text-base">
          No degrees found. Try another keyword.
        </p>
      )}
    </div>
  );
}

export default DegreeSearch;

import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function DegreeSearch() {
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [results, setResults] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const { session } = UserAuth();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session) return;

      const { data } = await supabase
        .from("final_degree_recommendations")
        .select(
          "degree_name, reason, year_1_courses, year_2_courses, year_3_courses, year_4_courses, specialisations"
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data?.length > 0) {
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

  useEffect(() => {
    const fetchFaculties = async () => {
      const { data } = await supabase
        .from("unsw_degrees")
        .select("faculty")
        .neq("faculty", "");

      if (data) {
        const unique = [...new Set(data.map((d) => d.faculty))];
        setFaculties(unique);
      }
    };

    fetchFaculties();
  }, []);

  useEffect(() => {
    const fetchDegrees = async () => {
      if (query.length < 2 && facultyFilter === "") {
        const { data } = await supabase.from("unsw_degrees").select("*");
        setResults(data || []);
        return;
      }

      let builder = supabase.from("unsw_degrees").select("*");

      if (query.length >= 2) {
        builder = builder.ilike("program_name", `%${query}%`);
      }

      if (facultyFilter !== "") {
        builder = builder.eq("faculty", facultyFilter);
      }

      const { data } = await builder;
      if (data) setResults(data);
    };

    fetchDegrees();
  }, [query, facultyFilter]);

  return (
      <div className="w-full max-w-5xl mx-auto">

        <div className="text-center mb-10">
          <h1 className="mb-4 text-3xl font-extrabold md:text-5xl lg:text-6xl leading-tight">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-600 inline-block">
              Search Degrees
            </div>
          </h1>
          <p className="text-lg font-medium text-slate-800 lg:text-xl">
            Explore UNSW degree programs, filter by faculty, and find what suits you.
          </p>
        </div>

        {recommended.length > 0 && (

        
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 text-center">
            Based on your UniVise recommendations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recommended.map((degree, idx) => (
              <Link
                to={`/degrees/${degree.id}`}
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all block"
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-1">
                  {degree.degreeName}
                </h3>
                <p className="text-sm text-slate-600">{degree.reason}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 justify-center">
        <input
          type="text"
          placeholder="Start typing to search for degrees"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl px-5 py-3 text-base border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all w-full sm:w-auto"
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
        <div className="mb-10 text-center">
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
      )}

      {(query.length >= 2 || facultyFilter !== "" || results.length > 0) && (
        <>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {results.map((degree) => (
                <Link
                  to={`/degrees/${degree.id}`}
                  key={degree.id}
                  className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 block"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {degree.program_name}
                  </h3>
                  <p className="text-sm text-slate-500">{degree.faculty}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 mt-10 text-base">
              No degrees found. Try another keyword or change the filter.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default DegreeSearch;

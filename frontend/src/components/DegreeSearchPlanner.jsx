// src/components/DegreeSearchPlanner.jsx
import { useEffect, useState } from "react";
import { HiSearch } from "react-icons/hi";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function DegreeSearchPlanner() {
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [allDegrees, setAllDegrees] = useState([]);
  const [faculties, setFaculties] = useState([]);

  // Fetch ALL degrees on mount (like specialisations do)
  useEffect(() => {
    const fetchDegrees = async () => {
      try {
        const { data, error } = await supabase
          .from("unsw_degrees_final")
          .select("*");
        if (error) throw error;
        setAllDegrees(data || []);

        // Extract unique faculties
        const unique = [...new Set(data.map((d) => d.faculty).filter(Boolean))];
        setFaculties(unique.sort());
      } catch (err) {
        console.error("Degree fetch error:", err.message);
      }
    };

    fetchDegrees();
  }, []);

  // Filter degrees client-side (like specialisations do)
  const filteredDegrees = allDegrees.filter((degree) => {
    const matchesQuery =
      query.length === 0 ||
      degree.program_name.toLowerCase().includes(query.toLowerCase()) ||
      degree.degree_code?.toLowerCase().includes(query.toLowerCase());

    const matchesFaculty = !facultyFilter || degree.faculty === facultyFilter;

    return matchesQuery && matchesFaculty;
  });

  return (
    <div className="w-full">
      
      {/* Search Inputs */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search degrees..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        {/* Faculty Filter */}
        <select
          value={facultyFilter}
          onChange={(e) => setFacultyFilter(e.target.value)}
          className="w-full lg:w-64 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
        >
          <option value="">All Faculties</option>
          {faculties.map((faculty) => (
            <option key={faculty} value={faculty}>
              {faculty}
            </option>
          ))}
        </select>
      </div>

      {/* Results Section */}
      {filteredDegrees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 mb-16">
          {filteredDegrees.map((degree) => (
            <Link
              to={`/degrees/${degree.id}`}
              key={degree.id}
              className="group rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                {degree.program_name}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {degree.overview_description?.slice(0, 120) || "No description available."}
              </p>

              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {degree.faculty}
                </span>

                {degree.degree_code && (
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {degree.degree_code}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 mt-8 mb-16">
          <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <HiSearch className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            No degrees found. Try another search.
          </p>
        </div>
      )}
    </div>
  );
}

export default DegreeSearchPlanner;
import { useEffect, useState } from "react";
import { HiAcademicCap, HiFilter, HiSearch, HiStar, HiX } from "react-icons/hi";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

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
        .from("unsw_degrees_final")
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
        const { data } = await supabase.from("unsw_degrees_final").select("*");
        setResults(data || []);
        return;
      }

      let builder = supabase.from("unsw_degrees_final").select("*");

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
    <div className="w-full max-w-6xl mx-auto">
      
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-block mb-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight
                       text-slate-900 dark:text-slate-100">
            Search Degrees
          </h1>
          <div className="h-1.5 w-24 mx-auto mt-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-full" />
        </div>
        <p className="text-lg text-slate-800 dark:text-slate-200 max-w-2xl mx-auto font-semibold">
          Explore UNSW degree programs, filter by faculty, and find what suits you best.
        </p>
      </div>

      {/* Recommended Degrees Section */}
      {recommended.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <HiStar className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Your UniVise Recommendations
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {recommended.map((degree, idx) => (
              <Link
                to={`/degrees/${degree.id}`}
                key={idx}
                className="group relative rounded-2xl overflow-hidden
                         bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50
                         dark:from-amber-900/10 dark:via-yellow-900/10 dark:to-orange-900/10
                         border-2 border-amber-200 dark:border-amber-800
                         p-6 shadow-md hover:shadow-xl
                         transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500" />
                
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <HiAcademicCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="flex-1 text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {degree.degreeName}
                  </h3>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {degree.reason}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-600 
                      p-6 shadow-2xl ring-1 ring-slate-400/20 dark:ring-slate-500/20">
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Start typing to search degrees..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl
                         bg-slate-50 dark:bg-slate-800
                         border-2 border-slate-200 dark:border-slate-700
                         text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
                         transition-all duration-200"
              />
            </div>

            {/* Filter Toggle Button */}
            {!showFilter ? (
              <button
                onClick={() => setShowFilter(true)}
                className="px-6 py-3.5 rounded-xl
                         bg-gradient-to-r from-sky-500 to-blue-600
                         text-white font-bold
                         shadow-md hover:shadow-lg
                         transition-all duration-200
                         flex items-center gap-2 whitespace-nowrap"
              >
                <HiFilter className="w-5 h-5" />
                <span>Add Filter</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowFilter(false);
                  setFacultyFilter("");
                }}
                className="px-6 py-3.5 rounded-xl
                         bg-slate-200 dark:bg-slate-700
                         text-slate-700 dark:text-slate-300 font-bold
                         hover:bg-slate-300 dark:hover:bg-slate-600
                         transition-all duration-200
                         flex items-center gap-2 whitespace-nowrap"
              >
                <HiX className="w-5 h-5" />
                <span>Clear Filter</span>
              </button>
            )}
          </div>

          {/* Faculty Filter Dropdown */}
          {showFilter && (
            <div className="mt-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Filter by Faculty
              </label>
              <select
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl
                         bg-slate-50 dark:bg-slate-800
                         border-2 border-slate-200 dark:border-slate-700
                         text-slate-900 dark:text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
                         transition-all duration-200"
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
        </div>
      </div>

      {/* Results Section */}
      {(query.length >= 2 || facultyFilter !== "" || results.length > 0) && (
        <>
          {results.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Found {results.length} {results.length === 1 ? 'degree' : 'degrees'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {results.map((degree) => (
                  <Link
                    to={`/degrees/${degree.id}`}
                    key={degree.id}
                    className="group relative rounded-2xl overflow-hidden
                             bg-white dark:bg-slate-900
                             border-2 border-slate-300 dark:border-slate-600
                             p-6 shadow-xl hover:shadow-2xl
                             transition-all duration-300 hover:-translate-y-1
                             ring-1 ring-slate-400/20 dark:ring-slate-500/20"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <h3 className="text-lg font-bold text-blue-800 dark:text-blue-400 mb-2 leading-tight">
                      {degree.program_name}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold
                                     bg-slate-100 dark:bg-slate-800
                                     text-slate-600 dark:text-slate-200
                                     border border-slate-200 dark:border-slate-700">
                        {degree.faculty}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <HiSearch className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                No degrees found. Try another keyword or adjust your filter.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DegreeSearch;
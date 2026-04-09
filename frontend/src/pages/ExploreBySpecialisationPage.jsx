// src/pages/ExploreBySpecialisationPage.jsx
import { useEffect, useState } from "react";
import { HiArrowLeft, HiSearch, HiX } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";

const TYPES = ["All", "Major", "Minor", "Honours"];

function ExploreBySpecialisationPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [allSpecs, setAllSpecs] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("unsw_specialisations")
          .select("id, major_name, specialisation_type, faculty, uoc_required, major_code");
        if (error) throw error;
        setAllSpecs(data || []);
        const unique = [...new Set(data.map((d) => d.faculty).filter(Boolean))].sort();
        setFaculties(unique);
      } catch (err) {
        console.error("Specialisation fetch error:", err.message);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = allSpecs.filter((s) => {
    const matchesType = typeFilter === "All" || s.specialisation_type === typeFilter;
    const matchesQuery =
      query.length === 0 || s.major_name?.toLowerCase().includes(query.toLowerCase());
    const matchesFaculty = !facultyFilter || s.faculty === facultyFilter;
    return matchesType && matchesQuery && matchesFaculty;
  });

  const hasFilters = query.length > 0 || facultyFilter !== "" || typeFilter !== "All";

  const clearAll = () => {
    setQuery("");
    setFacultyFilter("");
    setTypeFilter("All");
  };

  const getRoute = (spec) => {
    if (spec.specialisation_type === "Major") return `/specialisation/major/${spec.id}`;
    if (spec.specialisation_type === "Minor") return `/specialisation/minor/${spec.id}`;
    return `/specialisation/honours/${spec.id}`;
  };

  const typeColour = (type) => {
    if (type === "Major") return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300";
    if (type === "Minor") return "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300";
    return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">

      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
        <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">

        {/* Back */}
        <button
          onClick={() => navigate("/planner")}
          className="group inline-flex items-center gap-2 mt-8 mb-6 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 shadow-sm transition-all"
        >
          <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to My Planner
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-8 mb-16">

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            Search Specialisations
          </h2>

          {/* Search bar */}
          <div className="relative mb-3">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-500 dark:focus:border-sky-500 transition-colors outline-none text-sm"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type tabs + Faculty filter row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {/* Type pills */}
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    typeFilter === t
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:border-sky-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Faculty dropdown */}
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className={`sm:w-80 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 outline-none transition-all cursor-pointer shadow-sm ${
                facultyFilter
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:border-sky-400"
              }`}
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Result count + clear */}
          <div className="flex items-center justify-between mt-5 mb-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {loading ? "Loading…" : filtered.length === allSpecs.length
                ? `${allSpecs.length} specialisations`
                : `${filtered.length} of ${allSpecs.length} specialisations`}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 transition-colors flex items-center gap-1"
              >
                <HiX className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>

          {/* Results */}
          {!loading && filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {filtered.map((spec) => (
                <Link
                  to={getRoute(spec)}
                  key={spec.id}
                  className="group flex flex-col gap-3 p-5 rounded-xl bg-gradient-to-br from-white to-sky-50/50 dark:from-slate-800/60 dark:to-sky-900/10 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:to-sky-50/80 hover:shadow-md transition-all"
                >
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                    {spec.major_name}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {spec.specialisation_type && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColour(spec.specialisation_type)}`}>
                        {spec.specialisation_type}
                      </span>
                    )}
                    {spec.faculty && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {spec.faculty}
                      </span>
                    )}
                    {spec.major_code && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                        {spec.major_code}
                      </span>
                    )}
                    {spec.uoc_required && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {spec.uoc_required} UOC
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-16">
              <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <HiSearch className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No specialisations found
                {query && <> for <span className="font-medium text-slate-700 dark:text-slate-300">"{query}"</span></>}
              </p>
              <button onClick={clearAll} className="mt-3 text-sm text-sky-600 dark:text-sky-400 hover:underline">
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}

export default ExploreBySpecialisationPage;

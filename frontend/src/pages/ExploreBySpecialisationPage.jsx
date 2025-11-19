// src/pages/ExploreBySpecialisationPage.jsx
import React, { useState, useEffect } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import {
  HiSearch,
  HiAcademicCap,
  HiStar,
  HiChevronLeft,
  HiArrowRight,
  HiArrowLeft,
  HiCollection,
} from "react-icons/hi";

function ExploreBySpecialisationPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [results, setResults] = useState([]);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const { data, error } = await supabase
          .from("unsw_specialisations")
          .select("faculty")
          .neq("faculty", "");
        if (error) throw error;
        const unique = [...new Set(data.map((d) => d.faculty))];
        setFaculties(unique);
      } catch (err) {
        console.error("Faculty fetch error:", err.message);
      }
    };
    fetchFaculties();
  }, []);

  useEffect(() => {
    const fetchSpecialisations = async () => {
      if (!selectedType) return;

      try {
        let builder = supabase
          .from("unsw_specialisations")
          .select("*")
          .eq("specialisation_type", selectedType);

        if (query.length >= 2) builder = builder.ilike("major_name", `%${query}%`);
        if (facultyFilter) builder = builder.eq("faculty", facultyFilter);

        const { data, error } = await builder;
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Specialisation fetch error:", err.message);
      }
    };

    fetchSpecialisations();
  }, [selectedType, query, facultyFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">

      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">

          {/* ENTRY PAGE */}
          {!selectedType && (
            <>
              {/* Back Button */}
              <button
                onClick={() => navigate("/planner")}
                className="group flex items-center gap-2 mb-8 mt-8 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Back to My Planner</span>
              </button>

              {/* Header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                  Explore Specialisations
                </div>
              </div>

              {/* Type Selection Cards - Bigger & Better */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">

                {[
                  {
                    type: "Major",
                    icon: <HiStar className="w-7 h-7" />,
                    gradient: "from-blue-500 to-sky-500",
                    desc: "Primary area of expertise forming the core of your academic focus.",
                  },
                  {
                    type: "Minor",
                    icon: <HiCollection className="w-7 h-7" />,
                    gradient: "from-indigo-500 to-purple-600",
                    desc: "Complementary areas that broaden your studies and skillset.",
                  },
                  {
                    type: "Honours",
                    icon: <HiAcademicCap className="w-7 h-7" />,
                    gradient: "from-purple-500 to-pink-600",
                    desc: "Advanced research year showcasing your academic excellence.",
                  },
                ].map(({ type, icon, gradient, desc }) => (
                  <div
                    key={type}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg hover:shadow-xl p-8 transition-all duration-200 cursor-pointer hover:-translate-y-1"
                    onClick={() => setSelectedType(type)}
                  >
                    {/* Icon & Title */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <div className="text-slate-700 dark:text-slate-300">{icon}</div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {type}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed min-h-[60px]">
                      {desc}
                    </p>

                    {/* Button */}
                    <button
                      className={`w-full px-5 py-3 rounded-lg bg-gradient-to-r ${gradient} hover:opacity-90 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2`}
                    >
                      <span>Explore {type}s</span>
                      <HiArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* RESULTS PAGE */}
          {selectedType && (
            <>
              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedType("");
                  setQuery("");
                  setFacultyFilter("");
                  setResults([]);
                }}
                className="group flex items-center gap-2 mb-10 mt-8 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <HiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Back</span>
              </button>

              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                    Explore
                  </span>{" "}
                  {selectedType === "Honours" ? "Honours" : `${selectedType}s`}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Search and filter to find the perfect {selectedType.toLowerCase()} for your degree.
                </p>
              </div>

              {/* Search Section */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-8 mb-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30">
                    <HiSearch className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Search {selectedType}s
                  </h2>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-4">
                  {/* Search input */}
                  <div className="relative flex-1 w-full">
                    <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={`Search ${selectedType.toLowerCase()}s...`}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  {/* Faculty filter */}
                  <select
                    value={facultyFilter}
                    onChange={(e) => setFacultyFilter(e.target.value)}
                    className="w-full lg:w-64 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="">All Faculties</option>
                    {faculties.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results */}
              {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                  {results.map((spec) => (
                    <Link
                      to={
                        spec.specialisation_type === "Major"
                          ? `/specialisation/major/${spec.id}`
                          : spec.specialisation_type === "Minor"
                          ? `/specialisation/minor/${spec.id}`
                          : `/specialisation/honours/${spec.id}`
                      }
                      key={spec.id}
                      className="group rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                        {spec.major_name}
                      </h3>

                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {spec.overview_description?.slice(0, 120) || "No description available."}
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {spec.faculty}
                        </span>

                        {spec.uoc_required && (
                          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {spec.uoc_required}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 mb-16">
                  <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <HiSearch className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base">
                    No {selectedType.toLowerCase()}s found. Try another search.
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default ExploreBySpecialisationPage;
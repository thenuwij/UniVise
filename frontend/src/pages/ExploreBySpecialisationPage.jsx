// src/pages/ExploreBySpecialisationPage.jsx
import React, { useState, useEffect } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import {
  HiSearch,
  HiAcademicCap,
  HiStar,
  HiLightningBolt,
  HiChevronLeft,
  HiArrowRight,
  HiCollection,
} from "react-icons/hi";

function ExploreBySpecialisationPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(""); // Major, Minor, or Honours
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [results, setResults] = useState([]);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // Fetch faculties for dropdown
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const { data, error } = await supabase
          .from("unsw_specialisations")
          .select("faculty")
          .neq("faculty", "");
        if (error) throw error;
        if (data) {
          const unique = [...new Set(data.map((d) => d.faculty))];
          setFaculties(unique);
        }
      } catch (err) {
        console.error("Faculty fetch error:", err.message);
      }
    };
    fetchFaculties();
  }, []);

  // Fetch results once type is selected
  useEffect(() => {
    const fetchSpecialisations = async () => {
      if (!selectedType) return;

      try {
        let builder = supabase
          .from("unsw_specialisations")
          .select("*")
          .eq("specialisation_type", selectedType);

        if (query.length >= 2) {
          builder = builder.ilike("major_name", `%${query}%`);
        }
        if (facultyFilter) {
          builder = builder.eq("faculty", facultyFilter);
        }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300/80 to-slate-400/40
                dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative">
      {/* Background decorative elements */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-sky-200/30 via-blue-200/20 to-transparent rounded-full blur-3xl dark:opacity-20" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-200/20 via-purple-200/10 to-transparent rounded-full blur-3xl dark:opacity-20" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/30 via-cyan-100/20 to-transparent rounded-full blur-3xl dark:opacity-20" />
      </div>

      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="relative max-w-7xl mx-auto py-24 px-6">
        
        {/* TYPE SELECTION VIEW */}
        {!selectedType && (
          <>
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight
                              text-slate-900 dark:text-slate-100">
                  Explore Specialisations
                </h1>
                <div className="h-1.5 w-24 mx-auto mt-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-full" />
              </div>
              <p className="text-lg text-slate-800 dark:text-slate-200 max-w-2xl mx-auto font-semibold">
                Select a specialisation type to discover programs that align with your interests and goals.
              </p>
            </div>

            {/* Type Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  type: "Major",
                  icon: <HiStar className="w-7 h-7" />,
                  gradient: "from-sky-500 to-blue-600",
                  desc: "Core specialisations that define your primary study area and expertise.",
                  bgGradient: "from-sky-50 to-blue-50",
                  darkBgGradient: "from-sky-900/20 to-blue-900/20",
                },
                {
                  type: "Minor",
                  icon: <HiCollection className="w-7 h-7" />,
                  gradient: "from-blue-500 to-indigo-600",
                  desc: "Complementary subjects that broaden your expertise and open new pathways.",
                  bgGradient: "from-blue-50 to-indigo-50",
                  darkBgGradient: "from-blue-900/20 to-indigo-900/20",
                },
                {
                  type: "Honours",
                  icon: <HiAcademicCap className="w-7 h-7" />,
                  gradient: "from-indigo-500 to-purple-600",
                  desc: "Advanced one-year research and thesis-based programs for top achievers.",
                  bgGradient: "from-indigo-50 to-purple-50",
                  darkBgGradient: "from-indigo-900/20 to-purple-900/20",
                },
              ].map(({ type, icon, gradient, desc, bgGradient, darkBgGradient }) => (
                <div
                  key={type}
                  className="group relative rounded-2xl overflow-hidden
                            bg-white dark:bg-slate-900
                            border-2 border-slate-300 dark:border-slate-600
                            p-6 shadow-xl hover:shadow-2xl
                            transition-all duration-300 hover:-translate-y-1
                            ring-1 ring-slate-400/20 dark:ring-slate-500/20"
                >
                  {/* Gradient accent bar */}
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
                  
                  <div className="p-8">
                    {/* Icon */}
                    <div className={`mb-6 inline-flex p-4 rounded-xl 
                                  bg-gradient-to-br ${bgGradient} 
                                  dark:bg-gradient-to-br dark:${darkBgGradient}
                                  shadow-md group-hover:shadow-lg transition-all duration-300`}>
                      <div className="text-slate-700 dark:text-slate-300">
                        {icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {type}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 min-h-[60px]">
                      {desc}
                    </p>

                    {/* CTA Button */}
                    <button
                      onClick={() => setSelectedType(type)}
                      className={`group/btn w-full px-6 py-3 rounded-xl 
                               bg-gradient-to-r ${gradient}
                               text-white font-bold text-sm
                               shadow-md hover:shadow-xl
                               transition-all duration-300
                               flex items-center justify-center gap-2`}
                    >
                      <span>Explore {type === 'Honours' ? type : `${type}s`}</span>
                      <HiArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Decorative corner element */}
                  <div className={`absolute bottom-0 right-0 w-32 h-32 
                                 bg-gradient-to-tl ${gradient} 
                                 opacity-5 rounded-tl-full 
                                 group-hover:opacity-10 transition-opacity duration-300`} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* SEARCH & RESULTS VIEW */}
        {selectedType && (
          <>
            {/* Back button + Header */}
            <div className="mb-10">
              <button
                onClick={() => {
                  setSelectedType("");
                  setQuery("");
                  setFacultyFilter("");
                  setResults([]);
                }}
                className="group flex items-center gap-2 text-slate-600 dark:text-slate-400 
                         hover:text-slate-900 dark:hover:text-slate-100
                         font-medium text-sm mb-6 transition-colors duration-200"
              >
                <HiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Back to type selection</span>
              </button>

              <div className="text-center">
                <div className="inline-block mb-4">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight
                              text-slate-900 dark:text-slate-100">
                    Explore {selectedType === 'Honours' ? selectedType : `${selectedType}s`}
                  </h1>
                  <div className="h-1.5 w-20 mx-auto mt-3 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-full" />
                </div>
                <p className="text-base text-slate-800 dark:text-slate-200 max-w-xl mx-auto font-semibold">
                  Search and filter to find the perfect {selectedType.toLowerCase()} for your degree.
                </p>
              </div>
            </div>

            {/* Search bar + filter */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-600 p-6 shadow-2xl mb-10 ring-1 ring-slate-400/20 dark:ring-slate-500/20">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${selectedType.toLowerCase()}s by name...`}
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

                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="w-full sm:w-60 px-4 py-3.5 rounded-xl
                             bg-slate-50 dark:bg-slate-800
                             border-2 border-slate-200 dark:border-slate-700
                             text-slate-900 dark:text-slate-100
                             focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
                             transition-all duration-200"
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
              <>
                <div className="mb-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Found {results.length} {selectedType === 'Honours' ? selectedType.toLowerCase() : `${selectedType.toLowerCase()}${results.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.map((spec) => (
                    <Link
                      to={`/specialisations/${spec.id}`}
                      key={spec.id}
                      className="group relative rounded-2xl overflow-hidden
                                 bg-white dark:bg-slate-900
                                 border-2 border-slate-200 dark:border-slate-700
                                 p-6 shadow-md hover:shadow-xl
                                 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <h3 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 
                                  dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent 
                                  mb-3 leading-tight">
                        {spec.major_name}
                      </h3>
                                
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                        {spec.overview_description?.slice(0, 100) || "No description available."}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold
                                      bg-slate-100 dark:bg-slate-800
                                      text-slate-600 dark:text-slate-200
                                      border border-slate-200 dark:border-slate-700">
                          {spec.faculty}
                        </span>
                        {spec.uoc_required && (
                          <span className="px-3 py-1 rounded-lg text-xs font-semibold
                                        bg-slate-100 dark:bg-slate-800
                                        text-slate-600 dark:text-slate-200
                                        border border-slate-200 dark:border-slate-700">
                            {spec.uoc_required} UOC
                          </span>
                        )}
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
                  No {selectedType.toLowerCase()}s found. Try another keyword or faculty filter.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ExploreBySpecialisationPage;
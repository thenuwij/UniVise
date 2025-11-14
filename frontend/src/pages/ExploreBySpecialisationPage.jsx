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
  HiChevronLeft,
  HiArrowRight,
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-200 via-slate-300/80 to-slate-400/40
                    dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative">

      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="relative w-full px-6 py-24 max-w-[1600px] mx-auto">

        {/* ENTRY PAGE */}
        {!selectedType && (
          <>
            {/* Header */}
            <div className="text-center mb-20">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
                Explore Specialisations
              </h1>

              <p className="text-lg text-slate-700 dark:text-slate-300 max-w-3xl mx-auto font-medium mt-4">
                Choose a specialisation type to begin exploring majors, minors, and honours pathways.
              </p>
            </div>

            {/* Improved Type Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-[1400px] mx-auto">

              {[
                {
                  type: "Major",
                  icon: <HiStar className="w-8 h-8" />,
                  gradient: "from-sky-500 to-blue-600",
                  bg1: "from-sky-50 to-blue-50",
                  bg2: "from-sky-900/20 to-blue-900/20",
                  desc: "Primary area of expertise forming the core of your academic focus.",
                },
                {
                  type: "Minor",
                  icon: <HiCollection className="w-8 h-8" />,
                  gradient: "from-blue-500 to-indigo-600",
                  bg1: "from-blue-50 to-indigo-50",
                  bg2: "from-blue-900/20 to-indigo-900/20",
                  desc: "Complementary areas that broaden your studies and skillset.",
                },
                {
                  type: "Honours",
                  icon: <HiAcademicCap className="w-8 h-8" />,
                  gradient: "from-indigo-500 to-purple-600",
                  bg1: "from-indigo-50 to-purple-50",
                  bg2: "from-indigo-900/20 to-purple-900/20",
                  desc: "Advanced research year showcasing your academic excellence.",
                },
              ].map(({ type, icon, gradient, bg1, bg2, desc }) => (
                <div
                  key={type}
                  className="
                    group relative rounded-3xl
                    bg-white dark:bg-slate-900
                    border border-slate-200 dark:border-slate-700 
                    p-10 shadow-xl hover:shadow-2xl
                    transition-all duration-300 hover:-translate-y-2
                    ring-1 ring-slate-400/10 dark:ring-slate-500/20"
                >
                  {/* Accent bar */}
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`} />

                  {/* Icon */}
                  <div className={`mb-6 inline-flex p-6 rounded-2xl
                    bg-gradient-to-br ${bg1} dark:${bg2} shadow-md`}>
                    <div className="text-slate-700 dark:text-slate-300">{icon}</div>
                  </div>

                  {/* Text */}
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    {type}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-10 min-h-[72px]">
                    {desc}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => setSelectedType(type)}
                    className={`
                      group/btn w-full py-4 rounded-xl 
                      bg-gradient-to-r ${gradient}
                      text-white text-sm font-bold
                      shadow-md hover:shadow-xl
                      transition-all duration-300
                      flex items-center justify-center gap-2`}
                  >
                    Explore
                    <HiArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <div className={`absolute bottom-0 right-0 w-40 h-40 
                                   bg-gradient-to-tl ${gradient} 
                                   opacity-10 rounded-tl-full`} />
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
              className="group flex items-center gap-2 text-slate-600 dark:text-slate-400 
                         hover:text-slate-900 dark:hover:text-white 
                         font-medium text-sm mb-10 transition-colors"
            >
              <HiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to selection
            </button>

            <div className="text-center mb-14">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">
                Explore {selectedType === "Honours" ? "Honours" : `${selectedType}s`}
              </h1>
              <p className="text-base text-slate-700 dark:text-slate-300 max-w-xl mx-auto font-medium">
                Search and filter to find the perfect {selectedType.toLowerCase()} for your degree.
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 p-8 shadow-xl mb-14 max-w-[1400px] mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-5">
                {/* Search input */}
                <div className="relative flex-1 w-full">
                  <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={`Search ${selectedType.toLowerCase()}s...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl
                               bg-slate-50 dark:bg-slate-800
                               border border-slate-200 dark:border-slate-700
                               text-slate-900 dark:text-white
                               focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                {/* Faculty filter */}
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="w-full lg:w-64 px-4 py-4 rounded-xl
                             bg-slate-50 dark:bg-slate-800
                             border border-slate-200 dark:border-slate-700
                             text-slate-900 dark:text-white
                             focus:ring-2 focus:ring-sky-500 transition-all"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1400px] mx-auto">
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
                    className="group rounded-2xl p-6 bg-white dark:bg-slate-900
                              border border-slate-200 dark:border-slate-700
                              shadow-md hover:shadow-xl transition-all 
                              hover:-translate-y-1"
                  >

                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700
                                   dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent mb-3">
                      {spec.major_name}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {spec.overview_description?.slice(0, 120) || "No description available."}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold
                                      bg-slate-100 dark:bg-slate-800
                                      text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {spec.faculty}
                      </span>

                      {spec.uoc_required && (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold
                                        bg-slate-100 dark:bg-slate-800
                                        text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {spec.uoc_required} UOC
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <HiSearch className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  No {selectedType.toLowerCase()}s found. Try another search.
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

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { HiSearch, HiFilter, HiX, HiBookOpen } from "react-icons/hi";

function CourseSearch() {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [facultyFilter, setFacultyFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("unsw_courses")
        .select("*")
        .range(0, 2999); // Fetches rows 0 through 2999 (inclusive)

      console.log("Fetched courses:", data?.length);

      if (!error) {
        setCourses(data);

        // Extract unique faculty names for dropdown
        const facultyList = Array.from(
          new Set(data.map((course) => course.faculty).filter(Boolean))
        );
        setFaculties(facultyList.sort());
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesQuery =
      query.length === 0 ||
      course.code.toLowerCase().includes(query.toLowerCase()) ||
      course.title.toLowerCase().includes(query.toLowerCase());

    const matchesFaculty =
      !facultyFilter || course.faculty === facultyFilter;

    return matchesQuery && matchesFaculty;
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-block mb-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight
                       text-slate-900 dark:text-slate-100">
            Explore Courses
          </h1>
          <div className="h-1.5 w-24 mx-auto mt-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-full" />
        </div>
        <p className="text-lg text-slate-800 dark:text-slate-200 max-w-2xl mx-auto font-semibold">
          Search and filter to find courses that fit your academic goals and interests.
        </p>
      </div>

      {/* Search Bar + Filter Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-600 p-6 shadow-2xl mb-10 ring-1 ring-slate-400/20 dark:ring-slate-500/20">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by course code or title..."
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
          {!showFilters ? (
            <button
              onClick={() => setShowFilters(true)}
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
                setShowFilters(false);
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
        {showFilters && (
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

      {/* Results Section */}
      {query.length >= 1 || facultyFilter ? (
        filteredCourses.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Found {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredCourses.map((course) => (
                <Link
                  to={`/course/${course.id}`}
                  key={course.id}
                  className="group relative rounded-2xl overflow-hidden
                           bg-white dark:bg-slate-900
                           border-2 border-slate-300 dark:border-slate-600
                           p-6 shadow-xl hover:shadow-2xl
                           transition-all duration-300 hover:-translate-y-1
                           ring-1 ring-slate-400/20 dark:ring-slate-500/20"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <HiBookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-blue-800 dark:text-blue-400 mb-1 leading-tight">
                        {course.code}
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                        {course.title}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold
                                   bg-slate-100 dark:bg-slate-800
                                   text-slate-600 dark:text-slate-200
                                   border border-slate-200 dark:border-slate-700">
                      {course.faculty}
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
              No matching courses found. Try another search term or faculty filter.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <HiBookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Start typing to search for courses or add a faculty filter.
          </p>
        </div>
      )}
    </div>
  );
}

export default CourseSearch;
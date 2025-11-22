import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link, useSearchParams } from "react-router-dom";
import { HiSearch, HiBookOpen } from "react-icons/hi";

function CourseSearch() {
  const [query, setQuery] = useState("");
  const [allCourses, setAllCourses] = useState([]);
  const [facultyFilter, setFacultyFilter] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [searchParams] = useSearchParams();
  const sectionName = searchParams.get("section");

  // Fetch ALL courses on mount (like degrees do)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("unsw_courses")
          .select("*");
        if (error) throw error;
        setAllCourses(data || []);

        // Extract unique faculties
        const unique = [...new Set(data.map((course) => course.faculty).filter(Boolean))];
        setFaculties(unique.sort());
      } catch (err) {
        console.error("Course fetch error:", err.message);
      }
    };

    fetchCourses();
  }, []);

  // Filter courses client-side (like degrees do)
  const filteredCourses = allCourses.filter((course) => {
    const matchesQuery =
      query.length === 0 ||
      course.code.toLowerCase().includes(query.toLowerCase()) ||
      course.title.toLowerCase().includes(query.toLowerCase());

    const matchesFaculty =
      !facultyFilter || course.faculty === facultyFilter;

    return matchesQuery && matchesFaculty;
  });

  return (
    <div className="w-full">

      {/* Show section info if coming from progress page */}
      {sectionName && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-semibold">Adding course to:</span> {sectionName}
          </p>
        </div>
      )}
      
      {/* Search Inputs */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by course code or title..."
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
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 mb-16">
          {filteredCourses.map((course) => (
            <Link
              to={`/course/${course.id}${sectionName ? `?section=${encodeURIComponent(sectionName)}` : ''}`}
              key={course.id}
              className="group rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                {course.code}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {course.title}
              </p>

              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {course.faculty}
                </span>

                {course.uoc && (
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {course.uoc} UOC
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
            No courses found. Try another search.
          </p>
        </div>
      )}
    </div>
  );
}

export default CourseSearch;
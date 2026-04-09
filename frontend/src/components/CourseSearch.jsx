import { useEffect, useState } from "react";
import { HiSearch, HiX } from "react-icons/hi";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

function CourseSearch() {
  const [query, setQuery] = useState("");
  const [allCourses, setAllCourses] = useState([]);
  const [facultyFilter, setFacultyFilter] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [searchParams] = useSearchParams();
  const sectionName = searchParams.get("section");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("unsw_courses")
          .select("id, code, title, faculty, uoc, study_level");
        if (error) throw error;
        setAllCourses(data || []);
        const unique = [...new Set(data.map((c) => c.faculty).filter(Boolean))].sort();
        setFaculties(unique);
      } catch (err) {
        console.error("Course fetch error:", err.message);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = allCourses.filter((course) => {
    const matchesQuery =
      query.length === 0 ||
      course.code?.toLowerCase().includes(query.toLowerCase()) ||
      course.title?.toLowerCase().includes(query.toLowerCase());
    const matchesFaculty = !facultyFilter || course.faculty === facultyFilter;
    return matchesQuery && matchesFaculty;
  });

  const hasFilters = query.length > 0 || facultyFilter !== "";

  const clearAll = () => {
    setQuery("");
    setFacultyFilter("");
  };

  return (
    <div className="w-full">

      {sectionName && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-semibold">Adding course to:</span> {sectionName}
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by course code or title…"
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

      {/* Faculty filter */}
      <div className="mt-3">
        <select
          value={facultyFilter}
          onChange={(e) => setFacultyFilter(e.target.value)}
          className={`w-full sm:w-80 px-5 py-3.5 rounded-xl text-sm font-semibold border-2 outline-none transition-all cursor-pointer shadow-sm ${
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
          {filteredCourses.length === allCourses.length
            ? `${allCourses.length} courses`
            : `${filteredCourses.length} of ${allCourses.length} courses`}
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
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
          {filteredCourses.map((course) => (
            <Link
              to={`/course/${course.id}${sectionName ? `?section=${encodeURIComponent(sectionName)}` : ""}`}
              key={course.id}
              className="group flex flex-col gap-3 p-5 rounded-xl bg-gradient-to-br from-white to-sky-50/50 dark:from-slate-800/60 dark:to-sky-900/10 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:to-sky-50/80 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mb-0.5">{course.code}</p>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                  {course.title}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {course.faculty && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {course.faculty}
                  </span>
                )}
                {course.uoc && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                    {course.uoc}
                  </span>
                )}
                {course.study_level && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {course.study_level}
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No courses found
            {query && <> for <span className="font-medium text-slate-700 dark:text-slate-300">"{query}"</span></>}
          </p>
          {hasFilters && (
            <button onClick={clearAll} className="mt-3 text-sm text-sky-600 dark:text-sky-400 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CourseSearch;

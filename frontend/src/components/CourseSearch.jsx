import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

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
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-10">

        <h1 className="mb-4 text-3xl font-extrabold md:text-5xl lg:text-6xl leading-tight">
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-600 inline-block">
            Search Courses
          </div>{" "}
        </h1>
        <p className="text-lg font-medium text-slate-800 lg:text-xl">
          Explore course information, filter by faculty, and find what fits your goals.
        </p>

      </div>



      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 justify-center">
        <input
          type="text"
          placeholder="Start typing to search for courses"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl px-5 py-3 text-base border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all w-full sm:w-auto"
        />

        {!showFilters && (
          <button
            onClick={() => setShowFilters(true)}
            className="px-6 py-3 rounded-full bg-white border border-slate-200 font-semibold text-base hover:shadow-md transition-all shadow flex items-center justify-center"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
              + Add Filter
            </span>
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mb-6">
          <label className="block mb-2 text-slate-700 font-medium">
            Filter by Faculty:
          </label>
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Select faculty</option>
            {faculties.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </select>
        </div>
      )}

     {query.length >= 1 || facultyFilter ? (
        filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredCourses.map((course) => (
              <Link
                to={`/course/${course.id}`}
                key={course.id}
                className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 block"
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  {course.code}: {course.title}
                </h3>
                <p className="text-sm text-slate-500">{course.faculty}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 mt-8">
            No matching courses found.
          </p>
        )
      ) : (
        <p className="text-center text-slate-400 mt-6">
          Start typing to search for courses or add a filter.
        </p>
      )}

    </div>
  );
}

export default CourseSearch;

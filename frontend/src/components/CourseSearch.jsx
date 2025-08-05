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
      const { data, error } = await supabase.from("unsw_courses").select("*");
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
        <p className="text-lg font-medium text-slate-800 lg:text-xl dark:text-slate-200">
          Explore course information, filter by faculty, and find what fits your goals.
        </p>

      </div>



      <input
        type="text"
        placeholder="Search by course code or title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="mb-4 text-sm text-white bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 transition"
      >
        {showFilters ? "Hide Filters" : "Add Filter"}
      </button>

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
          <ul className="space-y-4">
            {filteredCourses.map((course) => (
              <li key={course.id}>
                <Link
                  to={`/course/${course.id}`}
                  className="block bg-white p-4 rounded-lg shadow cursor-pointer hover:bg-indigo-50 transition"
                >
                  <h2 className="text-xl font-semibold text-slate-800">
                    {course.code}: {course.title}
                  </h2>
                  <p className="text-sm text-slate-600">{course.faculty}</p>
                </Link>
              </li>
            ))}
          </ul>
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

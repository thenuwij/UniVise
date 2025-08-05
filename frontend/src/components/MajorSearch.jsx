import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function MajorSearch({ onSelectMajor }) {
  const [query, setQuery] = useState("");
  const [majors, setMajors] = useState([]);

  useEffect(() => {
    const fetchMajors = async () => {
      const { data, error } = await supabase
        .from("majors")
        .select("*")
        .range(0, 2999); 

      if (!error && data) setMajors(data);
    };

    fetchMajors();
  }, []);

  const filteredMajors = majors.filter((major) =>
    major.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Gradient Heading */}
      <div className="text-center mb-10">
        <h1 className="mb-4 text-3xl font-extrabold md:text-5xl lg:text-6xl leading-tight">
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-600 inline-block">
            Search Majors
          </div>
        </h1>
        <p className="text-lg font-medium text-slate-800 lg:text-xl">
          Browse UNSW majors and find your academic focus.
        </p>
      </div>

      {/* Search Input */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Start typing to search for majors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-auto flex-1 rounded-xl px-5 py-3 text-base border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
        />
      </div>

      {/* Results */}
      {query.length >= 1 ? (
        filteredMajors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredMajors.map((major) => (
              <div
                key={major.id}
                onClick={() => onSelectMajor(major)}
                className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  {major.name}
                </h3>
                {major.faculty && (
                  <p className="text-sm text-slate-500">{major.faculty}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 mt-8">
            No matching majors found.
          </p>
        )
      ) : (
        <p className="text-center text-slate-400 mt-6">
          Start typing to search for majors.
        </p>
      )}
    </div>
  );
}

export default MajorSearch;

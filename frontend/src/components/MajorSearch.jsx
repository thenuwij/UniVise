import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function MajorSearch({ onSelectMajor }) {
  const [query, setQuery] = useState("");
  const [majors, setMajors] = useState([]);

  useEffect(() => {
    const fetchMajors = async () => {
      const { data, error } = await supabase.from("majors").select("*");
      if (!error) setMajors(data);
    };

    fetchMajors();
  }, []);

  const filteredMajors = majors.filter((major) =>
    major.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search majors..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 mb-6 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />

      {filteredMajors.length > 0 ? (
        <ul className="space-y-4">
          {filteredMajors.map((major) => (
            <li
              key={major.id}
              onClick={() => onSelectMajor(major)}
              className="bg-white p-4 rounded-lg shadow cursor-pointer hover:bg-indigo-50 transition"
            >
              <h2 className="text-xl font-semibold text-slate-800">
                {major.name}
              </h2>
              {major.faculty && (
                <p className="text-sm text-slate-600">{major.faculty}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-slate-500">No matching majors found.</p>
      )}
    </div>
  );
}

export default MajorSearch;

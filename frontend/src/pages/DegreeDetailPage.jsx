import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

function DegreeDetailPage() {
  const { degreeId } = useParams();
  const [degree, setDegree] = useState(null);
  const [majors, setMajors] = useState([]);
  const [minors, setMinors] = useState([]);
  const [doubleDegrees, setDoubleDegrees] = useState([]);

  useEffect(() => {
    const fetchDegreeData = async () => {
      const { data: deg } = await supabase
        .from("unsw_degrees")
        .select("*")
        .eq("id", degreeId)
        .single();

      const parsedCareerOutcomes = (() => {
        try {
          return deg.career_outcomes?.startsWith("[")
            ? JSON.parse(deg.career_outcomes)
            : deg.career_outcomes.split(",").map((s) => s.trim());
        } catch {
          return [];
        }
      })();

      setDegree({ ...deg, career_outcomes: parsedCareerOutcomes });

      const { data: maj } = await supabase
        .from("degree_majors")
        .select("major_name")
        .eq("degree_id", degreeId);
      setMajors(maj || []);

      const { data: min } = await supabase
        .from("degree_minors")
        .select("minor_name")
        .eq("degree_id", degreeId);
      setMinors(min || []);

      const { data: dbl } = await supabase
        .from("degree_double_degrees")
        .select("double_degree_name")
        .eq("degree_id", degreeId);
      setDoubleDegrees(dbl || []);
    };

    fetchDegreeData();
  }, [degreeId]);

  if (!degree) return <div className="p-6 text-center text-gray-400 text-lg">Loading degree details...</div>;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <MenuBar />
      <div className="flex flex-col flex-1">
        <DashboardNavBar />
        <main className="flex-1 overflow-y-auto px-4 py-14">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl px-8 sm:px-14 py-16 space-y-16">

            {/* Header Card */}
            <div className="bg-sky-50 border border-sky-100 rounded-2xl shadow-md p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h1 className="text-5xl font-bold text-sky-800 mb-2 tracking-tight">
                  {degree.program_name}
                </h1>
                <p className="text-lg text-sky-600">{degree.faculty}</p>
              </div>
              <button className="px-6 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition text-sm font-medium shadow">
                + Save Degree
              </button>
            </div>

            {/* Overview */}
            <section>
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">Overview</h2>
              <p className="text-base text-gray-700 leading-relaxed">{degree.description}</p>
            </section>

            {/* Key Info */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Key Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-base bg-neutral-50 border border-neutral-200 p-6 rounded-xl text-gray-700 shadow-sm">
                <div><strong>Duration:</strong> {degree.duration_years} year(s)</div>
                <div><strong>UAC Code:</strong> {degree.uac_code || "N/A"}</div>
                <div><strong>Selection Rank:</strong> {degree.lowest_selection_rank || "N/A"}</div>
                <div><strong>ATAR:</strong> {degree.lowest_atar || "N/A"}</div>
                <div><strong>Portfolio:</strong> {degree.portfolio_available ? "Available" : "Not Required"}</div>
                {degree.assumed_knowledge && (
                  <div><strong>Assumed Knowledge:</strong> {degree.assumed_knowledge}</div>
                )}
              </div>
            </section>

            {/* Majors */}
            {majors.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Majors</h2>
                <div className="flex flex-wrap gap-3">
                  {majors.map((m, i) => (
                    <span key={i} className="bg-blue-100 text-blue-900 px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                      {m.major_name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Minors */}
            {minors.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Minors</h2>
                <div className="flex flex-wrap gap-3">
                  {minors.map((m, i) => (
                    <span key={i} className="bg-violet-100 text-violet-900 px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                      {m.minor_name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Double Degrees */}
            {doubleDegrees.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Double Degrees</h2>
                <div className="flex flex-wrap gap-3">
                  {doubleDegrees.map((d, i) => (
                    <span key={i} className="bg-pink-100 text-pink-900 px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                      {d.double_degree_name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Career Outcomes */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Career Outcomes</h2>
              {degree.career_outcomes.length > 0 ? (
                <ul className="list-disc list-inside text-gray-700 text-base space-y-1 bg-green-50 p-5 rounded-xl border border-green-100 shadow-sm">
                  {degree.career_outcomes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No career outcomes listed.</p>
              )}
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

export default DegreeDetailPage;

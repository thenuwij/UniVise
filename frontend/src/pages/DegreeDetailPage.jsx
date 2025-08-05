import React, { useEffect, useState, useRef } from "react";
import { UserAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

function DegreeDetailPage() {
  const { session, user } = UserAuth();
  const { degreeId } = useParams();
  const [degree, setDegree] = useState(null);
  const [majors, setMajors] = useState([]);
  const [minors, setMinors] = useState([]);
  const [doubleDegrees, setDoubleDegrees] = useState([]);
  const [advisorSummary, setAdvisorSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const advisorRef = useRef(null);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const fetchSmartAdvisor = async () => {
    setLoadingSummary(true);
    setError(null);
    setAdvisorSummary(null);

    try {
      const res = await fetch("http://localhost:8000/smart-summary/degree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ degree_id: degreeId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      setAdvisorSummary(data.summary);

      if (advisorRef.current) {
        advisorRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <MenuBar />
      <div className="flex flex-col flex-1">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
        <main className="flex-1 overflow-y-auto px-8 py-14">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">

            {/* LEFT COLUMN */}
            <div className="flex-1 space-y-10">

              {/* Header Card */}
              <div className="bg-sky-50 border border-sky-100 rounded-2xl shadow-md p-8 flex flex-col gap-2">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 text-transparent bg-clip-text mb-2 tracking-tight">
                  {degree.program_name}
                </h1>
                <p className="text-lg text-sky-700">{degree.faculty}</p>
              </div>


              {/* Smart Advisor Prompt Section */}
              <section ref={advisorRef} className="bg-green-50 border border-green-100 p-6 rounded-2xl shadow-sm">
                {loadingSummary ? (
                  <div className="italic text-center text-gray-600">
                    Generating your Smart Advisor summary...
                  </div>
                ) : advisorSummary ? (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Smart Advisor Summary</h2>
                    <div className="text-gray-700 whitespace-pre-line">{advisorSummary}</div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-emerald-800 mb-1">Need guidance?</h2>
                      <p className="text-sm text-emerald-700 max-w-2xl">
                        Click below to generate a personalized summary of how this degree aligns with your goals, interests, and personality.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={fetchSmartAdvisor}
                        className="px-6 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition text-sm font-medium shadow"
                      >
                        Smart Advisor
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Overview */}
              <section>
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">Overview</h2>
                <p className="text-base text-gray-700 leading-relaxed">{degree.description}</p>
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

            {/* RIGHT COLUMN – Key Information */}
            <aside className="w-full lg:w-96">
              <div className="bg-white h-full min-h-[520px] p-6 rounded-3xl shadow border border-gray-200">
                <h2 className="text-2xl font-semibold text-slate-800 mb-6">Key Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: "Duration", value: `${degree.duration_years} year(s)` },
                    { label: "UAC Code", value: degree.uac_code || "N/A" },
                    { label: "Selection Rank", value: degree.lowest_selection_rank || "N/A" },
                    { label: "Lowest ATAR", value: degree.lowest_atar || "N/A" },
                    { label: "Portfolio", value: degree.portfolio_available ? "Available" : "Not Required" },
                    degree.assumed_knowledge && { label: "Assumed Knowledge", value: degree.assumed_knowledge },
                  ]
                    .filter(Boolean)
                    .map((item, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{item.label}</div>
                        <div className="text-base font-semibold text-slate-800">{item.value}</div>
                      </div>
                    ))}
                </div>
              </div>
            </aside>

          </div>
        </main>
      </div>
    </div>
  );
}

export default DegreeDetailPage;

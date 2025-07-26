import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

const personalityDescriptions = {
  Realistic: {
    name: "Realistic",
    summary: "Hands-on, practical, and mechanical. You enjoy working with tools, machines, or being outdoors.",
  },
  Investigative: {
    name: "Investigative",
    summary: "Analytical, curious, and intellectual. You enjoy solving problems, researching, and understanding how things work.",
  },
  Artistic: {
    name: "Artistic",
    summary: "Creative, expressive, and original. You enjoy design, writing, music, or other artistic pursuits.",
  },
  Social: {
    name: "Social",
    summary: "Empathetic, helpful, and people-focused. You enjoy teaching, counseling, or supporting others.",
  },
  Enterprising: {
    name: "Enterprising",
    summary: "Persuasive, confident, and ambitious. You enjoy leading, managing, or launching new ideas.",
  },
  Conventional: {
    name: "Conventional",
    summary: "Organized, detail-oriented, and structured. You enjoy working with systems, data, and routines.",
  },
};

const PersonalityResultPage = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  useEffect(() => {
    const fetchResult = async () => {
      const { data, error } = await supabase
        .from("personality_results")
        .select("*")
        .eq("user_id", session?.user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error("Error fetching result:", error);
        navigate("/quiz"); // fallback
      } else {
        setResult(data);
      }

      setLoading(false);
    };

    if (session?.user?.id) {
      fetchResult();
    }
  }, [session]);

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading your personality result...</p>;
  }

  if (!result) return null;

  const { top_types, result_summary, trait_scores } = result;

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-sky-100 via-white to-indigo-100 py-12 px-6 sm:px-12">
      <div className="w-full bg-white p-10 sm:p-16 rounded-none sm:rounded-2xl shadow-none sm:shadow-xl">
        <h1 className="text-4xl font-bold mb-6 text-sky-600 text-center">Your Personality Result</h1>
        <p className="text-xl mb-10 text-gray-700 text-center">
          You are a <span className="font-semibold">{result_summary}</span> type.
        </p>

        {/* Trait descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {top_types.map((type) => (
            <div
              key={type}
              className="bg-sky-100 p-6 rounded-xl shadow text-left"
            >
              <h2 className="text-xl font-semibold text-sky-700">
                {personalityDescriptions[capitalize(type)]?.name || type}
              </h2>
              <p className="text-gray-800">
                {personalityDescriptions[capitalize(type)]?.summary || "Description not available."}
              </p>
            </div>
          ))}
        </div>

        {/* Trait Scores */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Trait Scores</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {trait_scores &&
              Object.entries(trait_scores).map(([trait, score]) => (
                <div
                  key={trait}
                  className="bg-indigo-50 p-4 rounded-lg shadow-sm text-center"
                >
                  <h4 className="text-md font-medium text-indigo-700 capitalize">{trait}</h4>
                  <p className="text-xl font-bold text-slate-800">{score}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/quiz")}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl shadow-sm transition"
          >
            Retake Quiz
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition"
          >
            Continue to Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalityResultPage;

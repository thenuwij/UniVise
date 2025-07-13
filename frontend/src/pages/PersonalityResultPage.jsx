import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const personalityDescriptions = {
  R: {
    name: "Realistic",
    summary: "Hands-on, practical, and mechanical. You enjoy working with tools, machines, or being outdoors.",
  },
  I: {
    name: "Investigative",
    summary: "Analytical, curious, and intellectual. You enjoy solving problems, researching, and understanding how things work.",
  },
  A: {
    name: "Artistic",
    summary: "Creative, expressive, and original. You enjoy design, writing, music, or other artistic pursuits.",
  },
  S: {
    name: "Social",
    summary: "Empathetic, helpful, and people-focused. You enjoy teaching, counseling, or supporting others.",
  },
  E: {
    name: "Enterprising",
    summary: "Persuasive, confident, and ambitious. You enjoy leading, managing, or launching new ideas.",
  },
  C: {
    name: "Conventional",
    summary: "Organized, detail-oriented, and structured. You enjoy working with systems, data, and routines.",
  },
};

const PersonalityResultPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("personality_result");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      navigate("/quiz"); // If no result, send back to quiz
    }
  }, []);

  if (!result) return null;

  const { topTypes, resultSummary, traitScores } = result;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-sky-600">
          Your Personality Result
        </h1>
        <p className="text-xl mb-8 text-gray-700">
          You are a <span className="font-semibold">{resultSummary}</span> type.
        </p>

        {topTypes.map((type) => (
          <div
            key={type}
            className="bg-sky-100 p-4 rounded-xl shadow mb-4 text-left"
          >
            <h2 className="text-xl font-semibold text-sky-700">
              {personalityDescriptions[type].name}
            </h2>
            <p className="text-gray-800">
              {personalityDescriptions[type].summary}
            </p>
          </div>
        ))}

        <div className="mt-8">
            <button
                onClick={() => {
                localStorage.removeItem("personality_result");
                navigate("/quiz");
                }}
                className="px-6 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition"
            >
                Retake Quiz
            </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalityResultPage;

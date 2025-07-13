import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { personalityQuestions } from "../data/PersonalityQuestions.js";
import ProgressBar from "./ProgressBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

const PersonalityQuizForm = () => {
  const navigate = useNavigate();
  const quizRef = useRef(null);
  const { session } = UserAuth();

  const groupedByType = personalityQuestions.reduce((acc, question) => {
    acc[question.type] = acc[question.type] || [];
    acc[question.type].push(question);
    return acc;
  }, {});

  const types = Object.keys(groupedByType);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
  if (quizRef.current) {
    quizRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [currentGroupIndex]);


  const currentType = types[currentGroupIndex];
  const currentGroup = groupedByType[currentType];
  const progress = ((currentGroupIndex + 1) / types.length) * 100;

  const handleScore = (questionId, type, score) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { type, score },
    }));
  };

  const handleNext = async () => {
    if (currentGroupIndex + 1 < types.length) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      const result = calculateResult(answers);
      // Save to Supabase
    const { error } = await supabase.from("personality_results").insert([
      {
        user_id: session?.user?.id,
        trait_scores: result.traitScores,
        top_types: result.topTypes,
        result_summary: result.resultSummary,
      },
    ]);

  if (error) {
    console.error("Error saving personality result:", error);
    alert("Something went wrong while submitting your quiz. Please try again.");
  } else {
    console.log("Personality result saved.");
    alert("Your personality quiz has been submitted successfully!");
    // You can redirect or reset the form here
    navigate("/dashboard");
  }
    }
  };

  const handlePrev = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
  };

  const allAnswered = currentGroup.every((q) => answers[q.id]);

  const calculateResult = (answers) => {
    const traitScores = {};
    Object.values(answers).forEach(({ type, score }) => {
      traitScores[type] = (traitScores[type] || 0) + score;
    });
    const sorted = Object.entries(traitScores).sort((a, b) => b[1] - a[1]);
    const topTypes = sorted.slice(0, 2).map(([type]) => type);
    return {
      traitScores,
      topTypes,
      resultSummary: topTypes.join("-"),
    };
  };

  return (
    <div className="w-full max-w-6xl px-6 sm:px-10">
      <div ref={quizRef} className="bg-white rounded-2xl shadow-2xl p-12 sm:p-20 transition-all duration-300">
        <div className="mb-10">
          <ProgressBar progress={progress} />
        </div>

      <div className="text-center mb-10">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Please rate the following statements
        </h2>
        <p className="text-sm text-gray-500">Your honest answers help us personalize your UniVise journey</p>
      </div>

        <div className="space-y-12">
          {currentGroup.map((question) => {
            const currentAnswer = answers[question.id]?.score || null;
            return (
              <div key={question.id}>
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-700 max-w-4xl mx-auto">
                    {question.question}
                  </h3>
                </div>

              <div className="flex justify-between items-end gap-6 px-2 sm:px-14 mb-10">
                {[1, 2, 3, 4, 5].map((score) => {
                  const isSelected = currentAnswer === score;
                  const label =
                    score === 1
                      ? "Strongly Disagree"
                      : score === 3
                      ? "Neutral"
                      : score === 5
                      ? "Strongly Agree"
                      : null;

                  return (
                    <div key={score} className="flex flex-col items-center space-y-2">
                      {label && (
                        <span className="text-xs sm:text-sm text-gray-400 text-center whitespace-nowrap w-28">
                          {label}
                        </span>
                      )}
                      <button
                        onClick={() => handleScore(question.id, question.type, score)}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-md
                          ${isSelected ? "ring-4 ring-indigo-400" : ""}
                          ${score === 3 ? "bg-gray-200 hover:bg-gray-300" : ""}
                          ${score < 3 ? "bg-red-100 hover:bg-red-200" : ""}
                          ${score > 3 ? "bg-green-100 hover:bg-green-200" : ""}`}
                      >
                        <span className="sr-only">{score}</span>
                      </button>
                    </div>
                  );
                })}   
              </div>

              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrev}
            disabled={currentGroupIndex === 0}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-sm disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
          >
            {currentGroupIndex + 1 === types.length ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuizForm;

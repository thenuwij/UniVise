import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { personalityQuestions } from "../data/PersonalityQuestions.js";
import ProgressBar from "./ProgressBar";

const PersonalityQuizForm = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  const currentQuestion = personalityQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / personalityQuestions.length) * 100;
  const currentAnswer = answers[currentQuestion.id]?.score || null;

  const handleAnswer = (score) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { type: currentQuestion.type, score },
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < personalityQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const result = calculateResult(answers);
      localStorage.setItem("personality_result", JSON.stringify(result));
      navigate("/quiz/result");
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

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
      <div className="bg-white rounded-2xl shadow-2xl p-12 sm:p-20 transition-all duration-300">
        <div className="mb-10">
          <ProgressBar progress={progress} />
        </div>

        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 leading-snug max-w-5xl mx-auto">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="flex items-center justify-between text-gray-500 text-base font-medium mb-8 px-2 sm:px-14">
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>

        <div className="flex justify-between items-center gap-6 px-2 sm:px-14 mb-12">
          {[1, 2, 3, 4, 5].map((score) => {
            const isSelected = currentAnswer === score;
            return (
              <button
                key={score}
                onClick={() => handleAnswer(score)}
                className={`w-16 h-16 sm:w-20 sm:h-20 text-xl font-semibold rounded-full transition-transform duration-200 hover:scale-110 shadow-md
                  ${isSelected ? "ring-4 ring-indigo-400" : ""}
                  ${score === 3 ? "bg-gray-200 hover:bg-gray-300 text-gray-800" : ""}
                  ${score < 3 ? "bg-red-100 hover:bg-red-200 text-red-700" : ""}
                  ${score > 3 ? "bg-green-100 hover:bg-green-200 text-green-700" : ""}`}
              >
                {score}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-sm disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
          >
            {currentQuestionIndex + 1 === personalityQuestions.length ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuizForm;

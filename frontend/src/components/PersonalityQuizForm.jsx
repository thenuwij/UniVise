import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { personalityQuestions } from "../data/PersonalityQuestions.js";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

const SCALE_LABELS = {
  1: "Strongly Disagree",
  3: "Neutral",
  5: "Strongly Agree",
};

const TYPE_LABEL = {
  realistic:     "Realistic",
  investigative: "Investigative",
  artistic:      "Artistic",
  social:        "Social",
  enterprising:  "Enterprising",
  conventional:  "Conventional",
};

const calculateResult = (answers) => {
  const traitScores = {};
  Object.values(answers).forEach(({ type, score }) => {
    traitScores[type] = (traitScores[type] || 0) + score;
  });
  const sorted = Object.entries(traitScores).sort((a, b) => b[1] - a[1]);
  const topTypes = sorted.slice(0, 2).map(([type]) => type);
  return { traitScores, topTypes, resultSummary: topTypes.join("-") };
};

const PersonalityQuizForm = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const total = personalityQuestions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [advancing, setAdvancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const question = personalityQuestions[currentIndex];
  const selectedScore = answers[question.id]?.score ?? null;

  const handleSelect = async (score) => {
    if (advancing || submitting) return;

    const newAnswers = {
      ...answers,
      [question.id]: { type: question.type, score },
    };
    setAnswers(newAnswers);

    if (currentIndex + 1 < total) {
      setAdvancing(true);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAdvancing(false);
      }, 380);
    } else {
      setSubmitting(true);
      const result = calculateResult(newAnswers);
      const { error } = await supabase
        .from("personality_results")
        .upsert(
          [{ user_id: session?.user?.id, trait_scores: result.traitScores, top_types: result.topTypes, result_summary: result.resultSummary }],
          { onConflict: ["user_id"] }
        );
      if (error) {
        console.error("Error saving personality result:", error);
        setSubmitting(false);
      } else {
        navigate("/quiz/result");
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0 && !advancing && !submitting) {
      setCurrentIndex((i) => i - 1);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>Question {currentIndex + 1} of {total}</span>
          <span>{Math.round(((currentIndex + 1) / total) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-4">
          {TYPE_LABEL[question.type]}
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white leading-snug mb-10">
          {question.question}
        </h2>

        {/* Coloured circle scale */}
        <div className="flex justify-between items-end gap-4 px-2 sm:px-10 mb-6">
          {[1, 2, 3, 4, 5].map((score) => {
            const isSelected = selectedScore === score;
            const label = SCALE_LABELS[score];
            return (
              <div key={score} className="flex flex-col items-center gap-2">
                {label && (
                  <span className="text-xs sm:text-sm text-center text-slate-500 dark:text-slate-400 whitespace-nowrap w-24">
                    {label}
                  </span>
                )}
                <button
                  onClick={() => handleSelect(score)}
                  disabled={advancing || submitting}
                  className={`rounded-full shadow-md transition-all duration-150 disabled:cursor-not-allowed
                    ${isSelected ? "ring-4 ring-indigo-500 scale-110" : "hover:scale-105"}
                    ${score === 3 ? "bg-gray-400 hover:bg-gray-300 dark:bg-gray-400 dark:hover:bg-gray-300" : ""}
                    ${score < 3  ? "bg-red-300 hover:bg-red-200 dark:bg-red-400 dark:hover:bg-red-300" : ""}
                    ${score > 3  ? "bg-green-300 hover:bg-green-200 dark:bg-green-400 dark:hover:bg-green-300" : ""}
                    w-14 h-14 sm:w-16 sm:h-16`}
                >
                  <span className="sr-only">{score}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0 || advancing || submitting}
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {submitting && (
          <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            Saving your results…
          </span>
        )}
      </div>
    </div>
  );
};

export default PersonalityQuizForm;

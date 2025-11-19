// src/components/pathway/MyPathwayEntryCard.jsx
import { HiArrowRight } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

export default function MyPathwayEntryCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-primary mb-2">
        MyPathway — Your Saved Uni Journey
      </h2>

      <p className="text-secondary text-sm mb-4">
        Save degrees, courses, societies, internships, and career paths from your Roadmap or Explore pages — then view them all here in one organised place.
      </p>

      <button
        onClick={() => navigate("/mypathway")}
        className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
      >
        Open MyPathway
        <HiArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

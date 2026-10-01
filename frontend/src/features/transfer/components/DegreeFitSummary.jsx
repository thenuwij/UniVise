import { useState } from "react";
import { HiSparkles } from "react-icons/hi";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";
import { supabase } from "@/shared/lib/supabase";
import { card } from "@/features/roadmap/utils/cardStyles";

export default function DegreeFitSummary({ program }) {
  const { session } = UserAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const generate = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data: degree, error } = await supabase
        .from("unsw_degrees_final")
        .select("id")
        .eq("degree_code", program.code)
        .maybeSingle();
      if (error || !degree) throw error || new Error("Degree not found");
      const data = await apiJson("/smart-summary/degree", {
        method: "POST",
        retry: true,
        token: session?.access_token,
        body: { degree_id: degree.id },
      });
      setSummary(data.summary);
    } catch (err) {
      console.error("Fit summary failed:", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${card} mt-8 p-6 md:p-8`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            <HiSparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            How {program.name} fits you
          </h3>
          {!summary && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {failed
                ? "We couldn't generate your summary. The AI service may be busy, please try again in a moment."
                : "An AI summary of how this degree matches your interests and goals."}
            </p>
          )}
        </div>
        {!summary && (
          <button
            onClick={generate}
            disabled={loading}
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:hover:translate-y-0 transition-all"
          >
            <HiSparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "Generating..." : failed ? "Try again" : "Generate"}
          </button>
        )}
      </div>
      {summary && (
        <p className="mt-4 text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{summary}</p>
      )}
    </section>
  );
}

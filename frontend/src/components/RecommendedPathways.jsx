import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { Button } from "flowbite-react";

const RecommendedPathways = ({ onSelect }) => {
  const { session } = UserAuth();
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session) return;
      const { data, error } = await supabase
        .from("final_degree_recommendations")
        .select("degree_name, reason, year_1_courses, year_2_courses, year_3_courses, year_4_courses, specialisations")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recommendations:", error);
      } else {
        setRecommended(data || []);
      }
    };

    fetchRecommendations();
  }, [session]);

  if (!recommended.length) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-3 text-slate-800">
        Select a program pathway from your recommendations:
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {recommended.map((degree, idx) => (
          <div
            key={idx}
            className="bg-white shadow p-4 rounded-xl border border-slate-200"
          >
            <h3 className="text-lg font-semibold text-indigo-600">{degree.degree_name}</h3>
            <p className="text-gray-700 mb-3">{degree.reason}</p>
            <Button
              color="blue"
              onClick={() =>
                onSelect({
                  degreeName: degree.degree_name,
                  courseBreakdown: {
                    "Year 1": degree.year_1_courses,
                    "Year 2": degree.year_2_courses,
                    "Year 3": degree.year_3_courses,
                    "Year 4": degree.year_4_courses,
                  },
                  specialisations: degree.specialisations,
                })
              }
            >
              View Roadmap
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedPathways;

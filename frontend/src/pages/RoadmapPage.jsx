import React, { useEffect, useState } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import ProgramSelector from "../components/ProgramSelector";
import Roadmap from "../components/Roadmap";
import DegreeSearch from "../components/DegreeSearch";
import { Button } from "flowbite-react";

function RoadmapPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedProgramData, setSelectedProgramData] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const { session } = UserAuth();

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    const fetchPrograms = async () => {
      if (!session) return;

      const { data, error } = await supabase
        .from("program_info")
        .select("*")
        .eq("user_id", session.user.id);

      if (!error) setPrograms(data);
      else console.error("Error fetching programs:", error);
    };

const fetchRecommendations = async () => {
  if (!session) return;

  const { data, error } = await supabase
    .from("final_degree_recommendations")
    .select(
      "degree_name, reason, year_1_courses, year_2_courses, year_3_courses, year_4_courses, specialisations"
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (!error && data?.length > 0) {
    const formatted = data.map((deg) => ({
      degreeName: deg.degree_name,
      reason: deg.reason,
      specialisations: deg.specialisations,
      courseBreakdown: {
        "Year 1": deg.year_1_courses,
        "Year 2": deg.year_2_courses,
        "Year 3": deg.year_3_courses,
        "Year 4": deg.year_4_courses,
      },
    }));
    setRecommended(formatted);
  } else {
    console.error("Error fetching recommendations:", error);
  }
};

    fetchPrograms();
    fetchRecommendations();
  }, [session]);

  useEffect(() => {
    const selected = programs.find((p) => p.id === selectedProgramId);
    if (selected) setSelectedProgramData(selected.program_info);
    else setSelectedProgramData(null);
  }, [selectedProgramId, programs]);

  const handleDegreeSelect = async (degree) => {
    if (!session) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/program-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          degree_name: degree.program_name,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        const { data, error } = await supabase
          .from("program_info")
          .insert([
            {
              user_id: session.user.id,
              program_name: degree.program_name,
              program_info: result,
            },
          ])
          .select();

        if (error) throw error;

        setPrograms((prev) => [...prev, ...data]);
        setSelectedProgramId(data[0].id);
      } else {
        console.error("AI error:", result);
      }
    } catch (err) {
      console.error("Error handling degree selection:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendedClick = (degree) => {
    setSelectedProgramData({
      degreeName: degree.degreeName,
      courseBreakdown: degree.courseBreakdown,
      specialisations: degree.specialisations,
    });
  };

  return (
    <div>
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      <div className="mx-6 mt-6 md:ml-72">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-6">
          Explore your pathway
        </h1>

        {loading ? (
          <p className="text-gray-500">Generating roadmap, please wait...</p>
        ) : (
          <>
            {recommended.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-slate-700 mb-4">
                  Select a program pathway from your recommendations:
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {recommended.map((degree, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-xl shadow border border-gray-200"
                    >
                      <h3 className="text-lg font-semibold text-indigo-700">
                        {degree.degreeName}
                      </h3>
                      <p className="text-gray-700 mb-3">{degree.reason}</p>
                      <Button color="blue" onClick={() => handleRecommendedClick(degree)}>
                        View Roadmap
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">
                Or explore a custom pathway:
              </h2>
              <DegreeSearch onSelectDegree={handleDegreeSelect} />
            </div>

            {programs.length > 0 && (
              <>
                <ProgramSelector
                  programs={programs}
                  selectedId={selectedProgramId}
                  onSelect={setSelectedProgramId}
                />
              </>
            )}

            {selectedProgramData && (
              <div className="mt-10">
                <Roadmap programData={selectedProgramData} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RoadmapPage;

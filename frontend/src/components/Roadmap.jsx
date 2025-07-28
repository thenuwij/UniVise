import React, { useEffect, useState } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import Roadmap from "../components/Roadmap";
import DegreeSearch from "../components/DegreeSearch";

function RoadmapPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedProgramData, setSelectedProgramData] = useState(null);
  const [finalRecommendationData, setFinalRecommendationData] = useState(null);
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

      if (error) {
        console.error("Error fetching programs:", error);
      } else {
        setPrograms(data);
      }
    };

    fetchPrograms();
  }, [session]);

  useEffect(() => {
    const selected = programs.find((p) => p.id === selectedProgramId);
    if (selected) setSelectedProgramData(selected.program_info);
    else setSelectedProgramData(null);
  }, [selectedProgramId, programs]);

  useEffect(() => {
    const fetchFinalRecommendations = async () => {
      if (!session || programs.length > 0) return;

      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      try {
        const res = await fetch("http://localhost:8000/final-degree-plan", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();
        setFinalRecommendationData(result);
      } catch (err) {
        console.error("Error fetching final recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinalRecommendations();
  }, [session, programs]);

  const handleDegreeSelect = (degree) => {
    console.log("Degree selected:", degree);
  };

  return (
    <div>
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      <div className="mx-6 mt-6 md:ml-72">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-6">Explore your pathway</h1>

        {loading && <p className="text-gray-500">Loading personalized recommendations...</p>}

        {programs.length > 0 ? (
          <>
            {selectedProgramData && <Roadmap programData={selectedProgramData} />}
          </>
        ) : finalRecommendationData ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-700">
                Based on Eunice’s recommendations, here’s your suggested degree pathway:
              </h2>
            </div>
            <Roadmap programData={finalRecommendationData} />
            <p className="text-gray-600 text-sm mt-6">or search for your own degree below:</p>
            <DegreeSearch onSelectDegree={handleDegreeSelect} />
          </>
        ) : (
          <DegreeSearch onSelectDegree={handleDegreeSelect} />
        )}
      </div>
    </div>
  );
}

export default RoadmapPage;

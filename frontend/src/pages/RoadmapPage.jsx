// Refactored RoadmapPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import DegreeSelectorForRoadmap from "../components/DegreeSelectorForRoadmap";
import { supabase } from "../supabaseClient";

function RoadmapPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState("university");
  const [hasTranscript, setHasTranscript] = useState(false);
  const [finalRecommendations, setFinalRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const [selectedDegreeObject, setSelectedDegreeObject] = useState(null);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    async function fetchInitialData() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;
      if (userError || !user) return;

      const userMetadata = user.user_metadata || {};
      const currentUserType = userMetadata.student_type || "university";
      setUserType(currentUserType);

      const analysisTable = currentUserType === "high_school" ? "school_report_analysis" : "transcript_analysis";
      const { data: analysisData } = await supabase
        .from(analysisTable)
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      setHasTranscript(!!analysisData);

      const recommendationTable = currentUserType === "high_school"
        ? "degree_recommendations"
        : "final_degree_recommendations";

      const { data: recs } = await supabase
        .from(recommendationTable)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setFinalRecommendations(recs || []);
      setLoadingRecommendations(false);
    }
    fetchInitialData();
  }, []);

  // Replace this function in RoadmapPage.jsx
  const handleProceed = async () => {
    if (!selectedDegreeId || !selectedDegreeObject) {
      alert("Please select a degree to proceed.");
      return;
    }

    if (userType === "high_school") {
      if (selectedDegreeObject.source === "unsw_selector") {
        navigate("/roadmap-loading", {
          state: { type: "unsw", degree: selectedDegreeObject },
          replace: true,
        });
        return;
      }

      navigate("/roadmap-loading", {
        state: { type: "school", degree: selectedDegreeObject },
        replace: true,
      });
      return;
    }

    // University users → UNSW flow
    navigate("/roadmap-loading", {
      state: { type: "unsw", degree: selectedDegreeObject },
      replace: true,
    });
  };



  const renderRecommendations = () => (
    <section className="w-full mb-12">
      <h2 className="text-4xl font-bold dark:text-white mt-12 mb-6">Recommended Degrees</h2>
      {loadingRecommendations ? (
        <p className="text-sky-600 italic">Generating recommendations...</p>
      ) : finalRecommendations.length === 0 ? (
        <p className="text-gray-500 italic">No recommendations available.</p>
      ) : (
        <div className={`grid grid-cols-1 ${userType === "high_school" ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"} gap-8`}>
          {finalRecommendations.map(({ id, degree_name, university_name, reason }) => (
            <div
              key={id}
              onClick={() => {
                setSelectedDegreeId(id);
                setSelectedDegreeObject({
                  source: userType === "high_school" ? "hs_recommendation" : "uni_recommendation",
                  id, // <- recommendation_id for HS school flow
                  degree_name,
                  university_name,
                  reason,
                });
              }}
              className={`cursor-pointer rounded-3xl p-6 border shadow-md transition-all duration-300 ${
                selectedDegreeId === id
                  ? userType === "university"
                    ? "bg-sky-100 border-sky-600 shadow-lg scale-[1.02]"
                    : "bg-purple-100 border-purple-600 shadow-lg scale-[1.02]"
                  : "bg-white border-slate-200 hover:shadow-md hover:scale-[1.01]"
              }`}
            >
              <h3 className={`text-lg font-semibold ${userType === "university" ? "text-sky-900" : "text-purple-800"} mb-2`}>
                {degree_name}
              </h3>
              {userType === "high_school" && (
                <p className="text-sm text-gray-500 mb-2 italic">{university_name}</p>
              )}
              <p className="text-sm text-slate-700">{reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderDegreeSelector = () => (
    <section className="w-full mb-12">
      <DegreeSelectorForRoadmap
        selectedId={selectedDegreeId}
        onSelect={(deg) => {
          setSelectedDegreeId(deg.id);
          setSelectedDegreeObject({
            ...deg,
            source: "unsw_selector",
          });
        }}
      />
    </section>
  );

  const renderGenerateButton = () => (
    <button
      onClick={handleProceed}
      disabled={!selectedDegreeId}
      className={`mt-0 ml-4 px-12 py-4 text-white text-xl font-semibold rounded-2xl shadow-lg transition-all duration-300 ${
        selectedDegreeId
          ? "bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          : "bg-gradient-to-br from-purple-300 to-blue-300 cursor-not-allowed"
      }`}
    >
      Generate Roadmap Using Selection
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="max-w-7xl mx-auto pt-16 pb-8 px-6 text-center">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          My Roadmap
        </h1>
        <p className="mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
          {userType === "high_school"
            ? "Based on your personality and career interests, UniVise recommends degrees that align with your goals. Select a degree to begin your journey."
            : "Upload your transcript on profile page or select a degree below to generate the roadmap."}
        </p>
      </div>

      <div className="flex flex-col items-center px-6 max-w-7xl mx-auto w-full text-center">
        {userType === "university" && (
          <div className="flex flex-col sm:flex-row items-center justify-center mb-10 gap-4">
            <button
              onClick={() => hasTranscript && navigate("/roadmap/transcript")}
              disabled={!hasTranscript}
              className={`px-12 py-4 text-white text-xl font-semibold rounded-2xl shadow-lg transition-all duration-300 ${
                hasTranscript
                  ? "bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                  : "bg-gradient-to-br from-purple-300 to-blue-300 cursor-not-allowed"
              }`}
            >
              Generate Roadmap Using Transcript
            </button>
            {renderGenerateButton()}
          </div>
        )}

        {userType === "high_school" && (
          <div className="mb-10">
            {renderGenerateButton()}
          </div>
        )}

        {renderRecommendations()}
        {renderDegreeSelector()}
      </div>
    </div>
  );
}

export default RoadmapPage;

// Refactored RoadmapPage.jsx
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { useRoadmapData } from "../hooks/useRoadmapData";
import RecommendedDegrees from "../components/roadmap/RecommendedDegrees";
import DegreeSelectorSection from "../components/roadmap/DegreeSelectorSection";
import GenerateButton from "../components/roadmap/GenerateButton";

function RoadmapPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const [selectedDegreeObject, setSelectedDegreeObject] = useState(null);
  const { 
    userType, 
    recommendations, 
    loading: isLoadingRecommendations, 
    error: recommendationsError 
  } = useRoadmapData();
  const isHighSchool = useMemo(() => userType === "high_school", [userType]);
  const isUniversity = useMemo(() => userType === "university", [userType]);
  const openDrawer = useCallback(() => setIsMenuOpen(true), []);
  const closeDrawer = useCallback(() => setIsMenuOpen(false), []);

  /**
   * Handles roadmap generation based on user type and degree selection
   */
  const handleProceed = () => {
    if (!selectedDegreeId || !selectedDegreeObject) {
      alert("Please select a degree to proceed.");
      return;
    }

    const type = isHighSchool
      ? selectedDegreeObject.source === "unsw_selector"
        ? "unsw"
        : "school"
      : "unsw";

    console.log(" handleProceed triggered");
    console.log("   selectedDegreeId:", selectedDegreeId);
    console.log("   selectedDegreeObject:", selectedDegreeObject);


    navigate("/roadmap-loading", {
      state: { type, degree: selectedDegreeObject },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-slate-900">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isMenuOpen} handleClose={closeDrawer} />


      <div className="max-w-7xl mx-auto pt-16 pb-8 px-6 text-center">
        <h1 className="heading-xl mb-4 text-primary">
          My Roadmap
        </h1>
        <p className="mb-6 text-lg font-normal text-secondary lg:text-xl sm:px-16 xl:px-48">
          {userType === "high_school"
            ? "Based on your personality and career interests, UniVise recommends degrees that align with your goals. Select a degree to begin your journey."
            : "Select a degree below to generate the roadmap."}
        </p>
        {recommendationsError && (
          <div className="mb-6 text-red-600">
             Failed to load recommendations. Please try again later.
          </div>
        )}
      </div>

      <div className="flex flex-col items-center px-6 max-w-7xl mx-auto w-full text-center">
        {isUniversity && (
          <div className="flex flex-col items-center justify-center mb-10 gap-4">
            <GenerateButton
              onClick={handleProceed}
              disabled={!selectedDegreeId}
            >
              Generate Roadmap Using Selection
            </GenerateButton>
          </div>
        )}


        {isHighSchool && (
          <div className="mb-10">
            <GenerateButton
              onClick={handleProceed}
              disabled={!selectedDegreeId}
            >
              Generate Roadmap Using Selection
            </GenerateButton>
          </div>
        )}

        {Array.isArray(recommendations) &&
          recommendations.length === 0 &&
          !isLoadingRecommendations && (
            <p className="text-gray-500">No recommendations available right now.</p>
        )}

        <RecommendedDegrees
          userType={userType}
          recommendations={recommendations}
          loading={isLoadingRecommendations}
          selectedDegreeId={selectedDegreeId}
          setSelectedDegreeId={setSelectedDegreeId}
          setSelectedDegreeObject={setSelectedDegreeObject}
        />
        <DegreeSelectorSection
          selectedDegreeId={selectedDegreeId}
          setSelectedDegreeId={setSelectedDegreeId}
          setSelectedDegreeObject={setSelectedDegreeObject}
        />
      </div>
    </div>
  );
}

export default RoadmapPage;

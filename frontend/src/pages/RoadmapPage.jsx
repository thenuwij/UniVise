import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { useRoadmapData } from "../hooks/useRoadmapData";
import RecommendedDegrees from "../components/roadmap/RecommendedDegrees";
import DegreeSelectorSection from "../components/roadmap/DegreeSelectorSection";
import GenerateButton from "../components/roadmap/GenerateButton";
import {
  HiChartBar,
  HiUsers,
  HiBriefcase,
  HiArrowRight,
  HiStar,
  HiSearch,
} from "react-icons/hi";

function RoadmapPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const [selectedDegreeObject, setSelectedDegreeObject] = useState(null);
  const {
    userType,
    recommendations,
    loading: isLoadingRecommendations,
    error: recommendationsError,
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

    navigate("/roadmap-loading", {
      state: { type, degree: selectedDegreeObject },
      replace: true,
    });
  };

  return (
    <div>
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isMenuOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">
          {/* Header */}
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              My Roadmap
            </div>

            <h1 className="mt-3 text-2xl sm:text-4xl lg:text-4xl font-extrabold">
              Generate Your{" "}
              <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                Academic Pathway
              </span>
            </h1>

            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {userType === "high_school"
                ? "Based on your personality and career interests, select a degree below to create your personalized roadmap from entry to career."
                : "Select a degree below to generate your complete academic pathway with personalized requirements, opportunities, and career insights."}
            </p>
          </div>

          {/* Error Message */}
          {recommendationsError && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                Failed to load recommendations. Please try again later.
              </p>
            </div>
          )}

          {/* Main Info Card */}
          <div className="card-glass-spotlight mt-6 p-8">
            <p className="text-2xl font-semibold mb-4">
              What Your Roadmap Includes
            </p>

            <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-5xl">
              UniVise creates a comprehensive end-to-end roadmap covering entry
              requirements, program structure, student communities, industry
              connections, and career progression — all tailored to your chosen
              degree.
            </p>

            {/* Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <HiChartBar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Entry & Program Structure
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    ATAR requirements, prerequisites, and degree breakdown.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <HiUsers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Communities & Networks
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Societies and clubs connected to your program.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <HiBriefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Industry & Careers
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Internships, placements, and career pathways.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-5 border border-blue-200 dark:border-blue-800 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  i
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    How to Generate Your Roadmap
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Choose from your personalized recommendations or search all UNSW degrees below. 
                    Once selected, click generate to create your full roadmap.
                  </p>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <GenerateButton
                onClick={handleProceed}
                disabled={!selectedDegreeId}
              >
                <span className="flex items-center gap-2">
                  {selectedDegreeId ? (
                    <>
                      Generate My Roadmap
                      <HiArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    "Select a Degree to Continue"
                  )}
                </span>
              </GenerateButton>
            </div>
          </div>

          {/* Two Column Layout - Recommendations & Search */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
            
            {/* Left Column - Recommended Degrees */}
            <div className="card-glass-spotlight p-6">
              <div className="flex items-center gap-2 mb-4">
                <HiStar className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-semibold">Your Recommendations</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {userType === "high_school" 
                  ? "Based on your personality and career interests"
                  : "Degrees that may interest you"}
              </p>
              <RecommendedDegrees
                userType={userType}
                recommendations={recommendations}
                loading={isLoadingRecommendations}
                selectedDegreeId={selectedDegreeId}
                setSelectedDegreeId={setSelectedDegreeId}
                setSelectedDegreeObject={setSelectedDegreeObject}
              />
            </div>

            {/* Right Column - Search All Degrees */}
            <div className="card-glass-spotlight p-6">
              <div className="flex items-center gap-2 mb-4">
                <HiSearch className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Search All Degrees</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Explore the complete catalog of UNSW programs
              </p>
              <DegreeSelectorSection
                selectedDegreeId={selectedDegreeId}
                setSelectedDegreeId={setSelectedDegreeId}
                setSelectedDegreeObject={setSelectedDegreeObject}
              />
            </div>

          </div>

          <div className="pb-16" />
        </div>
      </div>
    </div>
  );
}

export default RoadmapPage;
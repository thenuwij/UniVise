// src/pages/RoadmapPage.jsx
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
  HiCheckCircle,
} from "react-icons/hi";

function RoadmapPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const [selectedDegreeObject, setSelectedDegreeObject] = useState(null);

  const { userType, recommendations, loading: isLoadingRecommendations, error: recommendationsError } = useRoadmapData();

  const isHighSchool = useMemo(() => userType === "high_school", [userType]);

  const openDrawer = useCallback(() => setIsMenuOpen(true), []);
  const closeDrawer = useCallback(() => setIsMenuOpen(false), []);

  const handleProceed = () => {
    if (!selectedDegreeId || !selectedDegreeObject) {
      alert("Please select a degree to proceed.");
      return;
    }

    const type =
      userType === "high_school"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">

      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isMenuOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col h-full px-10 xl:px-20">

          {/* Header */}
          <div className="mt-8 mb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                  My Roadmap
                </div>

                <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  Generate Your{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                    Academic Pathway
                  </span>
                </h1>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {isHighSchool
                    ? "Based on your personality and career interests, select a degree below to create your personalized roadmap."
                    : "Select a degree below to generate your complete academic pathway with personalized requirements and insights."}
                </p>
              </div>

              {/* Generate Button - Top Right, aligned with description */}
              <div className="flex-shrink-0 self-end">
                <GenerateButton onClick={handleProceed} disabled={!selectedDegreeId}>
                  <span className="flex items-center gap-2">
                    {selectedDegreeId ? (
                      <>
                        Generate Roadmap
                        <HiArrowRight className="w-5 h-5" />
                      </>
                    ) : (
                      "Select a Degree Below to Continue"
                    )}
                  </span>
                </GenerateButton>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {recommendationsError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                Failed to load recommendations. Try again later.
              </p>
            </div>
          )}

          {/* Main Info Card - Professional Design */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-8 mb-8">

            {/* Title */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <HiChartBar className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                What Your Roadmap Includes
              </h2>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              UniVise generates your comprehensive academic roadmap including entry requirements, course structure, student communities, industry opportunities, and career pathways — all customized to your selected degree.
            </p>

            {/* Highlights - Minimal, Professional */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <HiCheckCircle className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Entry & Structure</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">ATAR requirements, prerequisites, and complete degree breakdown</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <HiCheckCircle className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Student Communities</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Relevant societies and student networks</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <HiCheckCircle className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Industry & Careers</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Internships and career pathways</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">

            {/* Left - Recommendations */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md p-6">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                <HiStar className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Recommendations</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                {isHighSchool
                  ? "Based on your personality and interests"
                  : "Suggested degrees for you"}
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

            {/* Right - Search */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md p-6">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                <HiSearch className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Search All Degrees</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Explore all UNSW degrees
              </p>
              <DegreeSelectorSection
                selectedDegreeId={selectedDegreeId}
                setSelectedDegreeId={setSelectedDegreeId}
                setSelectedDegreeObject={setSelectedDegreeObject}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default RoadmapPage;
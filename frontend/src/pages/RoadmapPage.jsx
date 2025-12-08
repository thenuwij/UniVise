// src/pages/RoadmapPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiArrowRight,
  HiSearch,
  HiStar,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import DegreeSelectorSection from "../components/roadmap/DegreeSelectorSection";
import GenerateButton from "../components/roadmap/GenerateButton";
import RecommendedDegrees from "../components/roadmap/RecommendedDegrees";
import { useRoadmapData } from "../hooks/useRoadmapData";

function RoadmapPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const [selectedDegreeObject, setSelectedDegreeObject] = useState(null);

  const { userType, recommendations, loading: isLoadingRecommendations, error: recommendationsError } = useRoadmapData();

  const isHighSchool = useMemo(() => userType === "high_school", [userType]);

  const openDrawer = useCallback(() => setIsMenuOpen(true), []);
  const closeDrawer = useCallback(() => setIsMenuOpen(false), []);

  // Scroll to top when a degree is selected
  useEffect(() => {
    if (selectedDegreeId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedDegreeId]);

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
        <div className="flex flex-col h-full mx-20">

          {/* Header - Original Layout with Tag and Button on Right */}
          <div className="mt-8 mb-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm mb-4">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                  My Roadmap
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                  Generate Your{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                    Roadmap
                  </span>
                </h1>

                <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Select a program from your recommendations or search for a program
                </p>
              </div>

              {/* Generate Button - Right Side with Glow + Arrow + Hover Scale */}
              <div className="flex-shrink-0 self-end">
                <div className="relative inline-block transform transition-transform duration-300 ease-out hover:scale-105 active:scale-95">
                  {/* Subtle glow effect background - only when selected */}
                  {selectedDegreeId && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600 rounded-2xl blur-md opacity-30 animate-pulse-slow pointer-events-none" />
                  )}
                  
                  <GenerateButton 
                    onClick={handleProceed} 
                    disabled={!selectedDegreeId}
                  >
                    <span className="flex items-center gap-3">
                      Generate Roadmap
                      <HiArrowRight className={`w-6 h-6 transition-transform ${selectedDegreeId ? 'animate-slide-right' : ''}`} />
                    </span>
                  </GenerateButton>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {recommendationsError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium text-center">
                Failed to load recommendations. Try again later.
              </p>
            </div>
          )}

          {/* Selection Grid - Clean Design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">

            {/* Recommendations Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md overflow-hidden transition-all">
              <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                    <HiStar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Your Recommendations
                  </h2>
                </div>
                <p className="text-base text-slate-500 dark:text-slate-400 ml-14">
                  Click on a degree to select it
                </p>
              </div>
              <div className="p-6">
                <RecommendedDegrees
                  userType={userType}
                  recommendations={recommendations}
                  loading={isLoadingRecommendations}
                  selectedDegreeId={selectedDegreeId}
                  setSelectedDegreeId={setSelectedDegreeId}
                  setSelectedDegreeObject={setSelectedDegreeObject}
                />
              </div>
            </div>

            {/* Search Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md overflow-hidden transition-all">
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/40">
                    <HiSearch className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Search All UNSW Programs
                  </h2>
                </div>
                <p className="text-base text-slate-500 dark:text-slate-400 ml-14">
                  Find and select any UNSW degree program
                </p>
              </div>
              <div className="p-6">
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
    </div>
  );
}

export default RoadmapPage;
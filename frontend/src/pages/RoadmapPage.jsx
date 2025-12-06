// src/pages/RoadmapPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiArrowRight,
  HiChartBar,
  HiCheckCircle,
  HiSearch,
  HiStar,
  HiInformationCircle
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
  const [showArrow, setShowArrow] = useState(false);

  const { userType, recommendations, loading: isLoadingRecommendations, error: recommendationsError } = useRoadmapData();

  const isHighSchool = useMemo(() => userType === "high_school", [userType]);

  const openDrawer = useCallback(() => setIsMenuOpen(true), []);
  const closeDrawer = useCallback(() => setIsMenuOpen(false), []);

  // Scroll to top and show arrow when a degree is selected
  useEffect(() => {
    if (selectedDegreeId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Show arrow indicator
      setShowArrow(true);
      
      // Hide arrow after 8 seconds
      const timer = setTimeout(() => {
        setShowArrow(false);
      }, 8000);
      
      return () => clearTimeout(timer);
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
        <div className="flex flex-col h-full px-10 xl:px-20">

          {/* Header - COMPACT */}
          <div className="mt-6 mb-4">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                  My Roadmap
                </div>

                <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  Generate Your{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                    Roadmap
                  </span>
                </h1>
              </div>

              {/* Generate Button with Arrow Indicator */}
              <div className="flex-shrink-0 self-end relative">
                {showArrow && selectedDegreeId && (
                  <div className="absolute -left-32 top-1/2 -translate-y-1/2 flex items-center gap-2 animate-pulse">
                    <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500 dark:border-blue-400 rounded-lg shadow-lg animate-[wiggle_1s_ease-in-out_infinite]">
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                        Click here
                      </span>
                    </div>
                    <HiArrowRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <GenerateButton onClick={handleProceed} disabled={!selectedDegreeId}>
                  <span className="flex items-center gap-2">
                    {selectedDegreeId ? (
                      <>
                        Generate Roadmap
                        <HiArrowRight className="w-5 h-5" />
                      </>
                    ) : (
                      "Select a Degree Below"
                    )}
                  </span>
                </GenerateButton>
              </div>

              <style>{`
                @keyframes wiggle {
                  0%, 100% { transform: translateX(0px); }
                  25% { transform: translateX(-4px); }
                  75% { transform: translateX(4px); }
                }
              `}</style>
            </div>
          </div>

          {/* Error Message */}
          {recommendationsError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                Failed to load recommendations. Try again later.
              </p>
            </div>
          )}

          {/* COMPACT Info Card with Integrated Quick Start */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden mb-5">

            {/* Quick Start Banner - INTEGRATED */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 px-6 py-3">
              <div className="flex items-center gap-3">
                <HiInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm text-slate-900 dark:text-white font-semibold">
                  <span className="font-bold">1.</span> Select a degree from your recommendations or search for available UNSW degrees
                  <span className="mx-2">•</span>
                  <span className="font-bold">2.</span> Click "Generate Roadmap"
                </p>
              </div>
            </div>

            {/* Title Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700">
                  <HiChartBar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  What Your Roadmap Includes
                </h2>
              </div>
            </div>

            {/* Content - COMPACT */}
            <div className="px-6 py-4">
              {/* Feature Boxes - SMALLER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Entry & Structure</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Requirements & breakdown</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Student Communities</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Societies & networks</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Industry & Careers</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Internships & pathways</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Selection Grid - CLOSER TO TOP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">

            {/* Left - Recommendations */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-all">
              {/* HEADER */}
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-5 border-b-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700">
                    <HiStar className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Recommendations</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Click on a degree card to select it
                    </p>
                  </div>
                </div>
              </div>
              {/* CONTENT */}
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

            {/* Right - Search */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-all">
              {/* HEADER */}
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-5 border-b-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700">
                    <HiSearch className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Search All UNSW Degrees</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Search and click on a degree to select it
                    </p>
                  </div>
                </div>
              </div>
              {/* CONTENT */}
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
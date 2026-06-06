// src/pages/RoadmapPage.jsx
import { useCallback, useEffect, useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const { userType, recommendations, loading: isLoadingRecommendations, error: recommendationsError } = useRoadmapData();

  const openDrawer = useCallback(() => setIsMenuOpen(true), []);
  const closeDrawer = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (selectedDegreeId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedDegreeId]);

  const handleProceed = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">

      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isMenuOpen} />
        <MenuBar isOpen={isMenuOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col h-full mx-6 sm:mx-12 lg:mx-20">

          {/* Header - Original Layout with Tag and Button on Right */}
          <div className="mt-8 mb-8">
            <div className="flex items-end justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                  Generate Your{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                    Roadmap
                  </span>
                </h1>

              </div>

              <div className="flex-shrink-0">
                <div className="relative">
                  {selectedDegreeId && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600 rounded-2xl blur-md opacity-30 animate-pulse pointer-events-none" />
                  )}
                  <GenerateButton onClick={handleProceed} disabled={!selectedDegreeId}>
                    <span className="flex items-center gap-3">
                      {selectedDegreeId ? "Generate Roadmap" : "Select a degree first"}
                      <HiArrowRight className="w-5 h-5" />
                    </span>
                  </GenerateButton>
                </div>
              </div>
            </div>
          </div>

          {/* Selected degree confirmation banner */}
          {selectedDegreeId && selectedDegreeObject && (
            <div className="mb-6 flex items-center justify-between gap-4 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white">
                  <HiStar className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">Selected degree</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedDegreeObject.program_name || selectedDegreeObject.title || selectedDegreeObject.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedDegreeId(null); setSelectedDegreeObject(null); setSearchQuery(""); }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Error Message */}
          {recommendationsError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium text-center">
                Failed to load recommendations. Try again later.
              </p>
            </div>
          )}

          <div className="mb-20">

            {/* Full-width search bar */}
            <div className="relative mb-6">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <HiSearch className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Start typing to search all UNSW programs..."
                className="w-full pl-16 pr-4 py-4 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Recommendations — hidden when searching */}
            {!searchQuery && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-lg backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 px-8 py-5 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                      <HiStar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your Recommendations</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Click a degree to select it</p>
                    </div>
                  </div>
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
            )}

            {/* Search results — shown when searching */}
            {searchQuery && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-lg backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 px-8 py-5 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/40">
                      <HiSearch className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Search Results</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Click a degree to select it</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <DegreeSelectorSection
                    selectedDegreeId={selectedDegreeId}
                    setSelectedDegreeId={setSelectedDegreeId}
                    setSelectedDegreeObject={setSelectedDegreeObject}
                    initialQuery={searchQuery}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

export default RoadmapPage;
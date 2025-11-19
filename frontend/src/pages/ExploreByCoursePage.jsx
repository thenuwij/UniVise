import React, { useState } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import CourseSearch from "../components/CourseSearch";
import { HiClipboard, HiArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";


function ExploreByCoursePage() {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        
        {/* PAGE CONTAINER */}
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">

          {/* Back Button */}
          <button
            onClick={() => navigate("/planner")}
            className="group flex items-center gap-2 mb-8 mt-8 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to My Planner</span>
          </button>

          {/* HEADER */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              Explore Courses
            </div>
          </div>

          {/* SEARCH SECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-8 mb-16">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                <HiClipboard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Search Courses
              </h2>
            </div>

            {/* Search Component */}
            <CourseSearch />
          </div>

        </div>
      </div>
    </div>
  );
}

export default ExploreByCoursePage;
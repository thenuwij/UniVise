import { useState } from "react";
import { HiArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import CourseSearch from "../components/CourseSearch";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

function ExploreByCoursePage() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">

      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
        <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">

          <button
            onClick={() => navigate("/planner")}
            className="group inline-flex items-center gap-2 mt-8 mb-6 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 shadow-sm transition-all"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to My Planner
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-8 mb-16">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              Search Courses
            </h2>
            <CourseSearch />
          </div>

        </div>
      </div>
    </div>
  );
}

export default ExploreByCoursePage;

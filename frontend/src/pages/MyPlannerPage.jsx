// src/pages/MyPlannerPage.jsx
import { useState } from "react";
import {
  HiArrowRight,
  HiBookmark,
  HiCheckCircle,
  HiClipboard,
  HiCollection,
  HiUsers,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

function MyPlannerPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
    
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">

        <div className="flex flex-col justify-center h-full px-10 xl:px-20">

          {/* HEADER */}
          <div className="mt-8 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              My Planner
            </div>

            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                Plan
              </span>{" "}
              Your Academic Journey
            </h1>
            
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Explore degrees, majors, and courses to build your personalised study plan.
              Compare paths and see how different choices shape your academic journey at UNSW.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* TRACK PROGRESS BOX */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-6">
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                  <HiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Track Your Progress
                </h2>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed">
                Monitor your course completion, calculate your WAM, and see how far you've progressed in your degree.
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Track completed courses</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Calculate your WAM</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Compare programs when switching</span>
                </li>
              </ul>

              <button
                onClick={() => navigate("/progress")}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <HiCheckCircle className="w-5 h-5" />
                <span>Track Progress</span>
                <HiArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* MY SAVED ITEMS BOX  */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-6">
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30">
                  <HiBookmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Your Saved Items
                </h2>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed">
                View all saved programs, specialisations, courses, communities, and career paths.
              </p>

              {/* Features List */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>Programs & Specialisations</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>Courses & Communities</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>Industry & Career Paths</span>
                </li>
              </ul>

              <button
                onClick={() => navigate("/mypathway")}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <HiBookmark className="w-5 h-5" />
                <span>View Saved Items</span>
                <HiArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Explore Options Section */}
          <div className="mt-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Explore Academic Options
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Browse degrees, specialisations, and courses to discover what fits your goals
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            
            {/* Explore Degrees */}
            <div
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg p-6 group transition-all duration-200 cursor-pointer"
              onClick={() => navigate("/explore-by-degree")}
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <HiCollection className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Degrees
                </h3>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Browse UNSW degree programs, view structures and entry requirements
              </p>
              
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors">
                <span>Explore Degrees</span>
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Explore Specialisations */}
            <div
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg p-6 group transition-all duration-200 cursor-pointer"
              onClick={() => navigate("/explore-by-specialisation")}
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <HiUsers className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Specialisations
                </h3>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Review majors, minors and honours pathways
              </p>
              
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 transition-colors">
                <span>Explore Specialisations</span>
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Explore Courses */}
            <div
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg p-6 group transition-all duration-200 cursor-pointer"
              onClick={() => navigate("/explore-by-course")}
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <HiClipboard className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Courses
                </h3>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Search courses, check prerequisites and see how they fit your plan
              </p>
              
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 transition-colors">
                <span>Explore Courses</span>
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MyPlannerPage;
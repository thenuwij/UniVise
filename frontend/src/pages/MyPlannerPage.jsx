// src/pages/MyPlannerPage.jsx
import { useState } from "react";
import {
  HiArrowRight,
  HiBookmark,
  HiSwitchHorizontal,
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
        <div className="flex flex-col justify-center h-full mx-20">
          {/* HEADER - WITH MY PLANNER TAG */}
          <div className="mt-12 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm mb-4">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              My Planner
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                Plan
              </span>{" "}
              Your Journey
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Track your progress, view saved items, or explore degree options at UNSW
            </p>
          </div>

          {/* TOP TWO CARDS - IMPROVED MINIMAL DESIGN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {/* PROGRAM TRANSFER ANALYSIS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg p-8 transition-all duration-200 group">
              <div className="flex items-center gap-4 mb-7">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 shadow-md group-hover:shadow-lg transition-all">
                  <HiSwitchHorizontal className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Program Transfer Analysis
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                    Compare programs and see what transfers
                  </p>
                </div>
              </div>

              <ul className="space-y-3.5 mb-8">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>Select a target program to compare</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>See transferable vs non-transferable courses</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>Get remaining requirements and prereq checks</span>
                </li>
              </ul>

              <button
                onClick={() => navigate("/progress")}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Run Transfer Analysis</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* SAVED ITEMS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg p-8 transition-all duration-200 group">
              <div className="flex items-center gap-4 mb-7">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md group-hover:shadow-lg transition-all">
                  <HiBookmark className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Your Saved Items
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                    Access all your bookmarked content
                  </p>
                </div>
              </div>

              <ul className="space-y-3.5 mb-8">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>Programs & Specialisations</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>Courses & Communities</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>Industry & Career Paths</span>
                </li>
              </ul>

              <button
                onClick={() => navigate("/mypathway")}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>View Saved Items</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* SECTION HEADER */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Explore Academic Options
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Browse degrees, specialisations, and courses
            </p>
          </div>

          {/* EXPLORE CARDS - SUBTLE IMPROVEMENTS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-20">
            {/* Explore Degrees */}
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg p-7 group transition-all duration-200 cursor-pointer"
              onClick={() => navigate("/explore-by-degree")}
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <HiCollection className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Degrees</h3>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Browse UNSW degree programs, view structures and entry requirements
              </p>

              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                <span>Explore</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Explore Specialisations */}
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg p-7 group transition-all duration-200 cursor-pointer"
              onClick={() => navigate("/explore-by-specialisation")}
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <HiUsers className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Specialisations</h3>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Review majors, minors and honours pathways
              </p>

              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                <span>Explore</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Explore Courses */}
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg p-7 group transition-all duration-200 cursor-pointer"
              onClick={() => navigate("/explore-by-course")}
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <HiClipboard className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Courses</h3>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Search courses, check prerequisites and see how they fit your plan
              </p>

              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                <span>Explore</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPlannerPage;

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
        <div className="flex flex-col justify-center h-full mx-20">

          {/* HEADER - WITH MY PLANNER TAG */}
          <div className="mt-12 mb-10">
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

          {/* TOP TWO CARDS - CLEANER APPLE STYLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            
            {/* TRACK PROGRESS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md p-8 transition-all duration-200 group">
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-900/20">
                  <HiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Track Your Progress
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Monitor completion and calculate WAM
                  </p>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>Track completed courses</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>Calculate your WAM</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>Compare programs when switching</span>
                </li>
              </ul>

              <button
                onClick={() => navigate("/progress")}
                className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                <span>Track Progress</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* SAVED ITEMS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md p-8 transition-all duration-200 group">
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                  <HiBookmark className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Your Saved Items
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Access all your bookmarked content
                  </p>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Programs & Specialisations</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Courses & Communities</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Industry & Career Paths</span>
                </li>
              </ul>

              <button
                onClick={() => navigate("/mypathway")}
                className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                <span>View Saved Items</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* SECTION HEADER */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Explore Academic Options
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Browse degrees, specialisations, and courses
            </p>
          </div>

          {/* EXPLORE CARDS - APPLE CLEAN STYLE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            
            {/* Explore Degrees */}
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md p-6 group transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate("/explore-by-degree")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <HiCollection className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Degrees
                </h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Browse UNSW degree programs, view structures and entry requirements
              </p>
              
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                <span>Explore</span>
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Explore Specialisations */}
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md p-6 group transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate("/explore-by-specialisation")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <HiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Specialisations
                </h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Review majors, minors and honours pathways
              </p>
              
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                <span>Explore</span>
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Explore Courses */}
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md p-6 group transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate("/explore-by-course")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <HiClipboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Courses
                </h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Search courses, check prerequisites and see how they fit your plan
              </p>
              
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                <span>Explore</span>
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
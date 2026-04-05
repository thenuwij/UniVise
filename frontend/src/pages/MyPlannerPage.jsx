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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full mx-20">
          {/* HEADER */}
          <div className="mt-6 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm mb-4">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              My Planner
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                Plan
              </span>{" "}
              Your Journey
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Analyse program transfers, view your saved items, or explore the UNSW handbook
            </p>
          </div>

          {/* Two main actions */}
          <div className="flex flex-col gap-3 mb-10">

            {/* View Saved - Full width button */}
            <button
              onClick={() => navigate("/mypathway")}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <HiBookmark className="w-5 h-5" />
              <span className="font-semibold">View Saved Items</span>
            </button>

            {/* Program Transfer Analysis */}
            <div
              onClick={() => navigate("/progress")}
              className="w-full flex items-center justify-between gap-6 px-10 py-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 flex-shrink-0 shadow-sm">
                  <HiSwitchHorizontal className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Thinking of switching degrees?</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    See exactly what carries over — and what doesn't — before you decide.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-base font-bold text-blue-600 dark:text-blue-400 hidden md:block">Run Analysis</span>
                <HiArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>

          {/* UNSW Handbook */}
          <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-4">Explore UNSW Handbook</p>

          <div className="grid grid-cols-3 gap-4 mb-20">
            <div
              onClick={() => navigate("/explore-by-degree")}
              className="flex flex-col gap-5 px-8 py-10 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <HiCollection className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Degrees</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Browse all UNSW degree programs, structures and entry requirements</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate("/explore-by-specialisation")}
              className="flex flex-col gap-5 px-8 py-10 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <HiUsers className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Specialisations</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Explore majors, minors and honours pathways available at UNSW</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate("/explore-by-course")}
              className="flex flex-col gap-5 px-8 py-10 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <HiClipboard className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Courses</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Search individual courses, check prerequisites and see how they fit your plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPlannerPage;

// src/pages/MyPlannerSchoolPage.jsx
import { useState } from "react";
import {
  HiArrowRight,
  HiBookmark,
  HiChevronRight,
  HiClipboard,
  HiCollection,
  HiUsers,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

function MyPlannerSchoolPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
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

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                Plan
              </span>{" "}
              Your Academic Journey
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Explore degrees, specialisations and courses, or view your saved items
            </p>
          </div>

          {/* Saved Items card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md mb-12 overflow-hidden">
            <div
              onClick={() => navigate("/saved")}
              className="p-8 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors duration-200 cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 inline-flex">
                <HiBookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>

              <p className="text-lg font-bold text-slate-900 dark:text-white mt-4">Your Saved Items</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Access all your bookmarked degrees, courses and careers</p>

              <ul className="mt-5 space-y-2.5">
                {[
                  "Programs & Specialisations",
                  "Courses & Communities",
                  "Industry & Career Paths",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              <button className="mt-6 w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-base font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                View Saved Items
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SECTION HEADER */}
          <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-4">Explore UNSW Handbook</p>

          <div className="grid grid-cols-3 gap-4 mb-20">
            <div
              onClick={() => navigate("/explore-by-degree")}
              className="relative flex flex-col gap-5 px-8 py-10 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-[0.98] cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 group"
            >
              <HiChevronRight className="absolute top-4 right-4 w-4 h-4 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-200" />
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <HiCollection className="w-6 h-6 text-blue-500 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Degrees</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Browse all UNSW degree programs, structures and entry requirements</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate("/explore-by-specialisation")}
              className="relative flex flex-col gap-5 px-8 py-10 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-[0.98] cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 group"
            >
              <HiChevronRight className="absolute top-4 right-4 w-4 h-4 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-200" />
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <HiUsers className="w-6 h-6 text-blue-500 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Specialisations</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Explore majors, minors and honours pathways available at UNSW</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate("/explore-by-course")}
              className="relative flex flex-col gap-5 px-8 py-10 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-[0.98] cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 group"
            >
              <HiChevronRight className="absolute top-4 right-4 w-4 h-4 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-200" />
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <HiClipboard className="w-6 h-6 text-blue-500 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Courses</p>
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

export default MyPlannerSchoolPage;

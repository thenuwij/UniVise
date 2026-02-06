// src/pages/MyPlannerSchoolPage.jsx
import { useState } from "react";
import {
  HiAcademicCap,
  HiArrowRight,
  HiBookmark,
  HiCheckCircle,
  HiClipboard,
  HiCollection,
  HiUserGroup,
  HiUsers
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        
        {/* PAGE CONTAINER */}
        <div className="flex flex-col justify-center h-full px-4 sm:px-6">

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
               Explore degrees, majors, and courses and view your saved items
            </p>
          </div>

          {/* MY SAVED ITEMS - FULL WIDTH */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-6 mb-8">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30">
                <HiBookmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Your Saved Items
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Build your personalized academic pathway
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              Save items to your planner as you explore UniVise. Access all your saved academic options in one place to compare and plan your university journey.
            </p>

            {/* What You Can Save - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Academic Options */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <HiAcademicCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Academic Options
                  </h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Programs & Specialisations:</span>
                      <span className="text-slate-600 dark:text-slate-400"> Browse the Explore sections below</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Courses:</span>
                      <span className="text-slate-600 dark:text-slate-400"> Explore courses and save the ones that interest you</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* From Roadmaps */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <HiUserGroup className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    From Your Roadmaps
                  </h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <HiCheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Communities:</span>
                      <span className="text-slate-600 dark:text-slate-400"> Save societies from your UNSW Roadmap</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <HiCheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Industries & Careers:</span>
                      <span className="text-slate-600 dark:text-slate-400"> Save from any roadmap you generate</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* How to Save */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 mt-0.5">
                  <HiBookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    How to Save Items
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Look for the <span className="font-medium">"Save to Planner"</span> button on any program, specialisation, course, community, or career card. Click it to add the item to your saved collection.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => navigate("/mypathway")}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <HiBookmark className="w-5 h-5" />
              <span>View Saved Items</span>
              <HiArrowRight className="w-5 h-5" />
            </button>
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

export default MyPlannerSchoolPage;
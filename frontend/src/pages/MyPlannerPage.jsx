// src/pages/MyPlannerPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import {
  HiCollection,
  HiClipboard,
  HiUsers,
  HiArrowRight,
} from "react-icons/hi";

function MyPlannerPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div>
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">
          
          {/* Header Section */}
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              My Planner
            </div>

            <h1 className="mt-3 text-2xl sm:text-4xl lg:text-4xl font-extrabold">
              <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                Plan
              </span>{" "}
              Your Academic Journey
            </h1>
            
            <p className="mt-2 text-gray-700 dark:text-gray-300 max-w-4xl">
              Explore degrees, majors, and courses to build your personalized study plan. 
              Compare paths and see how different choices shape your academic journey at UNSW.
            </p>
          </div>

          {/* How to Use Card */}
          <div className="card-glass-spotlight mt-6 p-8">
            <p className="text-2xl font-semibold mb-4">
              How My Planner Works
            </p>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              My Planner helps you explore and organize your academic options before committing. 
              Start by browsing programs, then build semester-by-semester plans to visualize your path.
            </p>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Explore Options</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Browse degrees, majors, and courses to shortlist programs</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Build Your Plan</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Create semester-by-semester course schedules and visualize your path</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Compare Paths</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">See how switching programs changes your workload and timeline</p>
                </div>
              </div>
            </div>
          </div>

          {/* Explore Options Section */}
          <div className="mt-12 mb-6">
            <h2 className="text-2xl font-semibold mb-2">
              Start Exploring
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose where you'd like to begin your planning journey
            </p>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-16">
            
            {/* Explore Degrees */}
            <div className="card-glass-spotlight p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer"
                 onClick={() => navigate("/explore-by-degree")}>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40">
                  <HiCollection className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Explore Degrees
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Browse UNSW degree programs, view their structures, and understand entry requirements at a glance.
              </p>

              <button className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                <span>Explore Degrees</span>
                <HiArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Explore Majors */}
            <div className="card-glass-spotlight p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer"
                 onClick={() => navigate("/explore-by-specialisation")}>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40">
                  <HiUsers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Explore Majors
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Review specializations, minors, and honours streams to see their core requirements and career paths.
              </p>

              <button className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                <span>Explore Majors</span>
                <HiArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Explore Courses */}
            <div className="card-glass-spotlight p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer"
                 onClick={() => navigate("/explore-by-course")}>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40">
                  <HiClipboard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Explore Courses
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Search individual courses, check prerequisites, and see how they fit into your degree plan.
              </p>

              <button className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                <span>Explore Courses</span>
                <HiArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default MyPlannerPage;
// src/pages/MyPlannerPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import MindMeshSummary from "../components/MindMeshSummary";

import {
  HiCollection,
  HiClipboard,
  HiUsers,
  HiSwitchHorizontal,
  HiInformationCircle,
  HiChevronDown,
} from "react-icons/hi";

function MyPlannerPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const goSwitch = () => navigate("/planner/switch");

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      {/* Hero */}
      <div className="max-w-7xl mx-auto pt-16 pb-6 px-6 text-center">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          My Planner
        </h1>
        <p className="mb-4 text-lg font-normal text-gray-600 lg:text-xl sm:px-16 xl:px-48">
          Plan your path with clarity. Explore courses, majors, and degrees — then build your MindMesh
          and compare changes before you switch.
        </p>

        {/* Expandable "How to use" */}
        <div className="mx-auto mt-4 mb-2 max-w-3xl text-left">
          <button
            onClick={() => setShowTips((v) => !v)}
            aria-expanded={showTips}
            className="w-full flex items-center justify-between gap-3 bg-white/80 rounded-2xl p-4 shadow border border-slate-200 hover:bg-white transition"
          >
            <div className="flex items-center gap-3">
              <HiInformationCircle className="w-6 h-6 text-sky-600" />
              <span className="font-semibold text-slate-900">How to use My Planner</span>
            </div>
            <HiChevronDown
              className={`w-5 h-5 text-slate-600 transition-transform ${showTips ? "rotate-180" : ""}`}
            />
          </button>

          {showTips && (
            <div className="mt-3 bg-white/70 rounded-2xl p-4 shadow border border-slate-200">
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                <li>Explore <strong>Degrees</strong>, <strong>Majors</strong>, and <strong>Courses</strong> to shortlist options.</li>
                <li>Add items to your <strong>MindMesh</strong> from each details page.</li>
                <li>Use <strong>Switch Majors</strong> to compare your current path vs. a target path.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Main actions */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title="Explore Degrees"
            description="Browse UNSW programs, see total UOC and structure at a glance."
            icon={<HiCollection className="w-7 h-7" />}
            onClick={() => navigate("/explore-by-degree")}
          />
          <ActionCard
            title="Explore Majors"
            description="Review specialisations and their core/required courses."
            icon={<HiUsers className="w-7 h-7" />}
            onClick={() => navigate("/explore-by-major")}
          />
          <ActionCard
            title="Explore Courses"
            description="Search courses, prerequisites, and where each course fits."
            icon={<HiClipboard className="w-7 h-7" />}
            onClick={() => navigate("/explore-by-course")}
          />
        </div>

        {/* MindMesh — live summary (links to /planner/mindmesh) */}
        <div className="mt-10">
          <MindMeshSummary />
        </div>

        {/* Switch Majors — full width */}
        <div className="mt-10">
          <div className="rounded-3xl p-6 bg-white shadow-md border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <HiSwitchHorizontal className="w-6 h-6 text-sky-700" />
              <h2 className="text-2xl font-bold text-slate-900">Switch Majors</h2>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Compare your current path <em>(FROM)</em> with a target path <em>(TO)</em>. We’ll show WAM
              requirements, UOC that carries over, what’s new, and an estimated remaining load.
            </p>

            {/* Non-functional stubs for now */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectorStub label="FROM — Degree" />
              <SelectorStub label="TO — Degree" />
              <SelectorStub label="FROM — Specialisation" />
              <SelectorStub label="TO — Specialisation" />
            </div>

            <div className="mt-6">
              <button
                onClick={goSwitch}
                className="w-full px-8 py-3 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:ring-blue-300"
              >
                Compare Paths (Preview)
              </button>
              <p className="mt-2 text-sm text-slate-500">
                This will be fully interactive once Planner compare is live.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small presentational stubs (no logic yet) ---------- */

function ActionCard({ title, description, icon, onClick }) {
  return (
    <div className="rounded-3xl p-6 bg-white border border-slate-200 shadow-md hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-sky-700">{icon}</div>
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-slate-600 text-sm mb-4">{description}</p>
      <button
        onClick={onClick}
        className="px-6 py-2 text-white font-semibold rounded-2xl shadow transition-all bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:ring-blue-300"
      >
        Open
      </button>
    </div>
  );
}

function SelectorStub({ label }) {
  return (
    <div className="text-left">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 text-slate-400 px-3 py-2">
        Select…
      </div>
    </div>
  );
}

export default MyPlannerPage;

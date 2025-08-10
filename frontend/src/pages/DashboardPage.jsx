// src/pages/DashboardPage.jsx
import React, { useState } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { DashboardNavBar } from '../components/DashboardNavBar';
import { MenuBar } from '../components/MenuBar';
import { RecommendationTable } from '../components/RecommendationTable';
import MyPlannerCard from '../components/MyPlannerCard.jsx';


function DashboardPage() {
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // Name fallback
  const firstNameRaw = session?.user?.user_metadata?.first_name;
  const displayName =
    (firstNameRaw && firstNameRaw.trim()) ||
    session?.user?.email?.split("@")[0] ||
    "there";

  // Fixed greeting
  const greeting = "Hi";

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="flex flex-col justify-center h-full mx-20">
        {/* Eyebrow + greeting */}
        <div className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
            Dashboard
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 leading-tight">
            {greeting} {displayName}!
          </h1>

          <p className="mt-2 text-slate-600">
            {today} • Your recommendations, Planner, and Roadmap in one place.
          </p>
        </div>

        {/* Recommendations */}
        <div className="mt-8 mb-2">
          <span className="text-lg font-semibold text-gray-800">
            Here's what Eunice's recommendations are for you
          </span>
        </div>
        <RecommendationTable />

        {/* Promo card — right aligned */}
        <div className="mt-10 flex">
          <div className="ml-auto">
            <MyPlannerCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

// src/pages/DashboardPage.jsx
import React, { useState } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { DashboardNavBar } from '../components/DashboardNavBar';
import { MenuBar } from '../components/MenuBar';
import { RecommendationTable } from '../components/RecommendationTable';
import MyPlannerCard from '../components/MyPlannerCard.jsx';
import EuniceChatCard from '../components/EuniceChatCard.jsx';


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
    <div className="min-h-screen bg-gradient-to-br">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>
      
      <div className="pt-16 sm:pt-20"> 
        <div className="flex flex-col justify-center h-full mx-20">
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              Dashboard
            </div>

            <h1 className="mt-3 text-2xl sm:text-4xl lg:text-4xl font-extrabold">
              {greeting} {displayName}!
            </h1>

            <p className="mt-2">
              {today} • Your recommendations, Planner, and Roadmap in one place.
            </p>
          </div>
         {/* Promo row — right aligned, two cards side-by-side on large screens */}
          <div className="mt-7 flex gap-4">
            <EuniceChatCard userType={session?.user?.user_metadata?.student_type} />
            <MyPlannerCard />
          </div>

          
          {/* Recommendations */}
          <div className="mt-8 mb-4">
            <span className="text-2xl font-semibold">
              Here's what Eunice's recommendations are for you!
            </span>
          </div>
          <RecommendationTable />

        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
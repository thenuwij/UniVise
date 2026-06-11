// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { DashboardNavBar } from '../components/DashboardNavBar';
import { MenuBar } from '../components/MenuBar';
import RoadmapHeroCard from '../components/RoadmapHeroCard.jsx';
import ProgramTransferCard from '../components/ProgramTransferCard.jsx';
import { RecommendationTable } from '../components/RecommendationTable';
import { UserAuth } from '../context/AuthContext';


function DashboardPage() {
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // Name fallback
  const firstNameRaw =
    session?.user?.user_metadata?.first_name ||
    session?.user?.user_metadata?.full_name?.split(" ")[0] ||
    session?.user?.user_metadata?.name?.split(" ")[0];
  const displayName =
    (firstNameRaw && firstNameRaw.trim()) ||
    session?.user?.email?.split("@")[0] ||
    "there";

  // Fixed greeting
  const greeting = "Hi";

  const studentType = session?.user?.user_metadata?.student_type;
  const isUniversity = studentType !== "high_school";

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>
      
      <div className="pt-16 sm:pt-20">
        <div className="mx-6 sm:mx-12 lg:mx-20">
          <div className="mt-8">
            <h1 className="text-2xl sm:text-4xl lg:text-4xl font-extrabold">
              {greeting} {displayName}!
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {today} • Your academic planning hub
            </p>
          </div>

          {/* Primary row — Roadmap hero (main) + Program Transfer (secondary) */}
          <div className="mt-7 flex flex-col lg:flex-row items-stretch gap-4">
            <div className={isUniversity ? "lg:basis-[68%] min-w-0" : "w-full"}>
              <RoadmapHeroCard />
            </div>
            {isUniversity && (
              <div className="lg:basis-[32%] min-w-0">
                <ProgramTransferCard />
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="mt-12">
            <RecommendationTable />
          </div>

        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

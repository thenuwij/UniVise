// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { DashboardNavBar } from '@/shared/layout/DashboardNavBar';
import { MenuBar } from '@/shared/layout/MenuBar';
import PageHeader from '@/shared/layout/PageHeader';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark } from 'lucide-react';
import ProgramCard from '../components/ProgramCard.jsx';
import AtAGlance from '../components/AtAGlance.jsx';
import { useDashboardFacts } from '../hooks/useDashboardFacts';
import { RecommendationTable } from '@/features/recommendations/components/RecommendationTable';
import { UserAuth } from '@/app/AuthContext';


function DashboardPage() {
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const facts = useDashboardFacts();
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

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = displayName === "there" ? displayName : displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <PageHeader
        eyebrow={today}
        title={
          <>
            {greeting},{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-blue-100">{name}</span>
          </>
        }
        subtitle="Let's keep your degree on track."
        actionsAtBottom
        actions={
          <Link
            to="/saved"
            className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[15px] font-bold text-blue-700 dark:text-blue-200 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 shadow-md shadow-blue-900/10 hover:bg-blue-50 dark:hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <Bookmark className="h-4 w-4" />
            My shortlist
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        }
      />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        <div className="space-y-8">
          <ProgramCard facts={facts} />
          <AtAGlance facts={facts} />
        </div>

        {/* Recommendations */}
        <div className="mt-12">
          <RecommendationTable />
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

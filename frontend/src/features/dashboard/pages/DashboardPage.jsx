// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { DashboardNavBar } from '@/shared/layout/DashboardNavBar';
import { MenuBar } from '@/shared/layout/MenuBar';
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


  return (
    <div className="relative isolate min-h-screen app-page overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden bg-gradient-to-r from-blue-100 via-sky-100 to-indigo-100 dark:from-blue-950/70 dark:via-slate-900 dark:to-indigo-950/70 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      >
        <div className="absolute -top-40 right-[8%] h-[520px] w-[520px] rounded-full bg-blue-200/60 dark:bg-blue-500/15" />
        <div className="absolute top-24 right-[32%] h-[300px] w-[300px] rounded-full bg-indigo-200/50 dark:bg-indigo-500/15" />
        <div className="absolute -bottom-24 -left-24 h-[360px] w-[360px] rounded-full bg-sky-200/50 dark:bg-sky-500/10" />
      </div>
      <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        <div className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-link">{today}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-extrabold text-ink-strong">Hi {displayName}</h1>
            </div>
            <Link
              to="/saved"
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[15px] font-bold text-blue-700 dark:text-blue-200 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 shadow-md shadow-blue-900/10 hover:bg-blue-50 dark:hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <Bookmark className="h-4 w-4" />
              My shortlist
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
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

// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { DashboardNavBar } from '@/shared/layout/DashboardNavBar';
import { MenuBar } from '@/shared/layout/MenuBar';
import PageHeader from '@/shared/layout/PageHeader';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, HelpCircle } from 'lucide-react';
import SpotlightGuide from '@/shared/ui/SpotlightGuide';
import { hasSeenGuide } from '@/shared/lib/guideSeen';
import ProgramCard from '../components/ProgramCard.jsx';
import { useDashboardFacts } from '../hooks/useDashboardFacts';
import { RecommendationTable } from '@/features/recommendations/components/RecommendationTable';
import { UserAuth } from '@/app/AuthContext';


const GUIDE_KEY = 'univise-dashboard-guide-seen';

const GUIDE_STEPS = [
  {
    targets: ['[data-tour="dash-glance"] > *'],
    title: "Where you're at",
    text: "Your UOC so far, your specialisation and the courses you can take next. Each box also links to where you can update it.",
  },
  {
    targets: ['[data-tour="dash-steps"]'],
    title: 'Your roadmap, part by part',
    text: 'Shortcuts to each part of your roadmap: courses, careers, internships and societies.',
  },
  {
    targets: ['[data-tour="dash-open"]'],
    title: 'Start here',
    text: "When you're ready, Open roadmap takes you through your degree step by step.",
  },
  {
    targets: ['[data-tour="menu"]'],
    title: 'Everything else',
    text: "The Menu is where you'll find CourseMesh, the Handbook, Compare programs and Eunice, your AI advisor.",
  },
];

function DashboardPage() {
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const facts = useDashboardFacts();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!facts?.program || hasSeenGuide(GUIDE_KEY)) return;
    const timer = setTimeout(() => setShowGuide(true), 700);
    return () => clearTimeout(timer);
  }, [facts]);
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
      {showGuide && <SpotlightGuide steps={GUIDE_STEPS} seenKey={GUIDE_KEY} onClose={() => setShowGuide(false)} />}

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
        help={
          facts?.program && (
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            aria-label="How the dashboard works"
            title="How the dashboard works"
            className="h-10 w-10 inline-flex items-center justify-center rounded-full text-white bg-white/15 ring-1 ring-white/40 hover:bg-white/25 transition-colors"
          >
            <HelpCircle className="h-5 w-5" strokeWidth={2.5} />
          </button>
          )
        }
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
        </div>

        {/* Recommendations */}
        <div className="mt-16">
          <RecommendationTable />
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

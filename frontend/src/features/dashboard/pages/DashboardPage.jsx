// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { DashboardNavBar } from '@/shared/layout/DashboardNavBar';
import { MenuBar } from '@/shared/layout/MenuBar';
import PageHeader from '@/shared/layout/PageHeader';
import CourseProgress from '@/features/roadmap/components/CourseProgress';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import JourneyCard from '../components/JourneyCard.jsx';
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

  const program = facts?.program;
  const subtitle = program ? [program.program_name, ...(facts.specNames || [])].join(" · ") : null;

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <PageHeader
        eyebrow={today}
        title={`Hi ${displayName}`}
        subtitle={subtitle}
        aside={program ? <CourseProgress degreeCode={program.degree_code} /> : null}
      />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        <div className="space-y-8">
          <JourneyCard facts={facts} />
          <AtAGlance facts={facts} />
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-base">
            <Link to="/progress" className="group inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              Thinking of switching degrees?
              <span className="font-semibold text-blue-700 dark:text-blue-300 group-hover:underline">Switch Degree</span>
              <ArrowRight className="h-4 w-4 text-blue-700 dark:text-blue-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/saved" className="group inline-flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
              <span className="group-hover:underline">My shortlist</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
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

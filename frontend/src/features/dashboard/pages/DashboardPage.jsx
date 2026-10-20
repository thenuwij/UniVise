import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Sparkles } from "lucide-react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import SpotlightGuide from "@/shared/ui/SpotlightGuide";
import { RecommendationTable } from "@/features/recommendations/components/RecommendationTable";
import { RANKED_CAREER_RECOMMENDATIONS_ENABLED } from "@/shared/lib/featureFlags";
import { UserAuth } from "@/app/AuthContext";
import ProgramCard from "../components/ProgramCard";
import { useDashboardFacts } from "../hooks/useDashboardFacts";
import "../dashboard.css";

const GUIDE_KEY = "univise-dashboard-guide-seen";
const GUIDE_STEPS = [
  {
    targets: ['[data-tour="dash-degree"]'],
    title: "Your degree",
    text: "Open your personal roadmap here. Add completed courses or view specialisations whenever you're ready.",
  },
  {
    targets: ['[data-tour="dash-steps"]'],
    title: "Choose a section",
    text: "Overview, Courses, Careers, Internships and Societies are all clickable. You can open any section directly.",
  },
  {
    targets: ['[data-tour="dash-compare"]'],
    title: "Compare your options",
    text: "Compare programs shows how another UNSW degree compares with yours.",
  },
  {
    targets: ['[data-tour="app-navigation"]'],
    title: "Find your way around",
    text: "The top navigation and mobile Menu lead to Roadmap, CourseMesh, Careers and Explore. Account has your profile, appearance settings and sign out.",
  },
];

export default function DashboardPage() {
  const { session } = UserAuth();
  const facts = useDashboardFacts();
  const [isOpen, setIsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const metadata = session?.user?.user_metadata;
  const firstName =
    metadata?.first_name ||
    metadata?.full_name?.split(" ")[0] ||
    metadata?.name?.split(" ")[0];
  const name = firstName?.trim();
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="min-h-screen app-page dashboard-page">
      <DashboardNavBar
        onMenuClick={() => setIsOpen(true)}
        isMenuOpen={isOpen}
      />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      {showGuide && (
        <SpotlightGuide
          steps={GUIDE_STEPS}
          seenKey={GUIDE_KEY}
          onClose={() => setShowGuide(false)}
        />
      )}
      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <div>
            <p className="dashboard-date">{today}</p>
            <h1>
              {greeting}
              {name ? `, ${name.charAt(0).toUpperCase()}${name.slice(1)}` : ""}
            </h1>
            <p className="dashboard-muted">
              Pick up your plan, or find something new.
            </p>
          </div>
          <div className="dashboard-welcome-actions">
            <Link to="/chat" className="dashboard-button">
              <Sparkles aria-hidden="true" />
              Ask Eunice
            </Link>
            {facts?.program && (
              <button
                type="button"
                className="dashboard-help"
                onClick={() => setShowGuide(true)}
                aria-label="How the dashboard works"
              >
                <HelpCircle aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <ProgramCard facts={facts} />
        {RANKED_CAREER_RECOMMENDATIONS_ENABLED && (
          <div className="mt-10">
            <RecommendationTable />
          </div>
        )}
      </main>
    </div>
  );
}

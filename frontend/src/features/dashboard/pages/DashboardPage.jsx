import { useEffect, useState } from "react";
import { Moon, Sun, Sunset } from "lucide-react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import SpotlightGuide from "@/shared/ui/SpotlightGuide";
import { hasSeenGuide } from "@/shared/lib/guideSeen";
import { RecommendationTable } from "@/features/recommendations/components/RecommendationTable";
import { RANKED_CAREER_RECOMMENDATIONS_ENABLED } from "@/shared/lib/featureFlags";
import { UserAuth } from "@/app/AuthContext";
import DashboardHome from "../components/DashboardHome";
import ProgramCard from "../components/ProgramCard";
import { useDashboardFacts } from "../hooks/useDashboardFacts";
import "../dashboard.css";

const DAY_LINES = [
  "Take it easy. Your plan will be here when you're ready.",
  "New week. Let's map out what's next.",
  "A steady start. Pick one thing to move forward.",
  "Halfway there. A good day to check your plan.",
  "Almost the weekend. Anything worth ticking off?",
  "Nearly the weekend. One small step on your degree?",
  "Weekend mode. A quick look ahead never hurts.",
];

const GUIDE_STEPS = [
  {
    targets: ['[data-tour="dash-edit"]'],
    title: "Your degree",
    text: "Change your program or specialisation here.",
  },
  {
    targets: ['[data-tour="dash-program"]'],
    title: "Next courses",
    text: "Courses you can take next. Tick the ones you've done in My Program.",
  },
  {
    targets: ['[data-tour="dash-career"]'],
    title: "Your career this week",
    text: "Jobs, internships and events for your degree.",
  },
  {
    targets: ['[data-tour="app-navigation"]'],
    title: "Getting around",
    text: "Use the top bar or menu for My Program, My Career and Ask Eunice.",
  },
];

export default function DashboardPage() {
  const { session } = UserAuth();
  const guideKey = `univise-dashboard-guide-seen-${session?.user?.id || "guest"}`;
  const facts = useDashboardFacts();
  const [isOpen, setIsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    if (!facts?.program || !session?.user?.id || hasSeenGuide(guideKey)) return;
    const timer = setTimeout(() => setShowGuide(true), 700);
    return () => clearTimeout(timer);
  }, [facts?.program, session?.user?.id, guideKey]);
  const metadata = session?.user?.user_metadata;
  const firstName =
    metadata?.first_name ||
    metadata?.full_name?.split(" ")[0] ||
    metadata?.name?.split(" ")[0];
  const name = firstName?.trim();
  const now = new Date();
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const TimeIcon = hour < 12 ? Sun : hour < 18 ? Sunset : Moon;
  const dayLine = DAY_LINES[now.getDay()];
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
          seenKey={guideKey}
          onClose={() => setShowGuide(false)}
        />
      )}
      <main className="dashboard-main">
        {facts?.program ? (
          <DashboardHome
            facts={facts}
            greeting={`${greeting}${name ? `, ${name.charAt(0).toUpperCase()}${name.slice(1)}` : ""}`}
            today={today}
            dayLine={dayLine}
            onHelp={() => setShowGuide(true)}
          />
        ) : (
          <>
            <div className="dashboard-welcome">
              <div>
                <p className="dashboard-date">
                  <TimeIcon aria-hidden="true" />
                  {today}
                </p>
                <h1>
                  {greeting}
                  {name ? `, ${name.charAt(0).toUpperCase()}${name.slice(1)}` : ""}
                </h1>
                <p className="dashboard-day-line">{dayLine}</p>
              </div>
              <div className="dashboard-welcome-actions">
              </div>
            </div>
            <ProgramCard facts={facts} />
          </>
        )}
        {RANKED_CAREER_RECOMMENDATIONS_ENABLED && (
          <div className="mt-10">
            <RecommendationTable />
          </div>
        )}
      </main>
    </div>
  );
}

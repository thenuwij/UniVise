import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  Compass,
  GitCompare,
  GraduationCap,
  Layers,
  Users,
} from "lucide-react";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";
import AtAGlance from "./AtAGlance";

const STEP_LINKS = [
  {
    key: "overview",
    title: "Overview",
    text: "Understand your degree and requirements",
    icon: BookOpen,
  },
  {
    key: "structure",
    title: "Courses",
    text: "Plan courses and track completion",
    icon: Layers,
  },
  {
    key: "careers",
    title: "Careers",
    text: "Explore roles connected to your degree",
    icon: Briefcase,
  },
  {
    key: "internships",
    title: "Internships",
    text: "Browse opportunities and programs",
    icon: Building2,
  },
  {
    key: "societies",
    title: "Societies",
    text: "Find clubs and professional communities",
    icon: Users,
  },
];

export default function ProgramCard({ facts }) {
  if (!facts)
    return (
      <div
        className="dashboard-degree dashboard-skeleton animate-pulse"
        role="status"
      >
        <span className="sr-only">Loading your degree</span>
      </div>
    );
  if (!facts.program) {
    return (
      <section
        className="dashboard-degree"
        aria-labelledby="dashboard-no-program"
      >
        <div className="dashboard-degree-heading">
          <span className="dashboard-program-mark">
            <Compass aria-hidden="true" />
          </span>
          <div className="dashboard-degree-copy">
            <p className="dashboard-eyebrow">Your next step</p>
            <h2 id="dashboard-no-program">Explore any UNSW program</h2>
            <p className="dashboard-muted">
              Your program isn't in our list yet. You can still explore degree
              requirements, courses and careers.
            </p>
          </div>
        </div>
        <div className="dashboard-fallback-actions">
          <Link
            to="/roadmap"
            className="dashboard-button dashboard-button-primary"
          >
            Explore a program's roadmap
          </Link>
          <Link to="/handbook" className="dashboard-button">
            Search the Handbook
          </Link>
        </div>
      </section>
    );
  }
  const { program, minimumUoc, specNames = [] } = facts;
  const details = [
    "UNSW",
    `Program ${program.degree_code}`,
    minimumUoc ? `${minimumUoc} UOC` : null,
  ].filter(Boolean);
  return (
    <>
      <section
        className="dashboard-degree"
        data-tour="dash-degree"
        aria-labelledby="dashboard-degree-title"
      >
        <div className="dashboard-degree-heading">
          <span className="dashboard-program-mark">
            <GraduationCap aria-hidden="true" />
          </span>
          <div className="dashboard-degree-copy">
            <p className="dashboard-eyebrow">Your degree</p>
            <div className="dashboard-degree-name-row">
              <h2 id="dashboard-degree-title">{program.program_name}</h2>
              <div className="dashboard-degree-links">
                <Link to="/roadmap">Change program</Link>
              </div>
            </div>
            <p className="dashboard-muted">{details.join(" · ")}</p>
            {(specNames.length > 0 || (!facts.failed && facts.hasSpecOptions)) && (
              <div className="dashboard-degree-name-row">
                <p className="dashboard-muted">
                  {specNames.length > 0
                    ? specNames.join(" · ")
                    : "No specialisation selected"}
                </p>
                {!facts.failed && facts.hasSpecOptions && (
                  <div className="dashboard-degree-links">
                    <Link to={`/roadmap?program=${program.degree_code}`}>
                      Change specialisation
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          <Link
            to="/roadmap-entryload"
            className="dashboard-button dashboard-button-primary dashboard-open-roadmap"
            data-tour="dash-open"
          >
            Open roadmap
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <AtAGlance facts={facts} />
      </section>
      <section
        className="dashboard-roadmap"
        aria-labelledby="dashboard-roadmap-title"
      >
        <div className="dashboard-section-heading">
          <h2 id="dashboard-roadmap-title">Explore your roadmap</h2>
          <p className="dashboard-muted">Choose a section to open it.</p>
        </div>
        <nav
          className="dashboard-sections"
          aria-label="Roadmap sections"
          data-tour="dash-steps"
        >
          {STEP_LINKS.map(({ key, title, text, icon: Icon }) => (
            <Link
              key={key}
              to={roadmapStepUrl(key)}
              className="dashboard-section"
            >
              <span className="dashboard-section-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="dashboard-section-title">{title}</span>
              <span className="dashboard-section-description">{text}</span>
            </Link>
          ))}
        </nav>
      </section>
      <section
        className="dashboard-compare"
        aria-labelledby="dashboard-compare-title"
        data-tour="dash-compare"
      >
        <span className="dashboard-compare-icon">
          <GitCompare aria-hidden="true" />
        </span>
        <div>
          <h2 id="dashboard-compare-title">Considering a different program?</h2>
          <p className="dashboard-muted">
            See how another degree compares with yours.
          </p>
        </div>
        <Link to="/compare" className="dashboard-button">
          Compare programs
        </Link>
      </section>
    </>
  );
}

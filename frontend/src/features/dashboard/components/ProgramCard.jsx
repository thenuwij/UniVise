import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Compass,
  GitCompare,
  GraduationCap,
  Handshake,
  Layers,
  Network,
  Route,
  Users,
} from "lucide-react";
import { careerSectionUrl, roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";
import AtAGlance from "./AtAGlance";

const SECTION_GROUPS = [
  {
    id: "program",
    title: "My Program",
    tour: "dash-steps",
    links: [
      { key: "overview", title: "Overview", text: "Understand your degree and requirements", icon: BookOpen, to: roadmapStepUrl("overview") },
      { key: "structure", title: "Courses", text: "Plan courses and track completion", icon: Layers, to: roadmapStepUrl("structure") },
      { key: "coursemesh", title: "CourseMesh", text: "See what your courses unlock next", icon: Network, to: roadmapStepUrl("coursemesh") },
      { key: "societies", title: "Societies", text: "Find clubs and student communities", icon: Users, to: roadmapStepUrl("societies") },
    ],
  },
  {
    id: "career",
    title: "My Career",
    tour: "dash-career",
    links: [
      { key: "jobs", title: "Jobs", text: "Graduate and junior roles picked for you", icon: Briefcase, to: careerSectionUrl("jobs") },
      { key: "internships", title: "Internships", text: "Open internships and annual programs", icon: Building2, to: careerSectionUrl("internships") },
      { key: "networking", title: "Networking", text: "Career fairs, meetups and industry events", icon: Handshake, to: careerSectionUrl("networking") },
      { key: "certifications", title: "Certifications", text: "Credentials that strengthen applications", icon: Award, to: careerSectionUrl("certifications") },
      { key: "outlook", title: "Career outlook", text: "Roles and pay your degree leads to", icon: Route, to: careerSectionUrl("career-outlook") },
    ],
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
            Explore a program
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
            Open My Program
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <AtAGlance facts={facts} />
      </section>
      <div className="dashboard-groups">
        {SECTION_GROUPS.map((group) => (
          <section
            key={group.id}
            className="dashboard-group"
            aria-labelledby={`dashboard-${group.id}-title`}
            data-tour={group.tour}
          >
            <div className="dashboard-group-heading">
              <h2 id={`dashboard-${group.id}-title`}>{group.title}</h2>
            </div>
            <nav aria-label={`${group.title} sections`}>
              <ul className="dashboard-link-list">
                {group.links.map(({ key, title, text, icon: Icon, to }) => (
                  <li key={key}>
                    <Link to={to} className="dashboard-link-row">
                      <span className="dashboard-section-icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="dashboard-link-copy">
                        <span className="dashboard-link-title">{title}</span>
                        <span className="dashboard-link-text">{text}</span>
                      </span>
                      <ArrowRight className="dashboard-link-arrow" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </section>
        ))}
      </div>
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

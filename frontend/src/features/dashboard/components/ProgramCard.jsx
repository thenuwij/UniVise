import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BookOpen, BriefcaseBusiness } from "lucide-react";
import { roadmapViewUrl } from "@/features/roadmap/utils/roadmapSteps";
import AtAGlance from "./AtAGlance";
import DegreeEditMenu from "./DegreeEditMenu";

export default function ProgramCard({ facts }) {
  if (!facts) {
    return (
      <div className="dashboard-portals" role="status">
        <span className="sr-only">Loading your home page</span>
        {[0, 1].map((index) => <div key={index} className="dashboard-portal dashboard-skeleton animate-pulse" aria-hidden="true" />)}
      </div>
    );
  }
  if (!facts.program) {
    return (
      <section className="dashboard-empty" aria-labelledby="dashboard-no-program">
        <p className="dashboard-eyebrow">Your next step</p>
        <h2 id="dashboard-no-program">Explore any UNSW program</h2>
        <p className="dashboard-muted">
          Your program isn't in our list yet. You can still explore degree requirements, courses and careers.
        </p>
        <div className="dashboard-fallback-actions">
          <Link to="/roadmap" className="dashboard-action">Explore a program <ArrowRight aria-hidden="true" /></Link>
          <Link to="/handbook" className="dashboard-text-link">Search the Handbook <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </section>
    );
  }

  const { program, minimumUoc, specNames = [] } = facts;
  const canChangeSpecialisation = !facts.failed && facts.hasSpecOptions;
  const details = [
    specNames.length ? specNames.join(" · ") : canChangeSpecialisation ? "No specialisation selected" : null,
    `UNSW ${program.degree_code}`,
    minimumUoc ? `${minimumUoc} UOC` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="dashboard-portals">
        <section className="dashboard-portal dashboard-portal-program" data-tour="dash-degree" aria-labelledby="dashboard-program-title">
          <p className="dashboard-portal-eyebrow"><BookOpen aria-hidden="true" />Your degree</p>
          <h2 id="dashboard-program-title">My Program</h2>
          <p className="dashboard-portal-description">Bring your degree into focus.</p>
          <p className="dashboard-portal-sections">Requirements · Courses · CourseMesh · Societies</p>
          <div className="dashboard-portal-context">
            <h3>{program.program_name}</h3>
            <p className="dashboard-program-details">{details.join(" · ")}</p>
            <AtAGlance facts={facts} />
          </div>
          <Link to={roadmapViewUrl("degree")} className="dashboard-action dashboard-portal-open" data-tour="dash-open">
            Open My Program <ArrowRight aria-hidden="true" />
          </Link>
          <div className="dashboard-portal-edit" data-tour="dash-edit">
            <DegreeEditMenu degreeCode={program.degree_code} canChangeSpecialisation={canChangeSpecialisation} />
          </div>
        </section>

        <section className="dashboard-portal dashboard-portal-career" data-tour="dash-career" aria-labelledby="dashboard-career-title">
          <p className="dashboard-portal-eyebrow"><BriefcaseBusiness aria-hidden="true" />Your future</p>
          <h2 id="dashboard-career-title">My Career</h2>
          <p className="dashboard-portal-description">Turn your degree into your next opportunity.</p>
          <p className="dashboard-portal-sections">Jobs · Internships · Networking · Certifications · Career outlook</p>
          <div className="dashboard-portal-context dashboard-career-context">
            <p>A clearer direction. A world of possibilities.</p>
          </div>
          <Link to={roadmapViewUrl("careers")} className="dashboard-action dashboard-portal-open">
            Open My Career <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </div>
      <div className="dashboard-compare" data-tour="dash-compare">
        <p>Considering a different direction?</p>
        <Link to="/compare" className="dashboard-text-link dashboard-compare-link">Compare programs <ArrowUpRight aria-hidden="true" /></Link>
      </div>
    </>
  );
}

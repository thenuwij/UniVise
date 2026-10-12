import { Link } from "react-router-dom";
import { ListChecks } from "lucide-react";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";

export default function AtAGlance({ facts }) {
  if (!facts?.program) return null;
  const hasCompletedCourses = !facts.failed && facts.doneCount > 0;
  const pct =
    hasCompletedCourses && facts.minimumUoc
      ? Math.min(100, Math.round((facts.uocDone / facts.minimumUoc) * 100))
      : null;
  return (
    <div className="dashboard-personalise" data-tour="dash-glance">
      <div className="dashboard-progress">
        {facts.failed ? (
          <p className="dashboard-muted" role="status">
            Progress couldn't be loaded. You can still open your roadmap.
          </p>
        ) : hasCompletedCourses ? (
          <>
            <p className="dashboard-progress-value">
              {facts.uocDone}
              {facts.minimumUoc ? ` of ${facts.minimumUoc}` : ""} UOC recorded
            </p>
            {pct !== null && (
              <div
                className="dashboard-progress-track"
                role="progressbar"
                aria-label="Recorded degree completion"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${pct}%` }} />
              </div>
            )}
            <p className="dashboard-muted">
              {facts.canTakeNext} courses available in CourseMesh
            </p>
          </>
        ) : (
          <p className="dashboard-muted">Personalise your plan</p>
        )}
      </div>
      <div className="dashboard-personalise-buttons">
        <Link to={roadmapStepUrl("structure")} className="dashboard-button">
          <ListChecks aria-hidden="true" />
          {hasCompletedCourses
            ? "Update completed courses"
            : "Add completed courses"}
        </Link>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ProgramCard({ facts }) {
  if (!facts) {
    return (
      <div className="mt-6 space-y-6" role="status">
        <span className="sr-only">Loading your home page</span>
        <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" aria-hidden="true" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((index) => <div key={index} className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" aria-hidden="true" />)}
        </div>
      </div>
    );
  }
  if (!facts.program) {
    return (
      <section className="dashboard-empty" aria-labelledby="dashboard-no-program">
        <p className="dashboard-eyebrow">Your next step</p>
        <h2 id="dashboard-no-program">Choose a supported degree</h2>
        <p className="dashboard-muted">
          Personal planning requires your enrolled degree to be supported by UniVise. If it isn't listed, UniVise isn't currently supported for your studies.
        </p>
        <div className="dashboard-fallback-actions">
          <Link to="/survey" className="dashboard-action">Choose your degree <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    );
  }

  return null;
}

import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import DashboardHome from "./DashboardHome";

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

  return <DashboardHome facts={facts} />;
}

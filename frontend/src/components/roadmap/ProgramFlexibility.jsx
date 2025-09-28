import RoadmapCard from "./RoadmapCard";
import { Link } from "react-router-dom";

export default function ProgramFlexibility({ switchOptions = [], simulatorLink = "/switching" }) {
  return (
    <RoadmapCard title="Program Flexibility" subtitle="Suggested majors/programs to consider.">
      <div className="space-y-3 text-primary">
        <div>
          <span className="font-medium">Suggested switch options:</span>{" "}
          {switchOptions.length ? switchOptions.join(", ") : "—"}
        </div>
        <Link
          to={simulatorLink}
          className="inline-block px-4 py-2 rounded-xl border border-border-light dark:border-border-medium 
                     bg-accent dark:bg-secondary hover:bg-secondary dark:hover:bg-accent transition-colors"
        >
          Open Switching Major Simulator
        </Link>
      </div>
    </RoadmapCard>
  );
}

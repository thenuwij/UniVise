import RoadmapCard from "./RoadmapCard";
import { Link } from "react-router-dom";

export default function ProgramFlexibility({ switchOptions = [], simulatorLink = "/switching" }) {
  return (
    <RoadmapCard title="Program Flexibility" subtitle="Suggested majors/programs to consider.">
      <div className="space-y-3">
        <div className="text-slate-700">
          <span className="font-medium">Suggested switch options:</span>{" "}
          {switchOptions.length ? switchOptions.join(", ") : "—"}
        </div>
        <Link to={simulatorLink} className="inline-block px-4 py-2 rounded-xl border hover:bg-slate-50">
          Open Switching Major Simulator
        </Link>
      </div>
    </RoadmapCard>
  );
}

import RoadmapCard from "./RoadmapCard";

export default function IndustrySection({ internships = [], trainingInfo, societies = [], careersHint }) {
  return (
    <RoadmapCard title="Industry">
      <div className="space-y-2 text-primary">
        {!!internships.length && (
          <div>
            <span className="font-medium">Internship sites:</span> {internships.join(", ")}
          </div>
        )}
        {trainingInfo && (
          <div>
            <span className="font-medium">Industrial training:</span> {trainingInfo}
          </div>
        )}
        {!!societies.length && (
          <div>
            <span className="font-medium">Societies:</span> {societies.join(", ")}
          </div>
        )}
        {careersHint && (
          <div className="text-sm text-secondary">
            Careers (API later): {careersHint}
          </div>
        )}
        {!internships.length && !trainingInfo && !societies.length && !careersHint && (
          <div className="text-secondary">—</div>
        )}
      </div>
    </RoadmapCard>
  );
}

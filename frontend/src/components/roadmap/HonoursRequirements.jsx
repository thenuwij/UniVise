import RoadmapCard from "./RoadmapCard";

export default function HonoursRequirements({ classes = [], requirements, wamRestrictions }) {
  return (
    <RoadmapCard title="Honours Requirements">
      <div className="space-y-2 text-slate-700">
        {!!classes.length && <div><span className="font-medium">Classes:</span> {classes.join(", ")}</div>}
        {requirements && <div><span className="font-medium">Requirements:</span> {requirements}</div>}
        {wamRestrictions && <div><span className="font-medium">WAM restrictions:</span> {wamRestrictions}</div>}
        {!classes.length && !requirements && !wamRestrictions && <div className="text-slate-500">—</div>}
      </div>
    </RoadmapCard>
  );
}

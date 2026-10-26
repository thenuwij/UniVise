import { useLocation, useNavigate } from "react-router-dom";
import { UserAuth } from "@/app/AuthContext";
import AppNav from "@/shared/layout/AppNav";
import PageHeader from "@/shared/layout/PageHeader";
import { bandLink } from "@/shared/ui/cardStyles";
import RoadmapStatus from "@/features/program/components/RoadmapStatus";
import SaveProgramButton from "@/features/program/components/SaveProgramButton";
import { useDegree } from "@/features/program/hooks/useDegree";
import { useEnrolledProgram } from "@/features/program/hooks/useEnrolledProgram";
import { useRoadmap } from "@/features/program/hooks/useRoadmap";
import { useSpecialisationNames } from "@/features/program/hooks/useSpecialisationNames";
import { roadmapViewUrl } from "@/features/program/utils/roadmapSteps";
import CareersContent from "../components/CareersContent";

export default function CareerPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const roadmapId = new URLSearchParams(search).get("id");
  const { session } = UserAuth();

  const { data, loading, error, header, sectionsStatus, retrySections } = useRoadmap(roadmapId, session?.access_token);
  const degree = useDegree(header.degree_code);
  const { program: enrolledProgram } = useEnrolledProgram();
  const specNames = useSpecialisationNames(header.degree_code, session?.user?.id);
  const isOwnProgram = !!enrolledProgram && enrolledProgram.degree_code === header.degree_code;
  const programName = degree?.program_name || header.program_name || "";

  return (
    <div className="min-h-screen app-page text-primary transition-colors duration-500">
      <AppNav />
      <PageHeader
        back={isOwnProgram ? undefined : { label: "Back to My Career", onClick: () => navigate(roadmapViewUrl("careers")) }}
        actions={
          <>
            <SaveProgramButton degreeCode={header.degree_code} degree={degree} programName={programName} />
            <button onClick={() => navigate("/roadmap?view=careers")} className={bandLink}>
              Explore a different degree
            </button>
          </>
        }
        eyebrow={isOwnProgram ? "My Career" : "Exploring careers"}
        title={
          specNames.length > 0 ? (
            <>
              {programName}
              <span className="ml-2 align-middle text-base font-semibold text-band-soft md:text-lg">· {specNames.join(" · ")}</span>
            </>
          ) : programName
        }
        compact
        slim
        wide
      />
      {data ? (
        <CareersContent roadmapId={roadmapId} data={data} sectionsStatus={sectionsStatus} onRetry={retrySections} personal={isOwnProgram} />
      ) : (
        <RoadmapStatus loading={loading} error={error} />
      )}
    </div>
  );
}

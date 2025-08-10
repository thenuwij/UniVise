import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import RoadmapCard from "../components/roadmap/RoadmapCard";
import RoadmapFlow from "../components/roadmap/RoadmapFlow";
import ProgressBoard from "../components/roadmap/ProgressBoard";
import ProgramStructure from "../components/roadmap/ProgramStructure";
import HonoursRequirements from "../components/roadmap/HonoursRequirements";
import ProgramFlexibility from "../components/roadmap/ProgramFlexibility";
import IndustrySection from "../components/roadmap/IndustrySection";
import CareersSection from "../components/roadmap/CareersSection";
import SkeletonCard from "../components/roadmap/SkeletonCard";

export default function RoadmapTranscriptPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Steps (Program Structure; honours/flex; industry)
  const steps = useMemo(
    () => [
      {
        key: "progress",
        title: "Progress Board",
        render: () => (
          <ProgressBoard
            currentWam={data?.progress_board?.currentWam}
            uocCompleted={data?.progress_board?.uocCompleted}
            remainingUoc={data?.progress_board?.remainingUoc}
            estCompletion={data?.progress_board?.estCompletion}
            progress={data?.progress_board?.progress}
          />
        ),
      },
      {
        key: "plan",
        title: "Program Structure",
        render: () => (
          <ProgramStructure
            unsw
            years={data?.program_flexibility?.year_plan || []}
            // If backend supplies suggested specialisations, surface them here
            suggestedSpecialisations={
              data?.program_flexibility?.suggested_specialisations || []
            }
          />
        ),
      },
      {
        key: "honours",
        title: "Honours & Rules",
        render: () => (
          <HonoursRequirements
            requirements={data?.program_flexibility?.honours?.requirements}
            wamRestrictions={data?.program_flexibility?.honours?.wamRestrictions}
          />
        ),
      },
      {
        key: "flex",
        title: "Flexibility",
        render: () => (
          <ProgramFlexibility
            switchOptions={data?.program_flexibility?.options || []}
            simulatorLink="/switching"
          />
        ),
      },
      {
        key: "industry",
        title: "Industry & Careers",
        render: () => (
          <div className="space-y-6">
            <IndustrySection
              trainingInfo={data?.industry?.trainingInfo}
              societies={data?.industry?.societies || []}
              careersHint={data?.industry?.rolesHint}
            />
            <CareersSection rolesHint={data?.industry?.rolesHint} />
          </div>
        ),
      },
    ],
    [data]
  );

  // Sample payload (includes summary; structure; honours; flexibility; industry)
  function loadSample() {
    const sample = {
      summary:
        "This transcript-based roadmap uses your WAM, UOC, and completed courses to outline remaining structure, honours eligibility, flexibility options, and industry links.",
      progress_board: {
        currentWam: 72.5,
        uocCompleted: 78,
        remainingUoc: 66,
        estCompletion: "T3 2026",
        progress: 54,
      },
      program_flexibility: {
        year_plan: [
          {
            year: 2,
            courses: [{ code: "COMP2521", title: "Data Structures", term: "T2" }],
          },
          {
            year: 3,
            courses: [{ code: "COMP3900", title: "Capstone Project", term: "T3" }],
          },
        ],
        suggested_specialisations: ["Artificial Intelligence", "Cyber Security"], // optional
        honours: {
          requirements: "WAM ≥ 65–70 + project",
          wamRestrictions: "See handbook",
        },
        options: ["CS ↔ SE", "CS ↔ Commerce"],
      },
      industry: {
        trainingInfo: "Industrial training via faculty",
        societies: ["CSESoc", "WIT"],
        rolesHint: "developer, analyst",
      },
      source: "Sample (placeholder)",
    };
    setData(sample);
    setActiveIndex(0);
  }

  // TODO: Replace with real fetch to /roadmap/transcript
  async function handleGenerate() {
    try {
      setErr("");
      setLoading(true);
      // const res = await fetch("/api/roadmap/transcript", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({}),
      // });
      // if (!res.ok) throw new Error("Failed to generate.");
      // const json = await res.json();
      // setData(json.payload);
      await new Promise((r) => setTimeout(r, 600));
      loadSample();
    } catch (e) {
      setErr(e.message || "Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  }

  const stepLabel = data ? `Step ${activeIndex + 1} of ${steps.length}` : "";

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="mb-6">
        <button
          onClick={() => nav("/roadmap")}
          className="text-slate-500 hover:text-slate-700"
        >
          &larr; Back
        </button>
      </div>

      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-light text-slate-900">
            Transcript Roadmap
          </h1>
          <p className="text-slate-600 mt-2">
            Built from your transcript (WAM, UOC, completions).
          </p>
          {data && <p className="text-xs text-slate-500 mt-1">{stepLabel}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-3 rounded-xl shadow bg-black text-white disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
          <button onClick={loadSample} className="px-5 py-3 rounded-xl border">
            Load Sample
          </button>
        </div>
      </header>

      {/* SUMMARY ON TOP */}
      <div className="mb-6">
        {(!data && loading) && <SkeletonCard lines={3} />}
        {data && (
          <RoadmapCard title="Summary">
            <div className="text-slate-700 space-y-2">
              <p>{data?.summary || "—"}</p>
              <ul className="text-sm text-slate-600">
                <li>
                  <span className="font-medium">Mode:</span> Transcript
                </li>
                <li>
                  <span className="font-medium">From:</span> Uploaded transcript
                </li>
                <li>
                  <span className="font-medium">Source:</span> {data?.source || "—"}
                </li>
              </ul>
            </div>
          </RoadmapCard>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr,340px] gap-6">
        <div className="space-y-6">
          {!data && loading && (
            <>
              <SkeletonCard lines={4} />
              <SkeletonCard lines={8} />
              <SkeletonCard lines={4} />
            </>
          )}

          {data && (
            <RoadmapFlow
              steps={steps}
              activeIndex={activeIndex}
              onChange={setActiveIndex}
            />
          )}

          {!data && !loading && (
            <RoadmapCard
              title="Ready when you are"
              subtitle="Generate or Load Sample to start the roadmap."
            />
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 h-max">
          <RoadmapCard title="Actions">
            <div className="flex flex-col gap-2">
              <button className="px-4 py-2 rounded-xl border">Save</button>
              <button className="px-4 py-2 rounded-xl border">Export PDF</button>
              <button className="px-4 py-2 rounded-xl border">Regenerate</button>
            </div>
          </RoadmapCard>
        </aside>
      </div>
    </div>
  );
}

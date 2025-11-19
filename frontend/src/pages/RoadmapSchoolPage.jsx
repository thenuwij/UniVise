// RoadmapSchoolPage.jsx — Matches UNSW Roadmap Design (Quick Facts Removed)
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import RoadmapFlow from "../components/roadmap/RoadmapFlow";
import EntryRequirementsCard from "../components/roadmap/EntryRequirementsCard";
import ProgramStructure from "../components/roadmap/ProgramStructure";
import IndustrySection from "../components/roadmap/IndustrySection";
import CareersSection from "../components/roadmap/CareersSection";
import SkeletonCard from "../components/roadmap/SkeletonCard";
import GradientCard from "../components/GradientCard";
import SectionTitle from "../components/SectionTitle";
import Pill from "../components/Pill";
import { ArrowLeft } from "../components/icons/InlineIcons";

// --- ICON ---
const SchoolIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M22 10L12 2 2 10l10 6 10-6z" />
    <path d="M6 12v6l6 4 6-4v-6" />
  </svg>
);

// --- Main Component ---
export default function RoadmapSchoolPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const degree = state?.degree || null;
  const preloadedPayload = state?.payload || null;
  const preloadedRoadmapId = state?.roadmap_id || null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(preloadedPayload);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchByIdIfNeeded = async () => {
      if (!data && preloadedRoadmapId) {
        try {
          setLoading(true);
          const { data: row, error } = await supabase
            .from("school_roadmap")
            .select("payload")
            .eq("id", preloadedRoadmapId)
            .maybeSingle();
          if (error) throw error;
          setData(row?.payload || null);
        } catch (e) {
          setErr(e.message || "Failed to fetch roadmap by id.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchByIdIfNeeded();
  }, [preloadedRoadmapId, data]);

  const handleGenerate = useCallback(async () => {
    try {
      setErr("");
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated.");
      if (!degree) throw new Error("No degree context.");

      const body = {
        recommendation_id: degree?.source === "hs_recommendation" ? degree?.id : undefined,
        degree_name: degree?.degree_name || degree?.program_name || undefined,
        country: "AU",
      };

      const res = await fetch("http://localhost:8000/roadmap/school", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || `Failed to generate roadmap (HTTP ${res.status}).`);
      setData(json.payload);
      setActiveIndex(0);
    } catch (e) {
      setErr(e.message || "Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  }, [degree]);

  const steps = useMemo(
    () => [
      {
        key: "entry",
        title: "Entry Requirements",
        render: () => (
          <EntryRequirementsCard
            atar={data?.entry_requirements?.atar}
            selectionRank={data?.entry_requirements?.selection_rank || null}
            subjects={data?.entry_requirements?.subjects || []}
            notes={data?.entry_requirements?.notes}
          />
        ),
      },
      {
        key: "structure",
        title: "Program Structure",
        render: () => (
          <ProgramStructure
            years={data?.program_structure || []}
            suggestedSpecialisations={
              data?.suggested_specialisations ||
              data?.specialisations ||
              []
            }
          />
        ),
      },
      {
        key: "industry",
        title: "Industry",
        render: () => (
          <IndustrySection 
            industryExperience={data?.industry_experience}
          />
        ),
      },
      {
        key: "careers",
        title: "Careers",
        render: () => (
          <CareersSection 
            careerPathways={data?.career_pathways || {}}
            source={data?.source || null}
          />
        ),
      }
    ],
    [data]
  );


  const sources = Array.isArray(data?.sources) ? data.sources : [];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 
                 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-primary transition-colors duration-500"
    >
      {/* background glow */}
      <div aria-hidden>
        <div className="roadmap-glow-top" />
        <div className="roadmap-glow-bottom" />
      </div>

      <DashboardNavBar onMenuClick={() => setIsMenuOpen(true)} />
      <MenuBar isOpen={isMenuOpen} handleClose={() => setIsMenuOpen(false)} />

      <div className="max-w-[1600px] mx-auto pt-20 pb-10 px-4 md:px-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/roadmap")}
          className="group inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 
                     hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          <span>Back</span>
        </button>

        {/* Hero card */}
        <GradientCard className="mt-6 shadow-lg bg-white/80 dark:bg-slate-900/70 
                                 border border-slate-200/70 dark:border-slate-700/60 backdrop-blur-md">
          <div className="relative p-8">
            <div
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r 
                         from-sky-600 via-blue-500 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 
                         rounded-t-3xl"
            />
            <SectionTitle
              icon={<SchoolIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
              subtitle="General Mode"
            >
              <span
                className="bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-500 
                           bg-clip-text text-transparent font-bold"
              >
                {degree?.degree_name || degree?.program_name || "Selected Degree"}
              </span>
            </SectionTitle>

            {data && (
              <div className="mt-6 space-y-4 text-slate-700 dark:text-slate-300">
                <p className="text-base leading-relaxed">{data?.summary || "—"}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Pill>
                    Mode: <span className="ml-1 font-medium">School</span>
                  </Pill>
                  <Pill>
                    University: <span className="ml-1 font-medium">{degree?.university_name || "—"}</span>
                  </Pill>
                  {degree?.atar_requirement && (
                    <Pill>
                      ATAR: <span className="ml-1 font-medium">{degree.atar_requirement}</span>
                    </Pill>
                  )}
                  {degree?.est_completion_years && (
                    <Pill>
                      Duration: <span className="ml-1 font-medium">{degree.est_completion_years} years</span>
                    </Pill>
                  )}
                </div>
              </div>
            )}
          </div>
        </GradientCard>

        {/* Main roadmap content */}
        <div className="mt-8">
          <GradientCard className="shadow-lg bg-white/70 dark:bg-slate-900/60 
                                  border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
            <div className="p-4 md:p-6">
              {!data && loading && (
                <>
                  <SkeletonCard lines={4} />
                  <SkeletonCard lines={6} />
                  <SkeletonCard lines={4} />
                </>
              )}
              {data && <RoadmapFlow steps={steps} activeIndex={activeIndex} onChange={setActiveIndex} />}
              {!data && !loading && !err && (
                <div className="text-center py-10 text-secondary">
                  Ready when you are. Your roadmap will appear here.
                </div>
              )}
              {err && !loading && (
                <div className="rounded-2xl border border-red-200 bg-red-50/70 dark:border-red-700 dark:bg-red-900/40 p-4 text-sm text-red-700 dark:text-red-300 mt-4">
                  {err}
                </div>
              )}
            </div>
          </GradientCard>
        </div>

        {/* Footer callout */}
        <div className="mt-10 text-center">
          <div
            className="inline-block rounded-xl bg-sky-50/80 dark:bg-sky-900/20 
                        border border-sky-200/50 dark:border-sky-700/40 
                        px-4 py-3 text-sm font-medium text-sky-800 dark:text-sky-300 
                        shadow-sm backdrop-blur-sm"
          >
            Tip: Roadmaps are indicative. Always confirm with the official university handbook.
          </div>
        </div>
      </div>
    </div>
  );
}

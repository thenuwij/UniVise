// src/pages/DegreeDetailPage.jsx
import { useEffect, useRef, useState } from "react";
import {
  HiAcademicCap,
  HiArrowLeft,
  HiBookOpen,
  HiBriefcase,
  HiChartBar,
  HiClock,
  HiCollection,
  HiDocumentText,
  HiInformationCircle,
  HiLightBulb,
  HiLocationMarker,
  HiSparkles,
} from "react-icons/hi";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import SaveButton from "../components/SaveButton";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

function DegreeDetailPage() {
  const { session } = UserAuth();
  const { degreeId } = useParams();
  const navigate = useNavigate();

  const [degree, setDegree] = useState(null);
  const [advisorSummary, setAdvisorSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

  const advisorRef = useRef(null);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const fetchSmartAdvisor = async () => {
    setLoadingSummary(true);
    setAdvisorSummary(null);
    setLoadErr(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/smart-summary/degree`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ degree_id: degreeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      setAdvisorSummary(data.summary);
      advisorRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setLoadErr(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const fetchDegreeData = async () => {
      setLoadErr(null);

      const { data: deg, error: dErr } = await supabase
        .from("unsw_degrees_final")
        .select("*")
        .eq("id", degreeId)
        .single();

      if (!alive) return;

      if (dErr) {
        setLoadErr(dErr.message);
        return;
      }

      // Parse career outcomes
      const parsedCareerOutcomes = (() => {
        try {
          if (!deg?.career_outcomes) return [];
          return deg.career_outcomes.startsWith("[")
            ? JSON.parse(deg.career_outcomes)
            : String(deg.career_outcomes)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        } catch {
          return [];
        }
      })();

      // Parse program structure sections
      let parsedSections = [];
      try {
        if (deg?.sections) {
          parsedSections =
            typeof deg.sections === "string"
              ? JSON.parse(deg.sections)
              : deg.sections;
        }
      } catch (e) {
        console.error("Error parsing sections:", e);
      }

      setDegree({
        ...deg,
        career_outcomes: parsedCareerOutcomes,
        sections: parsedSections,
      });
    };

    fetchDegreeData();
    return () => {
      alive = false;
    };
  }, [degreeId]);

  if (!degree) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300/80 to-slate-400/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <HiAcademicCap className="w-12 h-12 text-slate-400 animate-pulse" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            {loadErr ? `Error: ${loadErr}` : "Loading degree details..."}
          </p>
        </div>
      </div>
    );
  }

  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 to-slate-400/40 dark:from-slate-950 dark:to-slate-900">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <main className="max-w-[1600px] mx-auto px-6 py-16">

        {/* Back Button */}
        <button
          onClick={goBack}
          className="group flex items-center gap-2 mb-12 px-4 py-2 rounded-xl
                   bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600
                   text-slate-700 dark:text-slate-300 font-semibold
                   hover:bg-slate-50 dark:hover:bg-slate-800
                   shadow-md hover:shadow-lg transition-all duration-200"
        >
          <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Back</span>
        </button>

        {/* Header Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 
                      shadow-2xl p-10 mb-14 ring-1 ring-slate-400/20 dark:ring-slate-500/20">
          <div className="flex items-start gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 
                          dark:from-blue-900/30 dark:to-indigo-900/30 shadow-md">
              <HiAcademicCap className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4 leading-tight">
                {degree.program_name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {degree.faculty && (
                  <span className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 
                         text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                    {degree.faculty}
                  </span>
                )}

                {degree.other_faculty && (
                  <span className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 
                         text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                    {degree.other_faculty}
                  </span>
                )}

                {degree.program_code && (
                  <span className="px-4 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 
                         text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-700">
                    Code: {degree.program_code}
                  </span>
                )}

                {degree.level && (
                  <span className="px-4 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 
                         text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-700">
                    {degree.level}
                  </span>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex-shrink-0">
              <SaveButton
                itemType="degree"
                itemId={degreeId}
                itemName={degree.program_name}
                itemData={{
                  degree_code: degree.degree_code,
                  program_name: degree.program_name,
                  faculty: degree.faculty,
                  duration: degree.duration,
                  minimum_uoc: degree.minimum_uoc,
                  lowest_atar: degree.lowest_atar,
                  overview_description: degree.overview_description,
                }}
              />
            </div>

          </div>

          {/* Overview */}
          {degree.overview_description && (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {degree.overview_description}
              </p>
            </div>
          )}
        </div>

        {/* Smart Advisor */}
        <div
          ref={advisorRef}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20
                     rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 shadow-xl p-10 mb-14"
        >
          {loadingSummary ? (
            <div className="text-center">
              <div className="inline-block p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <HiSparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 font-semibold">
                Generating your personalized Smart Advisor summary...
              </p>
            </div>
          ) : advisorSummary ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <HiLightBulb className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  Smart Advisor Summary
                </h2>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-700">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {advisorSummary}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <HiLightBulb className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    Need Personalized Guidance?
                  </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Get an AI-powered summary of how this degree aligns with your goals, interests, and personality.
                </p>
              </div>

              <button
                onClick={fetchSmartAdvisor}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600
                           text-white font-bold text-base shadow-lg hover:shadow-xl
                           hover:from-emerald-600 hover:to-teal-700
                           transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <HiSparkles className="w-5 h-5" />
                Generate Smart Advisor
              </button>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {degree.duration && (
            <InfoCard
              icon={<HiClock className="w-6 h-6" />}
              label="Duration"
              value={`${degree.duration} year${degree.duration > 1 ? "s" : ""}`}
              gradient="from-slate-50 to-slate-100"
              darkGradient="from-slate-800/20 to-slate-700/20"
            />
          )}
          {degree.minimum_uoc && (
            <InfoCard
              icon={<HiChartBar className="w-6 h-6" />}
              label="Total UOC"
              value={`${degree.minimum_uoc} UOC`}
              gradient="from-slate-50 to-slate-100"
              darkGradient="from-slate-800/20 to-slate-700/20"
            />
          )}
          {degree.uac_code && (
            <InfoCard
              icon={<HiDocumentText className="w-6 h-6" />}
              label="UAC Code"
              value={degree.uac_code}
              gradient="from-slate-50 to-slate-100"
              darkGradient="from-slate-800/20 to-slate-700/20"
            />
          )}
          {degree.cricos_code && (
            <InfoCard
              icon={<HiLocationMarker className="w-6 h-6" />}
              label="CRICOS Code"
              value={degree.cricos_code}
              gradient="from-slate-50 to-slate-100"
              darkGradient="from-slate-800/20 to-slate-700/20"
            />
          )}
        </div>

        {/* Admission Requirements */}
        {(degree.lowest_selection_rank ||
          degree.lowest_atar ||
          degree.assumed_knowledge) && (
          <Section title="Admission Requirements" icon={<HiInformationCircle className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {degree.lowest_selection_rank && (
                <StatCard label="Lowest Selection Rank" value={degree.lowest_selection_rank} />
              )}
              {degree.lowest_atar && (
                <StatCard label="Lowest ATAR" value={degree.lowest_atar} />
              )}
              {degree.assumed_knowledge && (
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Assumed Knowledge
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {degree.assumed_knowledge}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Program Structure */}
        {degree.program_structure && (
          <Section title="Program Structure" icon={<HiCollection className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
                {degree.program_structure
                  .split(/\d+\.\s/)
                  .filter(Boolean)
                  .map((part, idx, arr) => {
                    const numbered = idx > 0 || arr.length > 1;
                    return (
                      <div key={idx} className={numbered ? "flex gap-4" : ""}>
                        {numbered && (
                          <span className="font-bold text-blue-700 dark:text-blue-400 min-w-[1.5rem]">
                            {idx + 1}.
                          </span>
                        )}
                        <p className="flex-1">{part.trim()}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Section>
        )}

        {/* Detailed Sections */}
        {degree.sections && degree.sections.length > 0 && (
          <Section title="Detailed Requirements" icon={<HiBookOpen className="w-6 h-6" />}>
            <div className="space-y-6">
              {degree.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {section.title}
                    </h3>
                    {section.uoc && (
                      <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 
                                     text-blue-700 dark:text-blue-300 text-sm font-bold border border-blue-200 dark:border-blue-700">
                        {section.uoc} UOC
                      </span>
                    )}
                  </div>

                  {section.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {section.description}
                    </p>
                  )}

                  {section.notes && (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 mb-4">
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <strong>Note:</strong> {section.notes}
                      </p>
                    </div>
                  )}

                  {section.courses?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {section.courses.map((course, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                {course.code}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {course.name}
                              </p>
                            </div>
                            {course.uoc > 0 && (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {course.uoc} UOC
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Career Outcomes */}
        {degree.career_outcomes && degree.career_outcomes.length > 0 && (
          <Section title="Career Outcomes" icon={<HiBriefcase className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {degree.career_outcomes.map((outcome, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 
                           dark:from-green-900/20 dark:to-emerald-900/20 
                           border border-green-200 dark:border-green-700"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {outcome}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Special Notes */}
        {degree.special_notes && (
          <Section title="Important Notes" icon={<HiInformationCircle className="w-6 h-6" />}>
            <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {degree.special_notes}
              </p>
            </div>
          </Section>
        )}

        {/* Source Link */}
        {degree.source_url && (
          <div className="mt-14 text-center">
            <a
              href={degree.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                       bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600
                       text-slate-700 dark:text-slate-300 font-semibold
                       hover:bg-slate-50 dark:hover:bg-slate-800
                       shadow-md hover:shadow-lg transition-all duration-200"
            >
              <HiDocumentText className="w-5 h-5" />
              View Official UNSW Handbook
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

// Section Wrapper
function Section({ title, icon, children }) {
  return (
    <div className="mb-14">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-slate-300 dark:border-slate-700">
        <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">{icon}</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoCard({ icon, label, value, gradient, darkGradient }) {
  return (
    <div
      className={`p-5 rounded-xl bg-gradient-to-br ${gradient} dark:bg-gradient-to-br dark:${darkGradient}
        border border-slate-100 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-slate-700 dark:text-slate-300">{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

export default DegreeDetailPage;

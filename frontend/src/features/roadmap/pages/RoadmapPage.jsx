// src/pages/RoadmapPage.jsx
import { useCallback, useEffect, useState } from "react";
import {
  HiArrowLeft,
  HiArrowRight,
  HiSearch,
  HiStar,
} from "react-icons/hi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import DegreeSelectorSection from "../components/DegreeSelectorSection";
import GenerateButton from "../components/GenerateButton";
import { useEnrolledProgram } from "../hooks/useEnrolledProgram";
import SpecialisationPicker from "../components/SpecialisationPicker";
import { fetchSavedChoices, saveChoices } from "../utils/programCourses";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";

function RoadmapPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const [selectedDegreeObject, setSelectedDegreeObject] = useState(null);
  const { program: enrolledProgram } = useEnrolledProgram();
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [searchParams] = useSearchParams();
  const presetCode = searchParams.get("program");
  const [choices, setChoices] = useState({});
  const [saving, setSaving] = useState(false);
  const selectedCode = selectedDegreeObject?.degree_code || null;
  const isChange = !!presetCode && presetCode === enrolledProgram?.degree_code;

  useEffect(() => {
    if (!presetCode) return;
    supabase
      .from("unsw_degrees_final")
      .select("*")
      .eq("degree_code", presetCode)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setSelectedDegreeId(data.id);
        setSelectedDegreeObject(data);
      });
  }, [presetCode]);

  useEffect(() => {
    if (!selectedCode || !userId) return;
    let active = true;
    setChoices({});
    fetchSavedChoices(selectedCode, userId).then((saved) => {
      if (active) setChoices(saved);
    });
    return () => { active = false; };
  }, [selectedCode, userId]);

  const openDrawer = useCallback(() => setIsMenuOpen(true), []);
  const closeDrawer = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (selectedDegreeId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedDegreeId]);

  const handleProceed = async () => {
    setSaving(true);
    try {
      await saveChoices(userId, choices);
    } catch (err) {
      console.error("Error saving specialisation:", err);
    }
    navigate("/roadmap-loading", {
      state: { type: "unsw", degree: { ...selectedDegreeObject, degree_id: selectedDegreeObject.id }, returnToStep: isChange ? 2 : null },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">

      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isMenuOpen} />
        <MenuBar isOpen={isMenuOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col h-full mx-6 sm:mx-12 lg:mx-20">

          {/* Header - Original Layout with Tag and Button on Right */}
          <div className="mt-8 mb-8">
            <button
              onClick={() => navigate(enrolledProgram ? "/roadmap-entryload" : "/dashboard")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <HiArrowLeft className="w-4 h-4" />
              {enrolledProgram ? "Back to my roadmap" : "Back to dashboard"}
            </button>
            <div className="flex items-end justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {isChange ? "Change your " : "Explore a "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                    {isChange ? "Specialisation" : "Different Degree"}
                  </span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isChange
                    ? "Pick your major or stream, then generate your roadmap again."
                    : "Pick a UNSW program and its major or stream, then generate its roadmap."}
                </p>
              </div>

              <div className="flex-shrink-0">
                <div className="relative">
                  {selectedDegreeId && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600 rounded-2xl blur-md opacity-30 animate-pulse pointer-events-none" />
                  )}
                  <GenerateButton onClick={handleProceed} disabled={!selectedDegreeId || saving}>
                    <span className="flex items-center gap-3">
                      {selectedDegreeId ? "Generate Roadmap" : "Select a degree first"}
                      <HiArrowRight className="w-5 h-5" />
                    </span>
                  </GenerateButton>
                </div>
              </div>
            </div>
          </div>

          {/* Selected degree confirmation banner */}
          {selectedDegreeId && selectedDegreeObject && (
            <div className="mb-6 flex items-center justify-between gap-4 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white">
                  <HiStar className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">Selected degree</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedDegreeObject.program_name || selectedDegreeObject.title || selectedDegreeObject.name}</p>
                </div>
              </div>
              {!isChange && (
                <button
                  onClick={() => { setSelectedDegreeId(null); setSelectedDegreeObject(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {selectedCode && (
            <div className="-mt-4 mb-6 px-5 pb-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <SpecialisationPicker key={selectedCode} degreeCode={selectedCode} value={choices} onChange={setChoices} />
            </div>
          )}

          {!isChange && (
          <div className="mb-20">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-lg backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 px-8 py-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/40">
                    <HiSearch className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Search UNSW programs</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Click a degree to select it</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <DegreeSelectorSection
                  selectedDegreeId={selectedDegreeId}
                  setSelectedDegreeId={setSelectedDegreeId}
                  setSelectedDegreeObject={setSelectedDegreeObject}
                />
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default RoadmapPage;
// src/pages/RoadmapPage.jsx
import { useCallback, useEffect, useState } from "react";
import { HiArrowRight } from "react-icons/hi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";
import { card } from "@/shared/ui/cardStyles";
import SectionHeading from "@/shared/ui/SectionHeading";
import DegreeSelectorSection from "../components/DegreeSelectorSection";
import { useEnrolledProgram } from "../hooks/useEnrolledProgram";
import SpecialisationPicker from "../components/SpecialisationPicker";
import { fetchSavedChoices, saveChoices } from "../utils/programCourses";
import { stepNumber } from "../utils/roadmapSteps";
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
      state: { type: "unsw", degree: { ...selectedDegreeObject, degree_id: selectedDegreeObject.id }, returnToStep: isChange ? stepNumber("structure") : null },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen app-page text-primary transition-colors duration-500">
      <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isMenuOpen} />
      <MenuBar isOpen={isMenuOpen} handleClose={closeDrawer} />

      <PageHeader
        back={{
          label: enrolledProgram ? "Back to my roadmap" : "Back to dashboard",
          onClick: () => navigate(enrolledProgram ? "/roadmap-entryload" : "/dashboard"),
        }}
        eyebrow={isChange ? "Your degree" : "Explore"}
        title={isChange ? "Change your specialisation" : "Explore a different degree"}
        subtitle={
          isChange
            ? "Pick your major or stream, then generate your roadmap again."
            : "Pick a UNSW program and its major or stream, then generate its roadmap."
        }
      />

      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-8 space-y-6">
        {selectedDegreeObject && (
          <section className={`${card} p-5 md:p-6`}>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink-muted">Selected degree</p>
            <div className="mt-2 flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
              <div className="min-w-0">
                <p className="text-xl font-bold text-ink-strong">
                  {selectedDegreeObject.program_name || selectedDegreeObject.title || selectedDegreeObject.name}
                </p>
                {selectedDegreeObject.faculty && (
                  <p className="mt-0.5 text-sm text-ink-muted">{selectedDegreeObject.faculty}</p>
                )}
              </div>
              {!isChange && (
                <button
                  onClick={() => { setSelectedDegreeId(null); setSelectedDegreeObject(null); }}
                  className="flex-shrink-0 text-sm font-semibold text-link hover:underline"
                >
                  Change degree
                </button>
              )}
            </div>

            <SpecialisationPicker key={selectedCode} degreeCode={selectedCode} value={choices} onChange={setChoices} />

            <div className="mt-6 pt-6 border-t border-line">
              <button
                onClick={handleProceed}
                disabled={saving}
                className="button-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
              >
                Generate roadmap
                <HiArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}

        {!isChange && (
          <section className={`${card} p-5 md:p-6`}>
            <SectionHeading subtitle="Click a degree to select it">Search UNSW programs</SectionHeading>
            <div className="mt-6">
              <DegreeSelectorSection
                selectedDegreeId={selectedDegreeId}
                setSelectedDegreeId={setSelectedDegreeId}
                setSelectedDegreeObject={setSelectedDegreeObject}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default RoadmapPage;
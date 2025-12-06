import { useEffect, useMemo, useState } from "react";
import { HiAcademicCap, HiArrowRight } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import ComparisonResults from "../components/compare/ComparisonResults";
import ProgramSelector from "../components/compare/ProgramSelector";

export default function ComparePage() {
  const navigate = useNavigate();
  const { session } = UserAuth();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // drawer state for hamburger
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // View mode 'selector' or 'results'
  const [viewMode, setViewMode] = useState("selector");

  // User
  const [userEnrolledProgram, setUserEnrolledProgram] = useState(null);
  const [completedCourses, setCompletedCourses] = useState([]);

  // Programs
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [searchTarget, setSearchTarget] = useState("");

  // Base program 
  const [baseProgram, setBaseProgram] = useState(null);
  const [baseSpecsOptions, setBaseSpecsOptions] = useState([]);
  const [baseSelectedSpecs, setBaseSelectedSpecs] = useState([]);

  // Target program
  const [targetProgram, setTargetProgram] = useState(null);
  const [targetSpecsOptions, setTargetSpecsOptions] = useState([]);
  const [targetSelectedSpecs, setTargetSelectedSpecs] = useState([]);

  // Results
  const [comparisonData, setComparisonData] = useState(null);

  // load user and check for saved target 
  useEffect(() => {
    if (!session?.user?.id) return;
    initializePage();
  }, [session]);

  const initializePage = async () => {
    try {
      setInitialLoading(true);
      const userId = session?.user?.id;
      if (!userId) return;

      // Fetch user's enrolled program (this is always the base program)
      const { data: programData } = await supabase
        .from("user_enrolled_program")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (programData) {
        setUserEnrolledProgram(programData);
        setBaseProgram({
          code: programData.degree_code,
          name: programData.program_name,
        });
        setBaseSelectedSpecs(programData.specialisation_codes || []);

        // Fetch base program specialisations to show their names
        await fetchSpecialisationsForProgram(programData.degree_code, true);
      }

      // Fetch completed courses
      const { data: completed } = await supabase
        .from("user_completed_courses")
        .select("*")
        .eq("user_id", userId)
        .eq("is_completed", true);

      setCompletedCourses(completed || []);

      // Check if user has a saved comparison target
      const { data: savedTarget } = await supabase
        .from("user_comparison_target")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (savedTarget) {
        // User has a saved target, load it and show comparison
        setTargetProgram({
          code: savedTarget.target_program_code,
          name: savedTarget.target_program_name || "",
        });
        setTargetSelectedSpecs(savedTarget.target_specialisation_codes || []);

        // Fetch specialisations for this target
        await fetchSpecialisationsForProgram(
          savedTarget.target_program_code,
          false
        );

        // Fetch comparison results
        await fetchComparisonResults(
          programData.degree_code,
          programData.specialisation_codes || [],
          savedTarget.target_program_code,
          savedTarget.target_specialisation_codes || []
        );

        setViewMode("results");
      } else {
        // No saved target, so show selector
        setViewMode("selector");
      }

      // Fetch available programs for selector
      await fetchAvailablePrograms();
    } catch (err) {
      setError("Failed to load your data");
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAvailablePrograms = async () => {
    try {
      const { data } = await supabase
        .from("unsw_degrees_final")
        .select("degree_code, program_name")
        .order("program_name");

      setAvailablePrograms(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSpecialisationsForProgram = async (degreeCode, isBase = true) => {
    try {
      // Check if this is a double degree and get both degree codes
      let codesToMatch = [degreeCode];

      const { data: degreeData } = await supabase
        .from("unsw_degrees_final")
        .select("program_name")
        .eq("degree_code", degreeCode)
        .single();

      if (degreeData?.program_name?.includes("/")) {
        const programNames = degreeData.program_name
          .split("/")
          .map((n) => n.trim());

        const { data: individualDegrees } = await supabase
          .from("unsw_degrees_final")
          .select("degree_code, program_name")
          .in("program_name", programNames);

        if (individualDegrees?.length > 0) {
          codesToMatch = individualDegrees.map((d) => d.degree_code);
        }
      }

      const { data: specs } = await supabase
        .from("unsw_specialisations")
        .select("major_code, major_name, specialisation_type, sections_degrees")
        .order("major_name");

      const filtered = (specs || []).filter((spec) => {
        try {
          const degrees =
            typeof spec.sections_degrees === "string"
              ? JSON.parse(spec.sections_degrees)
              : spec.sections_degrees;

          return degrees?.some((d) => codesToMatch.includes(d.degree_code));
        } catch {
          return false;
        }
      });

      if (isBase) {
        setBaseSpecsOptions(filtered);
      } else {
        setTargetSpecsOptions(filtered);
      }
    } catch (err) {
      console.error(err);
      if (isBase) {
        setBaseSpecsOptions([]);
      } else {
        setTargetSpecsOptions([]);
      }
    }
  };

  // Fetch comparison results
  const fetchComparisonResults = async (
    baseProgramCode,
    baseSpecs,
    targetProgramCode,
    targetSpecs
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/compare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: session.user.id,
            base_program_code: baseProgramCode,
            base_specialisation_codes: baseSpecs,
            target_program_code: targetProgramCode,
            target_specialisation_codes: targetSpecs,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);

      setComparisonData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to compare programs");
    } finally {
      setLoading(false);
    }
  };

  const filteredTargetPrograms = useMemo(
    () =>
      availablePrograms.filter(
        (p) =>
          p.program_name
            .toLowerCase()
            .includes(searchTarget.toLowerCase()) ||
          p.degree_code.toLowerCase().includes(searchTarget.toLowerCase())
      ),
    [availablePrograms, searchTarget]
  );

  const groupSpecsByType = (specs) => {
    const groups = {};
    specs.forEach((s) => {
      const type = s.specialisation_type || "Specialisation";
      if (!groups[type]) groups[type] = [];
      groups[type].push(s);
    });
    return groups;
  };

  const targetSpecsByType = useMemo(
    () => groupSpecsByType(targetSpecsOptions),
    [targetSpecsOptions]
  );

  // Actions
  const toggleSpec = (code, isBase = true) => {
    if (!isBase) {
      // Find the type of the clicked spec
      const clickedSpec = targetSpecsOptions.find(s => s.major_code === code);
      if (!clickedSpec) return;

      const clickedType = clickedSpec.specialisation_type;

      // Get all specs of the same type
      const specsOfSameType = targetSpecsOptions
        .filter(s => s.specialisation_type === clickedType)
        .map(s => s.major_code);

      setTargetSelectedSpecs((prev) => {
        // Remove all specs of the same type
        const withoutSameType = prev.filter(c => !specsOfSameType.includes(c));
        
        // If the clicked spec was already selected, just remove it (deselect)
        if (prev.includes(code)) {
          return withoutSameType;
        }
        
        // Otherwise, add the clicked spec (select new one)
        return [...withoutSameType, code];
      });
    }
  };

  const handleSaveAndCompare = async () => {
    if (!baseProgram || !targetProgram) {
      return setError("Please select a target program");
    }

    setLoading(true);
    setError(null);

    try {
      // Save target to database (upsert)
      const { error: saveError } = await supabase
        .from("user_comparison_target")
        .upsert(
          {
            user_id: session.user.id,
            target_program_code: targetProgram.code,
            target_program_name: targetProgram.name,
            target_specialisation_codes: targetSelectedSpecs,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (saveError) throw saveError;

      // Fetch comparison results
      await fetchComparisonResults(
        baseProgram.code,
        baseSelectedSpecs,
        targetProgram.code,
        targetSelectedSpecs
      );

      // Switch to results view
      setViewMode("results");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save and compare programs");
    } finally {
      setLoading(false);
    }
  };

  const handleReselectProgram = () => {
    setViewMode("selector");
    setTargetProgram(null);
    setTargetSelectedSpecs([]);
    setTargetSpecsOptions([]);
    setComparisonData(null);
    setSearchTarget("");
    setError(null);
  };

  // UI
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="fixed top-0 left-0 right-0 z-50">
          <DashboardNavBar onMenuClick={openDrawer} />
          <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
        </div>
        <div className="pt-16 sm:pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <HiAcademicCap className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Loading comparison data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">

        <div className="bg-gradient-to-b from-blue-50/10 via-transparent to-purple-50/10 dark:from-blue-950/5 dark:via-transparent dark:to-purple-950/5">
          <div className="flex flex-col justify-center h-full px-6 lg:px-10 xl:px-20">

            {/* BACK BUTTON */}
            <div className="mt-6">
              <button
                onClick={() => navigate("/progress")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md"
              >
                <HiArrowRight className="w-5 h-5 rotate-180" />
                <span>Back to Progress Page</span>
              </button>
            </div>

            {/* HEADER */}
            <div className="mt-6 mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
                Compare Programs
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mt-3 text-slate-900 dark:text-white">
                Program{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600">
                  Comparison
                </span>
              </h1>

              <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-3">
                See which courses transfer and what's needed to switch programs
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50/40 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm shadow">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <HiAcademicCap className="w-8 h-8 text-slate-400 animate-pulse" />
                </div>
              </div>
            )}

            {/* Program Selector View */}
            {!loading && viewMode === "selector" && (
              <ProgramSelector
                isBase={false}
                searchValue={searchTarget}
                setSearchValue={setSearchTarget}
                filteredPrograms={filteredTargetPrograms}
                program={targetProgram}
                onSelectProgram={async (p) => {
                  if (!p) {
                    // Clear selection
                    setTargetProgram(null);
                    setTargetSelectedSpecs([]);
                    setTargetSpecsOptions([]);
                    return;
                  }
                  setTargetProgram({ code: p.degree_code, name: p.program_name });
                  setTargetSelectedSpecs([]);
                  await fetchSpecialisationsForProgram(p.degree_code, false);
                }}
                specsOptions={targetSpecsOptions}
                specsByType={targetSpecsByType}
                selectedSpecs={targetSelectedSpecs}
                toggleSpec={toggleSpec}
                goNext={handleSaveAndCompare}
                navigate={navigate}
                baseProgram={baseProgram}
                baseSpecsOptions={baseSpecsOptions}
                baseSelectedSpecs={baseSelectedSpecs}
              />
            )}

            {/* Comparison Results View */}
            {!loading && viewMode === "results" && comparisonData && (
              <ComparisonResults
                comparisonData={comparisonData}
                onReselect={handleReselectProgram}
                baseSelectedSpecs={baseSelectedSpecs}
                targetSelectedSpecs={targetSelectedSpecs}
                baseSpecsOptions={baseSpecsOptions}
                targetSpecsOptions={targetSpecsOptions}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
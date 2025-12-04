import { useEffect, useMemo, useState } from "react";
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
  const [setUserEnrolledProgram] = useState(null);
  const [setCompletedCourses] = useState([]);

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
      setTargetSelectedSpecs((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-100">
        <div className="fixed top-0 left-0 right-0 z-50">
          <DashboardNavBar onMenuClick={openDrawer} />
          <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
        </div>
        <div className="pt-16 sm:pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-100">
      
      {/* Dashboard Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 pt-24 sm:pt-28">
        
        {/* Error */}
        {error && (
          <div
            className="max-w-3xl mx-auto mb-6 p-4 
            bg-red-50 dark:bg-red-900/30 
            border border-red-200 dark:border-red-800 
            rounded-lg text-red-700 dark:text-red-300 text-sm"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
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
  );
}

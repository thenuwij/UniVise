import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

import { DashboardNavBar } from "../components/DashboardNavBar";
import StepIndicator from "../components/compare/StepIndicator";
import ProgramSelector from "../components/compare/ProgramSelector";
import ComparisonResults from "../components/compare/ComparisonResults";

export default function ComparePage() {
  const navigate = useNavigate();
  const { session } = UserAuth();

  const [step, setStep] = useState(2);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // User
  const [userEnrolledProgram, setUserEnrolledProgram] = useState(null);
  const [completedCourses, setCompletedCourses] = useState([]);

  // Programs
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [searchBase, setSearchBase] = useState("");
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

  // ---------------------------------------------------------------------------
  // Load user + programs
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchUserData();
    fetchAvailablePrograms();
  }, [session]);

  const fetchUserData = async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: programData } = await supabase
        .from("user_enrolled_program")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (programData) {
        setUserEnrolledProgram(programData);
        
        const program = {
          code: programData.degree_code,
          name: programData.program_name,
        };
        setBaseProgram(program);
        setBaseSelectedSpecs(programData.specialisation_codes || []);
        await fetchSpecialisationsForProgram(program.code, true);
      }

      const { data: completed } = await supabase
        .from("user_completed_courses")
        .select("*")
        .eq("user_id", userId)
        .eq("is_completed", true);

      setCompletedCourses(completed || []);

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

  // ---------------------------------------------------------------------------
  // Specialisations
  // ---------------------------------------------------------------------------

  const fetchSpecialisationsForProgram = async (degreeCode, isBase = true) => {
    try {
      // Check if this is a double degree
      let codesToMatch = [degreeCode];

      const { data: degreeData } = await supabase
        .from("unsw_degrees_final")
        .select("program_name")
        .eq("degree_code", degreeCode)
        .single();

      if (degreeData?.program_name?.includes("/")) {
        // It's a double degree - get individual program codes
        const programNames = degreeData.program_name.split("/").map(n => n.trim());

        const { data: individualDegrees } = await supabase
          .from("unsw_degrees_final")
          .select("degree_code, program_name")
          .in("program_name", programNames);

        if (individualDegrees?.length > 0) {
          codesToMatch = individualDegrees.map(d => d.degree_code);
        }
      }

      const { data: specs } = await supabase
        .from("unsw_specialisations")
        .select("major_code, major_name, specialisation_type, sections_degrees")
        .order("major_name");

      const filtered = (specs || []).filter((spec) => {
        try {
          const degrees = typeof spec.sections_degrees === "string"
            ? JSON.parse(spec.sections_degrees)
            : spec.sections_degrees;

          return degrees?.some((d) => codesToMatch.includes(d.degree_code));
        } catch {
          return false;
        }
      });

      if (isBase) setBaseSpecsOptions(filtered);
      else setTargetSpecsOptions(filtered);

    } catch (err) {
      console.error(err);
      if (isBase) setBaseSpecsOptions([]);
      else setTargetSpecsOptions([]);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived lists
  // ---------------------------------------------------------------------------

  const filteredBasePrograms = useMemo(
    () =>
      availablePrograms.filter(
        (p) =>
          p.program_name.toLowerCase().includes(searchBase.toLowerCase()) ||
          p.degree_code.toLowerCase().includes(searchBase.toLowerCase())
      ),
    [availablePrograms, searchBase]
  );

  const filteredTargetPrograms = useMemo(
    () =>
      availablePrograms.filter(
        (p) =>
          p.program_name.toLowerCase().includes(searchTarget.toLowerCase()) ||
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

  const baseSpecsByType = useMemo(
    () => groupSpecsByType(baseSpecsOptions),
    [baseSpecsOptions]
  );

  const targetSpecsByType = useMemo(
    () => groupSpecsByType(targetSpecsOptions),
    [targetSpecsOptions]
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleUseCurrentProgram = async () => {
    if (!userEnrolledProgram) return;
    const program = {
      code: userEnrolledProgram.degree_code,
      name: userEnrolledProgram.program_name,
    };
    setBaseProgram(program);

    const selected = userEnrolledProgram.specialisation_codes || [];
    setBaseSelectedSpecs(selected);

    await fetchSpecialisationsForProgram(program.code, true);
  };

  const toggleSpec = (code, isBase = true) => {
    if (isBase) {
      setBaseSelectedSpecs((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
    } else {
      setTargetSelectedSpecs((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
    }
  };

  const handleComparePrograms = async () => {
    if (!baseProgram || !targetProgram)
      return setError("Please select both programs");

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          base_program_code: baseProgram.code,
          base_specialisation_codes: baseSelectedSpecs,
          target_program_code: targetProgram.code,
          target_specialisation_codes: targetSelectedSpecs,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);

      setComparisonData(data);
      setStep(3);

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to compare programs");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-100">

      {/* Dashboard Navbar */}
      <DashboardNavBar />

      <div className="max-w-7xl mx-auto py-8 px-4">

        <StepIndicator step={step} />

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-4 
            bg-red-50 dark:bg-red-900/30 
            border border-red-200 dark:border-red-800 
            rounded-lg text-red-700 dark:text-red-300 text-sm"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {(loading || initialLoading) && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
          </div>
        )}

        {/* Steps */}
        {!loading && step === 1 && (
          <ProgramSelector
            isBase={true}
            searchValue={searchBase}
            setSearchValue={setSearchBase}
            filteredPrograms={filteredBasePrograms}
            program={baseProgram}
            onSelectProgram={async (p) => {
              setBaseProgram({ code: p.degree_code, name: p.program_name });
              setBaseSelectedSpecs([]);
              await fetchSpecialisationsForProgram(p.degree_code, true);
            }}
            specsOptions={baseSpecsOptions}
            specsByType={baseSpecsByType}
            selectedSpecs={baseSelectedSpecs}
            toggleSpec={toggleSpec}
            goNext={() => setStep(2)}
            navigate={navigate}
            userEnrolledProgram={userEnrolledProgram}
            handleUseCurrentProgram={handleUseCurrentProgram}
          />
        )}

        {!loading && !initialLoading && step === 2 && (
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
            goNext={handleComparePrograms}
            navigate={navigate}
          />
        )}

        {!loading && !initialLoading && step === 3 && (
          <ComparisonResults
            comparisonData={comparisonData}
            setStep={setStep}
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

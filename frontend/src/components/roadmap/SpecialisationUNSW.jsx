import { Award, BookOpen, Check, ChevronDown, GraduationCap, Info, Layers, RefreshCw, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SaveButton from "../../components/SaveButton";
import { supabase } from "../../supabaseClient";
import GeneratingMessage from "./GeneratingMessage";


export default function SpecialisationUNSW({ degreeCode }) {
  const [specialisations, setSpecialisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const [degreeCodes, setDegreeCodes] = useState([]);
  const [degreeNames, setDegreeNames] = useState({}); 

  // selector popover state
  const [openType, setOpenType] = useState(null);

  // Selected specialisations
  const [selectedHonours, setSelectedHonours] = useState({});
  const [selectedMajor, setSelectedMajor] = useState({});
  const [selectedMinor, setSelectedMinor] = useState({});

  const parseJSON = (text) => {
    try {
      return typeof text === "string" ? JSON.parse(text) : text;
    } catch {
      return [];
    }
  };

  const allCourses = useMemo(() => {
    const codes = [];
    
    // Iterate through each degree code
    degreeCodes.forEach(degreeCode => {
    
      // Get all selected specialisations for this degree
      const selections = [
        selectedHonours[degreeCode],
        selectedMajor[degreeCode],
        selectedMinor[degreeCode]
      ].filter(Boolean); 
      
      // Extract courses from each selection
      selections.forEach(spec => {
        const sections = parseJSON(spec.sections);
        if (Array.isArray(sections)) {
          sections.forEach(section => {
            if (section.courses && Array.isArray(section.courses)) {
              section.courses.forEach(course => {
                if (course.code) {
                  codes.push(course.code);
                }
              });
            }
          });
        }
      });
    });
    
    // Return unique codes only
    return Array.from(new Set(codes));
  }, [degreeCodes, selectedHonours, selectedMajor, selectedMinor]);

  const handleVisualise = () => {
    if (!degreeCode || !allCourses.length) return;
    localStorage.setItem("programCourses", JSON.stringify(allCourses));
    navigate(`/planner/mindmesh?program=${degreeCode}`);
  };

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Fetch related specialisations and user's saved selections
  useEffect(() => {
    const fetchData = async () => {
      if (!degreeCode || !userId) return;

      setLoading(true);
      setError("");

      try {
        let codesToFetch = [degreeCode];
        const codeToNameMap = {};

        const { data: degreeData } = await supabase
          .from("unsw_degrees_final")
          .select("program_name")
          .eq("degree_code", degreeCode)
          .single();

        if (degreeData?.program_name?.includes("/")) {
          const programNames = degreeData.program_name.split("/").map(n => n.trim());

          // Fetch individual degree codes
          const { data: individualDegrees } = await supabase
            .from("unsw_degrees_final")
            .select("degree_code, program_name")
            .in("program_name", programNames);

          if (individualDegrees?.length > 0) {
            codesToFetch = individualDegrees.map(d => d.degree_code);
            individualDegrees.forEach(d => {
              codeToNameMap[d.degree_code] = d.program_name;
            });
          }
        } else if (degreeData?.program_name) {
          codeToNameMap[degreeCode] = degreeData.program_name;
        }

        setDegreeCodes(codesToFetch);
        setDegreeNames(codeToNameMap);

        // Fetch specialisations for all degree codes
        const allSpecs = [];

        for (const code of codesToFetch) {
          const filter = JSON.stringify([{ degree_code: code }]);
          const { data: specsData, error: specsError } = await supabase
            .from("unsw_specialisations")
            .select("*")
            .contains("sections_degrees", filter);

          if (specsError) throw specsError;

          // Tag each spec with its degree code for grouping
          const taggedSpecs = (specsData || []).map(s => ({ ...s, _degreeCode: code }));
          allSpecs.push(...taggedSpecs);
        }

        setSpecialisations(allSpecs);

        // Load user's saved selections for each degree code
        const newHonours = {};
        const newMajor = {};
        const newMinor = {};

        for (const code of codesToFetch) {
          const { data: selectionData, error: selectionError } = await supabase
            .from("user_specialisation_selections")
            .select(`
              honours_id,
              major_id,
              minor_id,
              honours:honours_id(*),
              major:major_id(*),
              minor:minor_id(*)
            `)
            .eq("user_id", userId)
            .eq("degree_code", code)
            .maybeSingle();

          if (selectionError && selectionError.code !== "PGRST116") {
            throw selectionError;
          }

          if (selectionData) {
            if (selectionData.honours_id) {
              const honours = allSpecs.find(s => s.id === selectionData.honours_id);
              if (honours) newHonours[code] = honours;
            }
            if (selectionData.major_id) {
              const major = allSpecs.find(s => s.id === selectionData.major_id);
              if (major) newMajor[code] = major;
            }
            if (selectionData.minor_id) {
              const minor = allSpecs.find(s => s.id === selectionData.minor_id);
              if (minor) newMinor[code] = minor;
            }
          }
        }

        setSelectedHonours(newHonours);
        setSelectedMajor(newMajor);
        setSelectedMinor(newMinor);

      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message || "Failed to load specialisations.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [degreeCode, userId]);

  const saveSelection = async (type, specId, forDegreeCode) => {
    if (!userId || !forDegreeCode) return;

    try {
      const updateData = {
        user_id: userId,
        degree_code: forDegreeCode,
        honours_id: type === "honours" ? specId : selectedHonours[forDegreeCode]?.id || null,
        major_id: type === "major" ? specId : selectedMajor[forDegreeCode]?.id || null,
        minor_id: type === "minor" ? specId : selectedMinor[forDegreeCode]?.id || null,
      };

      const { error } = await supabase
        .from("user_specialisation_selections")
        .upsert(updateData, { onConflict: "user_id,degree_code" });

      if (error) throw error;
    } catch (err) {
      console.error("Save error:", err.message);
    }
  };

  const handleSelectionChange = async (type, spec, forDegreeCode) => {
    if (type === "honours") {
      setSelectedHonours(prev => ({ ...prev, [forDegreeCode]: spec }));
      await saveSelection("honours", spec?.id || null, forDegreeCode);
    } else if (type === "major") {
      setSelectedMajor(prev => ({ ...prev, [forDegreeCode]: spec }));
      await saveSelection("major", spec?.id || null, forDegreeCode);
    } else if (type === "minor") {
      setSelectedMinor(prev => ({ ...prev, [forDegreeCode]: spec }));
      await saveSelection("minor", spec?.id || null, forDegreeCode);
    }
    setOpenType(null);
  };

  const handleCourseClick = async (course) => {
    if (!course?.code) return;
    try {
      const { data: match } = await supabase
        .from("unsw_courses")
        .select("id")
        .eq("code", course.code)
        .maybeSingle();

      if (match?.id) {
        navigate(`/course/${match.id}`);
      } else {
        navigate(`/course/${course.code}`);
      }
    } catch (err) {
      console.error("Error navigating to course:", err.message);
    }
  };

  const getGroupedByType = (forDegreeCode) => {
    const filtered = specialisations.filter(s => s._degreeCode === forDegreeCode);
    return {
      Honours: filtered.filter((s) => s.specialisation_type === "Honours"),
      Major: filtered.filter((s) => s.specialisation_type === "Major"),
      Minor: filtered.filter((s) => s.specialisation_type === "Minor"),
    };
  };


  const hasAnySelection = () => {
    const hasHonours = Object.values(selectedHonours).some(v => v !== null);
    const hasMajor = Object.values(selectedMajor).some(v => v !== null);
    const hasMinor = Object.values(selectedMinor).some(v => v !== null);
    return hasHonours || hasMajor || hasMinor;
  };

  const renderTypeSelector = (type, options, selected, forDegreeCode) => {
    if (options.length === 0) return null;

    const popoverKey = `${forDegreeCode}-${type.toLowerCase()}`;
    const isOpen = openType === popoverKey;

    const getIcon = () => {
      if (type === "Honours") return <Award className="h-4 w-4" />;
      if (type === "Major") return <GraduationCap className="h-4 w-4" />;
      return <BookOpen className="h-4 w-4" />;
    };

    return (
      <div className="relative">
        <button
          onClick={() => setOpenType(isOpen ? null : popoverKey)}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all duration-200 shadow-md hover:shadow-lg
          ${
            selected
              ? "border-emerald-500 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40"
              : isOpen
              ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
          }`}
        >
          <div className="text-left flex-1">
            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {type}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
              {selected ? selected.major_name : `Select ${type}`}
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

       {isOpen && (
          <div className="absolute z-20 mt-2 w-full rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-xl max-h-64 overflow-y-auto">
            {options.map((spec) => (
              <button
                key={spec.id}
                onClick={() => handleSelectionChange(type.toLowerCase(), spec, forDegreeCode)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors
                          hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                          ${selected?.id === spec.id ? "bg-emerald-50 dark:bg-emerald-900/30 font-bold text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200 font-medium"}`}
              >
                <span className="line-clamp-1">{spec.major_name}</span>
                {selected?.id === spec.id && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // UPDATED: Render selected specialisations card with degree code
  const renderSelectedCard = (spec, type, forDegreeCode) => {
    if (!spec) return null;

    const sections = parseJSON(spec.sections);

    // Remove duplicate "Overview" section
    const filteredSections = Array.isArray(sections)
      ? sections.filter((sec) => {
          const isOverview = sec?.title?.toLowerCase().includes("overview");
          const isDuplicate =
            isOverview &&
            spec.overview_description &&
            sec?.description &&
            sec.description.trim().substring(0, 100) ===
              spec.overview_description.trim().substring(0, 100);
          return !isDuplicate;
        })
      : [];


    return (
      <div className="rounded-xl border-2 border-slate-300 dark:border-slate-600 
                      bg-white dark:bg-slate-900
                      shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        
        <div className="p-6">
          {/* Header */}
         <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {spec.major_name}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
              {spec.specialisation_type}
              {spec.faculty && (
                <span className="ml-2">• {spec.faculty.replace(/^Faculty of\s+/i, "")}</span>
              )}
            </p>
          </div>

          {/* RIGHT-SIDE BUTTON COLUMN */}
          <div className="flex flex-col items-end gap-2">
            <SaveButton
              itemType="specialisation"
              itemId={spec.id}
              itemName={spec.major_name}
              itemData={{
                type: spec.specialisation_type,
                uoc_required: spec.uoc_required,
                faculty: spec.faculty,
                overview: spec.overview_description,
                degree_code: forDegreeCode,
              }}
            />

            <button
              onClick={() => handleSelectionChange(type, null, forDegreeCode)}
              className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 
                      dark:hover:bg-red-900/20 transition-colors"
              title="Remove selection"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>


          {/* Overview */}
          {spec.overview_description && (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4 
                        p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 
                        border-2 border-slate-200 dark:border-slate-700">
              {spec.overview_description}
            </p>
          )}

          {/* UOC Badge */}
          {spec.uoc_required && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold
                             bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300
                             border-2 border-emerald-300 dark:border-emerald-700 shadow-sm">
                {spec.uoc_required} UOC Required
              </span>
            </div>
          )}

          {/* Structure */}
          {filteredSections && filteredSections.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer flex items-center justify-between gap-3 select-none mb-4
                                px-5 py-4 rounded-xl
                                bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20
                                border-2 border-emerald-300 dark:border-emerald-700
                                hover:border-emerald-400 dark:hover:border-emerald-600
                                hover:shadow-md hover:from-emerald-100 hover:to-teal-100
                                dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30
                                transition-all duration-200 list-none">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-800/40">
                    <ChevronDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-open:rotate-180 transition-transform" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                      Click to View Program Structure
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      {filteredSections.length} {filteredSections.length === 1 ? 'section' : 'sections'} with course details
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full
                              bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-300 dark:border-emerald-700 shadow-sm">
                  Expand ▼
                </span>
              </summary>
              
              <div className="space-y-4 pl-2 mt-4">
                {filteredSections.map((sec, i) => (
                  <div key={i} className="rounded-xl border-2 border-slate-300 dark:border-slate-600 
                                         bg-white dark:bg-slate-900
                                         p-5 shadow-md">
                    <h5 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {sec.title}
                    </h5>
                    {sec.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed font-medium">
                        {sec.description}
                      </p>
                    )}
                    {sec.courses && sec.courses.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                          {sec.courses.length} {sec.courses.length === 1 ? 'Course' : 'Courses'}:
                        </p>
                        {sec.courses.map((c) => (
                          <button
                            key={c.code}
                            onClick={() => handleCourseClick(c)}
                            className="group w-full text-left flex items-center justify-between gap-3 rounded-lg
                                    bg-white dark:bg-slate-800
                                    border-2 border-slate-300 dark:border-slate-600
                                    p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                                    hover:border-emerald-400 dark:hover:border-emerald-500 
                                    hover:shadow-md transition-all duration-200 cursor-pointer"
                          >
                            <span className="flex-shrink-0 text-xs font-mono font-bold
                                            text-emerald-700 dark:text-emerald-400 
                                            bg-emerald-100 dark:bg-emerald-900/40
                                            px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700">
                              {c.code}
                            </span>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                                {c.name}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-xs font-bold text-slate-600 dark:text-slate-400">
                              {c.uoc} UOC
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Handbook Link */}
          {spec.source_url && (
            <a
              href={spec.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold
                       text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300
                       transition-colors"
            >
              View on UNSW Handbook →
            </a>
          )}
        </div>
      </div>
    );
  };

  // Render selectors for a specific degree
  const renderDegreeSection = (forDegreeCode) => {
    const groupedByType = getGroupedByType(forDegreeCode);
    const hasSpecs = groupedByType.Honours.length > 0 || 
                     groupedByType.Major.length > 0 || 
                     groupedByType.Minor.length > 0;

    if (!hasSpecs) return null;

    return (
      <div key={forDegreeCode} className="space-y-6">

        {/* Degree header for double degrees */}
        {degreeCodes.length > 1 && (
          <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {degreeNames[forDegreeCode] || `Program ${forDegreeCode}`}
            </h3>
          </div>
        )}

        {/* Selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderTypeSelector("Honours", groupedByType.Honours, selectedHonours[forDegreeCode], forDegreeCode)}
          {renderTypeSelector("Major", groupedByType.Major, selectedMajor[forDegreeCode], forDegreeCode)}
          {renderTypeSelector("Minor", groupedByType.Minor, selectedMinor[forDegreeCode], forDegreeCode)}
        </div>

        {/* Selected cards for this degree */}
        {(selectedHonours[forDegreeCode] || selectedMajor[forDegreeCode] || selectedMinor[forDegreeCode]) && (
          <div className="space-y-5 pt-2">
            {selectedHonours[forDegreeCode] && renderSelectedCard(selectedHonours[forDegreeCode], "honours", forDegreeCode)}
            {selectedMajor[forDegreeCode] && renderSelectedCard(selectedMajor[forDegreeCode], "major", forDegreeCode)}
            {selectedMinor[forDegreeCode] && renderSelectedCard(selectedMinor[forDegreeCode], "minor", forDegreeCode)}
          </div>
        )}
      </div>
    );
  };

  // Loading/Error states
  if (loading)
    return (
      <GeneratingMessage
        title="Loading Specialisations..."
        message="Fetching related majors, minors, or honours options."
      />
    );

  if (error)
    return (
      <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
    );

  if (specialisations.length === 0)
    return (
      <p className="text-slate-600 dark:text-slate-400 text-sm italic">
        No specialisations available for this degree.
      </p>
    );

  // Final Render
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 p-6 shadow-xl space-y-6">
      {/* Top Accent Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl pointer-events-none" />
      
     {/* Header - COMPACT */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-6 py-4 -mx-6 -mt-6 mb-4 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">
        
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
        
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
              <GraduationCap className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Specialisations
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!hasAnySelection()}
              onClick={async () => {
                console.log("CUSTOMISE BUTTON CLICKED");
                
                if (!userId || !degreeCode) {
                  console.log("Missing userId or degreeCode:", { userId, degreeCode });
                  return;
                }
                
                try {
                  console.log("Fetching degree with code:", degreeCode);
                  
                  const { data: degreeData, error } = await supabase
                    .from("unsw_degrees_final")
                    .select("*")
                    .eq("degree_code", degreeCode)
                    .single();

                  if (error || !degreeData) {
                    console.error("Could not fetch degree:", error?.message);
                    return;
                  }
                  
                  const stateToPass = { 
                    type: "unsw", 
                    degree: {
                      ...degreeData,
                      degree_id: degreeData.id,
                    },
                    isRegeneration: true,
                  };
                  
                  console.log("NAVIGATING WITH STATE:", stateToPass);
                  console.log("isRegeneration:", stateToPass.isRegeneration);
                  
                  navigate("/roadmap-loading", {
                    state: stateToPass,
                    replace: true,
                  });

                } catch (err) {
                  console.error("Error:", err.message);
                }
              }}
              id="customise-btn"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all duration-200
                ${hasAnySelection()
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-105"
                  : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70"}`}
            >
              <RefreshCw className="h-5 w-5" />
              Customise Roadmap to Specialisation
            </button>

            <button
              onClick={handleVisualise}
              disabled={!allCourses.length}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all duration-200
                        bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
                        hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 hover:scale-105
                        disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Layers className="h-5 w-5" />
              Visualise Courses
            </button>
          </div>
        </div>
      </div>

      {/* QUICK GUIDE - COMPACT */}
      <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 shadow-md">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Quick Guide</h4>
            <div className="space-y-1">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                • Select specialisations from the dropdowns below (auto-saved)
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                • Expand cards to view structure and click courses for details
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                • Click <span className="text-blue-600 dark:text-blue-400 font-bold">'Visualise Courses'</span> to map course connections
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                • Click <span className="text-emerald-600 dark:text-emerald-400 font-bold">'Customise Roadmap'</span> to regnerate the roadmap and tailor Societies, Industry & Careers sections to your selected specialisations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Specialisation Sections */}
      <div className="space-y-6">
        {degreeCodes.map(code => renderDegreeSection(code))}
      </div>
    </div>
  );
}
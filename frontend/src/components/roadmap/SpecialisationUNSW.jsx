import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import GeneratingMessage from "./GeneratingMessage";
import { Info, Award, BookOpen, GraduationCap, X, RefreshCw, ChevronDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SaveButton from "../../components/SaveButton";


export default function SpecialisationUNSW({ degreeCode, onRegenerationStart }) {
  const [specialisations, setSpecialisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  // selector popover state
  const [openType, setOpenType] = useState(null);

  // Selected specialisations - loaded from database
  const [selectedHonours, setSelectedHonours] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedMinor, setSelectedMinor] = useState(null);

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
        // available specialisations for this degree
        const filter = JSON.stringify([{ degree_code: degreeCode }]);
        const { data: specsData, error: specsError } = await supabase
          .from("unsw_specialisations")
          .select("*")
          .contains("sections_degrees", filter);

        if (specsError) throw specsError;
        setSpecialisations(specsData || []);

        // user's saved selections
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
          .eq("degree_code", degreeCode)
          .maybeSingle();

        if (selectionError && selectionError.code !== "PGRST116") {
          throw selectionError;
        }

        // set selected specialisations from database
        if (selectionData) {
          if (selectionData.honours_id) {
            const honours = specsData.find(s => s.id === selectionData.honours_id);
            setSelectedHonours(honours || null);
          }
          if (selectionData.major_id) {
            const major = specsData.find(s => s.id === selectionData.major_id);
            setSelectedMajor(major || null);
          }
          if (selectionData.minor_id) {
            const minor = specsData.find(s => s.id === selectionData.minor_id);
            setSelectedMinor(minor || null);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message || "Failed to load specialisations.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [degreeCode, userId]);

  const saveSelection = async (type, specId) => {
    if (!userId || !degreeCode) return;

    try {
      const updateData = {
        user_id: userId,
        degree_code: degreeCode,
        honours_id: type === "honours" ? specId : selectedHonours?.id || null,
        major_id: type === "major" ? specId : selectedMajor?.id || null,
        minor_id: type === "minor" ? specId : selectedMinor?.id || null,
      };

      const { error } = await supabase
        .from("user_specialisation_selections")
        .upsert(updateData, { onConflict: "user_id,degree_code" });

      if (error) throw error;
    } catch (err) {
      console.error("Save error:", err.message);
    }
  };

  // Handle selection change
  const handleSelectionChange = async (type, spec) => {
    if (type === "honours") {
      setSelectedHonours(spec);
      await saveSelection("honours", spec?.id || null);
    } else if (type === "major") {
      setSelectedMajor(spec);
      await saveSelection("major", spec?.id || null);
    } else if (type === "minor") {
      setSelectedMinor(spec);
      await saveSelection("minor", spec?.id || null);
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

  // Group by type
  const groupedByType = {
    Honours: specialisations.filter((s) => s.specialisation_type === "Honours"),
    Major: specialisations.filter((s) => s.specialisation_type === "Major"),
    Minor: specialisations.filter((s) => s.specialisation_type === "Minor"),
  };

  // Safe JSON parser
  const parseJSON = (text) => {
    try {
      return typeof text === "string" ? JSON.parse(text) : text;
    } catch {
      return [];
    }
  };

  // Selector card (replaces plain <select>, keeps bottom section unchanged)
  const renderTypeSelector = (type, options, selected) => {
    if (options.length === 0) return null;

    const isOpen = openType === type.toLowerCase();

    const getIcon = () => {
      if (type === "Honours") return <Award className="h-4 w-4" />;
      if (type === "Major") return <GraduationCap className="h-4 w-4" />;
      return <BookOpen className="h-4 w-4" />;
    };

    return (
      <div className="relative">
        <button
          onClick={() => setOpenType(isOpen ? null : type.toLowerCase())}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md
          ${
            selected
              ? "border-emerald-500 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40"
              : isOpen
              ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30">
              {React.cloneElement(getIcon(), { className: "h-[18px] w-[18px] text-sky-700 dark:text-sky-400" })}
            </div>
            <div className="text-left">
              <div className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {type}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selected ? selected.major_name : `Select ${type}`}
              </div>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

       {isOpen && (
          <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-64 overflow-y-auto">
            {options.map((spec) => (
              <button
                key={spec.id}
                onClick={() => handleSelectionChange(type.toLowerCase(), spec)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors
                          hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                          ${selected?.id === spec.id ? "bg-emerald-50 dark:bg-emerald-900/30 font-semibold text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200 font-medium"}`}
              >
                <span className="line-clamp-1">{spec.major_name}</span>
                {selected?.id === spec.id && <Check className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render selected specialisations card (unchanged)
  const renderSelectedCard = (spec, type) => {
    if (!spec) return null;

    const sections = parseJSON(spec.sections);

    // Remove duplicate "Overview" section if it's basically the same as the top overview_description
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
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 
                      bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-800/50
                      shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
        
        <div className="p-6">
          {/* Header */}
         <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {spec.major_name}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {spec.specialisation_type}
            </p>
            {spec.faculty && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {spec.faculty.replace(/^Faculty of\s+/i, "")}
              </p>
            )}
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
                degree_code: degreeCode,
              }}
            />

            <button
              onClick={() => handleSelectionChange(type, null)}
              className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 
                      dark:hover:bg-red-900/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>


          {/* Overview */}
          {spec.overview_description && (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4 
                        p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 
                        border border-slate-200/40 dark:border-slate-700/40">
              {spec.overview_description}
            </p>
          )}

          {/* UOC Badge */}
          {spec.uoc_required && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold
                             bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200
                             border border-sky-300/50 dark:border-sky-700/50">
                {spec.uoc_required}
              </span>
            </div>
          )}

          {/* Structure */}
          {filteredSections && filteredSections.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-bold text-sky-600 dark:text-sky-400 
                                hover:text-sky-700 dark:hover:text-sky-300
                                flex items-center gap-2 select-none mb-4
                                p-3 rounded-lg hover:bg-sky-50/50 dark:hover:bg-sky-900/20
                                transition-colors">
                <BookOpen className="h-4 w-4" />
                <span className="group-open:rotate-90 transition-transform">▶</span>
                View Program Structure ({filteredSections.length} sections)
              </summary>
              
              <div className="space-y-4 pl-2">
                {filteredSections.map((sec, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 
                                         bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900/30
                                         p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg 
                                    bg-gradient-to-br from-sky-100 to-indigo-100 
                                    dark:from-sky-900/30 dark:to-indigo-900/30
                                    flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sec.title}
                        </h5>
                        {sec.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                            {sec.description}
                          </p>
                        )}
                        {sec.courses && sec.courses.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                              Courses ({sec.courses.length}):
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {sec.courses.map((c) => (
                                <button
                                  key={c.code}
                                  onClick={() => handleCourseClick(c)}
                                  className="w-full text-left flex items-center justify-between gap-3 rounded-xl 
                                          bg-gradient-to-br from-white via-slate-50 to-slate-100 
                                          dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
                                          border border-slate-200/70 dark:border-slate-700/70
                                          p-3 hover:border-sky-400 dark:hover:border-sky-500 
                                          hover:bg-gradient-to-br hover:from-sky-50 hover:via-blue-50 hover:to-indigo-50
                                          dark:hover:from-sky-900/20 dark:hover:via-indigo-900/20 dark:hover:to-slate-900
                                          hover:shadow-lg transition-all duration-300 cursor-pointer"

                                >
                                  <span className="flex-shrink-0 text-xs font-mono font-bold
                                                  text-sky-800 dark:text-sky-300 
                                                  bg-gradient-to-r from-sky-100 to-indigo-100 dark:from-sky-900/40 dark:to-indigo-900/40
                                                  px-2.5 py-0.5 rounded-lg shadow-sm">
                                    {c.code}
                                  </span>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                                      {c.name}
                                    </p>
                                  </div>
                                  <span className="flex-shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {c.uoc} UOC
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
              className="inline-flex items-center gap-1 mt-4 text-xs font-semibold
                       text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300
                       transition-colors"
            >
              View on UNSW Handbook
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          )}
        </div>
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
      <p className="text-secondary italic">
        No specialisations found for this degree. For double degree programs please check the individual program roadmaps for exploring specialisations.
      </p>
    );

  // Final Render
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 p-8 shadow-xl space-y-8">
      {/* Top Accent Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-t-2xl pointer-events-none" />
      
     {/* Header with Customise Button */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-8 py-6 -mx-8 -mt-8 mb-6 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">
        
        {/* Very subtle gradient accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
              <GraduationCap className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Specialisations
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Customise your degree with majors, minors, or honours streams
              </p>
            </div>
          </div>

          {/* Customise Button */}
          <button
            disabled={!selectedHonours && !selectedMajor && !selectedMinor}
            onClick={async () => {
              if (!userId || !degreeCode) return;
              try {
                if (onRegenerationStart) onRegenerationStart();

                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/roadmap/refresh_sections`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ user_id: userId, degree_code: degreeCode }),
                });
                if (!res.ok) throw new Error(await res.text());
                console.log("Custom roadmap regeneration triggered");

                // Temporary visual feedback
                const btn = document.getElementById("customise-btn");
                if (btn) {
                  btn.classList.add("scale-95", "opacity-80");
                  setTimeout(() => btn.classList.remove("scale-95", "opacity-80"), 200);
                }
              } catch (err) {
                console.error("Regeneration error:", err.message);
              }
            }}
            id="customise-btn"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow-lg transition-all duration-200
              ${selectedHonours || selectedMajor || selectedMinor
                ? "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 hover:-translate-y-0.5"
                : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70"}`}
          >
            <RefreshCw className="h-4 w-4" />
            Customise Roadmap to Specialisation
          </button>
        </div>
      </div>


      {/* Intro Text */}
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        Select up to one specialisation of each type to tailor your degree. Each selection will show
        detailed course requirements and structure. Your selections are automatically saved.
      </p>

      {/* Selection cards (top section only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderTypeSelector("Honours", groupedByType.Honours, selectedHonours)}
        {renderTypeSelector("Major", groupedByType.Major, selectedMajor)}
        {renderTypeSelector("Minor", groupedByType.Minor, selectedMinor)}
      </div>

        {/* Info Section */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 
                        dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 
                        border border-slate-300/60 dark:border-slate-600/60 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
              <Info className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              Expand each specialisation below to explore its full structure and click on individual courses for more details. 
              Use the <span className="font-semibold text-slate-900 dark:text-slate-100">Customise Roadmap to Specialisation</span> button above to tailor the 
              <span className="font-semibold text-slate-900 dark:text-slate-100"> Societies</span>, 
              <span className="font-semibold text-slate-900 dark:text-slate-100"> Industry</span>, and 
              <span className="font-semibold text-slate-900 dark:text-slate-100"> Careers</span> sections to your chosen specialisations.
            </p>
          </div>
      </div>


      {/* Selected Specialisations (unchanged) */}
      {(selectedHonours || selectedMajor || selectedMinor) && (
        <div className="space-y-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" />
            Selected Specialisations
          </h3>
          {selectedHonours && renderSelectedCard(selectedHonours, "honours")}
          {selectedMajor && renderSelectedCard(selectedMajor, "major")}
          {selectedMinor && renderSelectedCard(selectedMinor, "minor")}
        </div>
      )}

    </div>
  );
}

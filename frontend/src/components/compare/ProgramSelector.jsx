import { useEffect, useMemo, useRef, useState } from "react";
import { HiCheckCircle, HiChevronDown, HiChevronUp, HiInformationCircle, HiSearch, HiX } from "react-icons/hi";

export default function ProgramSelector({
  isBase,
  searchValue,
  setSearchValue,
  filteredPrograms,
  program,
  onSelectProgram,
  specsOptions,
  specsByType,
  selectedSpecs,
  toggleSpec,
  goNext,
  navigate,
  baseProgram,
  baseSpecsOptions,
  baseSelectedSpecs,
}) {
  const selectedProgramRef = useRef(null);
  const [selectedFaculty, setSelectedFaculty] = useState("All");
  const [expandedType, setExpandedType] = useState(null);

  // Scroll to badge after program selected
  useEffect(() => {
    if (program && selectedProgramRef.current) {
      setTimeout(() => {
        selectedProgramRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [program]);

  // Reset faculty filter when search text changes
  useEffect(() => {
    setSelectedFaculty("All");
  }, [searchValue]);

  // Collapse all sections whenever program/specs change (start fresh, collapsed)
  useEffect(() => {
    setExpandedType(null);
  }, [program, specsOptions]);

  // --- Faculty filter ---
  const uniqueFaculties = useMemo(() => {
    const set = new Set(filteredPrograms.map((p) => p.faculty).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [filteredPrograms]);

  const displayedPrograms = useMemo(() => {
    if (selectedFaculty === "All") return filteredPrograms;
    return filteredPrograms.filter((p) => p.faculty === selectedFaculty);
  }, [filteredPrograms, selectedFaculty]);

  // --- Accordion helpers ---
  const specTypes = Object.keys(specsByType);

  const advanceToNext = (currentType) => {
    const idx = specTypes.indexOf(currentType);
    setExpandedType(idx < specTypes.length - 1 ? specTypes[idx + 1] : null);
  };

  const handleSpecClick = (code, type) => {
    const wasSelected = selectedSpecs.includes(code);
    toggleSpec(code, isBase);
    if (!wasSelected) advanceToNext(type);
  };

  const isSingleType = specTypes.length === 1;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Program selector card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-6">

        {/* Faculty chips — only when list is visible */}
        {uniqueFaculties.length > 1 && !program && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {uniqueFaculties.map((faculty) => (
              <button
                key={faculty}
                onClick={() => setSelectedFaculty(faculty)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedFaculty === faculty
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {faculty}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
          />
        </div>

        {/* Program list OR selected badge */}
        <div className="mt-4">
          {!program ? (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {displayedPrograms.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                  No programs found
                </div>
              ) : (
                displayedPrograms.map((p) => (
                  <button
                    key={p.degree_code}
                    onClick={() => onSelectProgram(p)}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800 transition-all"
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {p.program_name}
                    </div>
                    {p.faculty && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {p.faculty}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div
              ref={selectedProgramRef}
              className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700"
            >
              <div className="flex items-center gap-3">
                <HiCheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{program.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">{program.code}</div>
                </div>
              </div>
              <button
                onClick={() => onSelectProgram(null)}
                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold"
              >
                <HiX className="w-4 h-4" />
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Specialisations ── */}
      {program && specsOptions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Specialisations (Optional)
            </h2>
            <div className="relative group inline-flex items-center">
              <HiInformationCircle className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-relaxed">
                A Major is your primary area of focus within your degree. A Minor is a secondary area of study. These are optional — skip if you are unsure.
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
            Select one from each category if applicable
          </p>

          {isSingleType ? (
            /* ── Single type: no accordion chrome ── */
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {specsByType[specTypes[0]].map((spec) => {
                  const isSelected = selectedSpecs.includes(spec.major_code);
                  return (
                    <button
                      key={spec.major_code}
                      onClick={() => handleSpecClick(spec.major_code, specTypes[0])}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-md"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-bold text-sm text-slate-900 dark:text-white flex-1">
                          {spec.major_name}
                        </span>
                        {isSelected && (
                          <HiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                      </div>
                      {isSelected ? (
                        <span className="mt-1.5 inline-block text-xs font-semibold text-green-600 dark:text-green-400">
                          Selected
                        </span>
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                          {spec.major_code}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Multiple types: accordion ── */
            <div className="space-y-2">
              {specTypes.map((type) => {
                const specs = specsByType[type];
                const isExpanded = expandedType === type;
                const selectedCode = selectedSpecs.find((c) =>
                  specs.some((s) => s.major_code === c)
                );
                const selectedSpec = selectedCode
                  ? specs.find((s) => s.major_code === selectedCode)
                  : null;

                return (
                  <div
                    key={type}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      selectedSpec
                        ? "border-green-300 dark:border-green-700"
                        : "border-blue-300 dark:border-blue-700"
                    }`}
                  >
                    {/* Accordion header */}
                    <div
                      className={`flex items-center justify-between px-5 py-4 ${
                        selectedSpec
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40"
                      }`}
                    >
                      <button
                        onClick={() => setExpandedType(isExpanded ? null : type)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <span className="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-wide flex-shrink-0">
                          {type}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          {specs.length} options
                        </span>
                        {selectedSpec ? (
                          <span className="text-sm font-semibold text-green-700 dark:text-green-400 truncate">
                            {selectedSpec.major_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex-shrink-0">
                            Not selected
                          </span>
                        )}
                      </button>
                      <button onClick={() => setExpandedType(isExpanded ? null : type)} className="ml-3 flex-shrink-0">
                        {isExpanded
                          ? <HiChevronUp className="w-5 h-5 text-slate-500" />
                          : <HiChevronDown className="w-5 h-5 text-slate-500" />}
                      </button>
                    </div>

                    {/* Accordion body */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {specs.map((spec) => {
                            const isSelected = selectedSpecs.includes(spec.major_code);
                            return (
                              <button
                                key={spec.major_code}
                                onClick={() => handleSpecClick(spec.major_code, type)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-md"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <span className="font-bold text-sm text-slate-900 dark:text-white flex-1">
                                    {spec.major_name}
                                  </span>
                                  {isSelected && (
                                    <HiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  )}
                                </div>
                                {isSelected ? (
                                  <span className="mt-1.5 inline-block text-xs font-semibold text-green-600 dark:text-green-400">
                                    Selected
                                  </span>
                                ) : (
                                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                                    {spec.major_code}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* No specialisations */}
      {program && specsOptions.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <HiInformationCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-base font-medium">
              No specialisations found for this program. You can proceed to compare directly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

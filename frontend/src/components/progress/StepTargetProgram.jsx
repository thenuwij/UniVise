import {
  HiAcademicCap,
  HiCheckCircle,
  HiChevronDown,
  HiChevronUp,
  HiPencil,
} from "react-icons/hi";
import StepHeader from "./StepHeader";

// Card shown for a single selectable specialisation.
function SpecCard({ spec, isSelected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(spec.major_code, false)}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-md"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-xs text-slate-900 dark:text-white flex-1">{spec.major_name}</span>
        {isSelected && <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />}
      </div>
      {isSelected && <span className="mt-1 inline-block text-[11px] font-semibold text-green-600 dark:text-green-400">Selected</span>}
    </button>
  );
}

// Step 3: pick the program to transfer into, plus any specialisations.
function StepTargetProgram({
  programsLoading,
  searchTarget,
  setSearchTarget,
  filteredTargetPrograms,
  targetProgram,
  setTargetProgram,
  targetSpecsOptions,
  setTargetSpecsOptions,
  targetSelectedSpecs,
  setTargetSelectedSpecs,
  targetSpecsByType,
  targetExpandedType,
  setTargetExpandedType,
  onFetchSpecialisations,
  onToggleSpec,
}) {
  return (
    <div className="space-y-4">
      <StepHeader stepNum={3} title="What program do you want to switch to?" subtitle="" />

      {programsLoading ? (
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
            <div className="inline-block p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
              <HiAcademicCap className="w-7 h-7 text-slate-400 animate-pulse" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Loading programs...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <input
              type="text"
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              placeholder="Search programs..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            {targetProgram && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-300 dark:border-green-700 mb-3">
                <div className="flex items-center gap-3">
                  <HiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{targetProgram.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{targetProgram.code}</div>
                  </div>
                </div>
                <button
                  onClick={() => { setTargetProgram(null); setTargetSelectedSpecs([]); setTargetSpecsOptions([]); }}
                  className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-bold transition-colors"
                >
                  <HiPencil className="w-3.5 h-3.5" /> Change
                </button>
              </div>
            )}
            {!targetProgram && (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                {filteredTargetPrograms.slice(0, 30).map((p) => (
                  <button
                    key={p.degree_code}
                    onClick={async () => {
                      setTargetProgram({ code: p.degree_code, name: p.program_name });
                      setTargetSelectedSpecs([]);
                      setTargetExpandedType(null);
                      await onFetchSpecialisations(p.degree_code, false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.program_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.faculty}</p>
                  </button>
                ))}
                {filteredTargetPrograms.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">No programs found</div>
                )}
              </div>
            )}
            {targetProgram && targetSpecsOptions.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-bold text-slate-900 dark:text-white">Specialisations (Optional)</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Select one from each category if applicable</p>
                {Object.keys(targetSpecsByType).length === 1 ? (
                  /* Single type — no accordion, just cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {targetSpecsOptions.map((spec) => (
                      <SpecCard
                        key={spec.major_code}
                        spec={spec}
                        isSelected={targetSelectedSpecs.includes(spec.major_code)}
                        onToggle={onToggleSpec}
                      />
                    ))}
                  </div>
                ) : (
                  /* Multiple types — accordion */
                  <div className="space-y-2">
                    {Object.entries(targetSpecsByType).map(([type, specs]) => {
                      const isExpanded = targetExpandedType === type;
                      const selectedSpec = specs.find((s) => targetSelectedSpecs.includes(s.major_code)) ?? null;
                      return (
                        <div
                          key={type}
                          className={`rounded-xl overflow-hidden border-2 transition-all ${
                            selectedSpec ? "border-green-300 dark:border-green-700" : "border-blue-300 dark:border-blue-700"
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
                              onClick={() => setTargetExpandedType(isExpanded ? null : type)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex-shrink-0">{type}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{specs.length} options</span>
                              {selectedSpec ? (
                                <span className="text-xs font-semibold text-green-700 dark:text-green-400 truncate">{selectedSpec.major_name}</span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex-shrink-0">Not selected</span>
                              )}
                            </button>
                            <button onClick={() => setTargetExpandedType(isExpanded ? null : type)} className="ml-3 flex-shrink-0">
                              {isExpanded ? <HiChevronUp className="w-5 h-5 text-slate-500" /> : <HiChevronDown className="w-5 h-5 text-slate-500" />}
                            </button>
                          </div>
                          {/* Accordion body */}
                          {isExpanded && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {specs.map((spec) => (
                                  <SpecCard
                                    key={spec.major_code}
                                    spec={spec}
                                    isSelected={targetSelectedSpecs.includes(spec.major_code)}
                                    onToggle={onToggleSpec}
                                  />
                                ))}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default StepTargetProgram;

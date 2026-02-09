import { useEffect, useRef, useState } from "react";
import { HiCheckCircle, HiChevronLeft, HiInformationCircle, HiSearch, HiX } from "react-icons/hi";

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

  useEffect(() => {
    if (program && selectedProgramRef.current) {
      setTimeout(() => {
        selectedProgramRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }, 100);
    }
  }, [program]);

  

  return (
    <div className="space-y-6 pb-12">
      
      {/* TOP BAR WITH HEADING AND COMPARE BUTTON */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-6">
        
        {/* SEARCH INPUT */}
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

        {/* PROGRAM LIST OR SELECTED PROGRAM */}
        <div className="mt-4">
          {!program ? (
            /* Program List */
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {filteredPrograms.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                  No programs found
                </div>
              ) : (
                filteredPrograms.map((p) => (
                  <button
                    key={p.degree_code}
                    onClick={() => onSelectProgram(p)}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800 transition-all"
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {p.program_name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      {p.degree_code}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* Selected Program Badge */
            <div ref={selectedProgramRef} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3">
                <HiCheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {program.name}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {program.code}
                  </div>
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

      {/* SPECIALISATIONS (Only show if program selected) */}
      {program && specsOptions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Specialisations (Optional)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
            Select one from each category if applicable
          </p>
          
          <div className="space-y-5">
            {Object.entries(specsByType).map(([type, specs]) => (
              <div key={type}>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                  {type} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Select one)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {specs.map((spec) => {
                    const isSelected = selectedSpecs.includes(spec.major_code);
                    return (
                      <button
                        key={spec.major_code}
                        onClick={() => toggleSpec(spec.major_code, isBase)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 shadow-md"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white flex-1">
                            {spec.major_name}
                          </span>
                          {isSelected && (
                            <HiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {spec.major_code}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NO SPECIALISATIONS MESSAGE */}
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

      {/* Glow animation keyframes */}
      <style jsx>{`
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 50px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
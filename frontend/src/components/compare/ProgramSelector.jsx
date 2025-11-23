import React from "react";
import { ChevronLeft, Search, CheckCircle2 } from "lucide-react";

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
  userEnrolledProgram,
  handleUseCurrentProgram,
}) {
  const title = isBase
    ? "Select Your Base Program"
    : "Select Target Program";

  const subtitle = isBase
    ? "This is your current degree. We'll check which courses can transfer to your target program."
    : "This is the program you're considering switching to. We'll show you what transfers and what's needed.";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with clear visual hierarchy */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-3 py-1 text-xs font-medium mb-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
          {isBase ? "Step 1 of 2" : "Step 1 of 2"}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-3xl">{subtitle}</p>
      </div>

      {/* Quick Start - More prominent */}
      {isBase && userEnrolledProgram && (
        <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Already enrolled? Use your current program
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                We'll automatically load your enrolled degree and specialisations
              </p>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-gray-900 dark:text-white">
                  <span className="font-bold">{userEnrolledProgram.program_name}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    ({userEnrolledProgram.degree_code})
                  </span>
                </div>
                <button
                  onClick={handleUseCurrentProgram}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  Use This Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Selection Area */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        
        {/* Search with icon and better spacing */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {isBase ? "Or search for a different program" : "Search for your target program"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Type program name or code (e.g., Computer Science, 3778)..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          {searchValue && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Found {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Two column layout with better visual balance */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Left: Program list with better visual feedback */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Available Programs
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {filteredPrograms.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No programs found matching "{searchValue}"
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                filteredPrograms.map((p) => {
                  const isSelected = program?.code === p.degree_code;
                  return (
                    <button
                      key={p.degree_code}
                      onClick={() => onSelectProgram(p)}
                      className={`w-full text-left px-4 py-3.5 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                            {p.program_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                            {p.degree_code}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected program summary with clearer structure */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            {!program ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  No Program Selected
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Select a program from the list to see details and choose specialisations
                </p>
              </div>
            ) : (
              <>
                {/* Selected program card */}
                <div className="mb-5 p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selected Program</p>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {program.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                        {program.code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Specialisations section with better hierarchy */}
                {specsOptions.length > 0 ? (
                  <div>
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Specialisations (Optional)
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Select any majors, minors or honours to include in the comparison
                      </p>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(specsByType).map(([type, specs]) => (
                        <div key={type}>
                          <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
                            <span>{type}</span>
                            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
                          </div>
                          <div className="space-y-1.5">
                            {specs.map((spec) => {
                              const isSelected = selectedSpecs.includes(spec.major_code);
                              return (
                                <button
                                  key={spec.major_code}
                                  onClick={() => toggleSpec(spec.major_code, isBase)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs border transition-all ${
                                    isSelected
                                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 text-blue-900 dark:text-blue-100 shadow-sm"
                                      : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium flex-1">{spec.major_name}</span>
                                    {isSelected && (
                                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
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
                ) : (
                  <div className="text-center py-6 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      No specialisations available for this program
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom navigation - more prominent */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {isBase ? "Back to Progress" : "Back to Base Program"}
        </button>

        <button
          onClick={goNext}
          disabled={!program}
          className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {isBase ? "Continue to Target Program" : "Compare Programs"}
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>
    </div>
  );
}
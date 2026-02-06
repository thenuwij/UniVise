// src/pages/mindmesh/components/WelcomeModal.jsx
import { X, MousePointer2, MousePointerClick, Hand, Network } from "lucide-react";

export default function WelcomeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 px-6 py-5 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Network className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Welcome to MindMesh!</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Your interactive course prerequisite visualizer</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* What is MindMesh */}
              <section>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
                  What is MindMesh?
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  MindMesh visualizes how courses in your degree connect through prerequisites. 
                  Each <strong>node</strong> represents a course, and <strong>arrows</strong> point from 
                  prerequisites to the courses that require them.
                </p>
              </section>

              {/* Understanding the Graph */}
              <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Network className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  Understanding Prerequisites
                </h3>
                
                <div className="space-y-4">

                  {/* Course Nodes */}
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-14 rounded-lg bg-blue-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      COMP<br/>1511
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100 mb-0.5 text-sm">
                        Course Nodes
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Courses are coloured by their level (1xxx, 2xxx, 3xxx, etc.)
                      </p>
                    </div>
                  </div>

                  {/* Solid Lines */}
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-14 flex-shrink-0 flex items-center justify-center">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shadow">A</div>
                        <svg width="28" height="8">
                          <line x1="0" y1="4" x2="24" y2="4" stroke="#334155" strokeWidth="3" />
                          <polygon points="24,1 28,4 24,7" fill="#334155" />
                        </svg>
                        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow">B</div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        Solid Line — <span className="text-blue-600 dark:text-blue-400 font-bold">You MUST complete this prerequisite</span>
                      </p>
                    </div>
                  </div>

                  {/* Dashed Lines - Pick One */}
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-14 flex-shrink-0 flex items-center justify-center">
                      <div className="flex items-start gap-1">
                        <div className="flex flex-col gap-1">
                          <div className="w-7 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold shadow">A</div>
                          <div className="w-7 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold shadow">B</div>
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                          <svg width="20" height="6">
                            <line x1="0" y1="3" x2="20" y2="3" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="3,3" />
                          </svg>
                          <svg width="20" height="6">
                            <line x1="0" y1="3" x2="20" y2="3" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="3,3" />
                          </svg>
                        </div>
                        <div className="w-7 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold shadow mt-[7px]">C</div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                        Dashed Line —  <span className="text-blue-600 dark:text-blue-400 font-bold">You must complete ONLY ONE of the linked courses as a prerequisite</span>
                      </p>

                    </div>
                  </div>

                  {/* Multiple Colors – Pick from Each */}
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-14 flex-shrink-0 flex items-center justify-center">
                      <div className="flex items-start gap-1">

                        <div className="flex flex-col gap-1">
                          <div className="w-7 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold shadow">A</div>
                          <div className="w-7 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold shadow">B</div>
                        </div>

                        {/* TWO DASHED LINE COLOURS */}
                        <div className="flex flex-col gap-1 mt-1">
                          <svg width="24" height="6">
                            <line x1="0" y1="3" x2="24" y2="3" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="3,3" />
                          </svg>
                          <svg width="24" height="6">
                            <line x1="0" y1="3" x2="24" y2="3" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3,3" />
                          </svg>
                        </div>

                        <div className="w-7 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold shadow mt-[7px]">
                          C
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                        Different coloured dash lines  —  <span className="text-blue-600 dark:text-blue-400 font-bold">You must complete ONLY ONE course FROM EACH line colour as a prerequisite</span>
                      </p>
                    </div>
                  </div>

                </div>
              </section>

            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* How to Interact */}
              <section>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
                  How to Interact
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                    <MousePointer2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Single Click Course Node</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Focus on a course to highlight its prerequisites and unlock "View Course Details"</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <MousePointerClick className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Double Click Course Node</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Expand to show ALL courses connected to this course (prerequisites and dependents)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <Hand className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Drag & Zoom</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Drag nodes to rearrange, scroll to zoom, drag background to pan around</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Navigation Tips */}
              <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                  💡 Navigation Tips
                </h3>
                <ul className="space-y-1.5 text-sm text-amber-900 dark:text-amber-100">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Use <strong>Back/Home</strong> buttons to return to previous views</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Click <strong>Fit View</strong> to center and zoom to all nodes</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Use <strong>Freeze</strong> to stop node movement for easier reading</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span><strong>Auto Layout</strong> organizes courses by level (1→2→3→4)</span>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-xl font-semibold text-white 
                     bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 
                     hover:from-sky-600 hover:via-blue-600 hover:to-indigo-600
                     shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Got it! Let's explore
          </button>
        </div>
      </div>
    </div>
  );
}
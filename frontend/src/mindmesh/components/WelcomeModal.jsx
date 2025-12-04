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
              <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Network className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  Understanding Prerequisites
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-8 rounded bg-sky-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                      COMP
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Course Nodes</p>
                      <p className="text-slate-600 dark:text-slate-400">Colored by level (Level 1-4)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-16 h-8 flex-shrink-0 flex items-center justify-center">
                      <div className="w-12 h-0.5 bg-slate-600"></div>
                      <div className="w-0 h-0 border-l-4 border-l-slate-600 border-y-2 border-y-transparent ml-0.5"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Solid Lines →</p>
                      <p className="text-slate-600 dark:text-slate-400"><strong>Required</strong> - You MUST complete this course</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-16 h-8 flex-shrink-0 flex items-center justify-center">
                      <svg width="48" height="8">
                        <line x1="0" y1="4" x2="44" y2="4" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,4" />
                        <polygon points="44,1 48,4 44,7" fill="#3b82f6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Dashed Lines (Same Color) →</p>
                      <p className="text-slate-600 dark:text-slate-400"><strong>Pick ONE</strong> - Complete any one course from this color group</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-16 h-8 flex-shrink-0 flex flex-col items-center justify-center gap-0.5">
                      <svg width="48" height="3">
                        <line x1="0" y1="1.5" x2="48" y2="1.5" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,4" />
                      </svg>
                      <svg width="48" height="3">
                        <line x1="0" y1="1.5" x2="48" y2="1.5" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Multiple Color Groups →</p>
                      <p className="text-slate-600 dark:text-slate-400"><strong>Pick ONE from EACH</strong> color - Complete one course from each group</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                  <p className="text-xs text-sky-900 dark:text-sky-100">
                    <strong>Example:</strong> If you see blue dashed lines (A, B) and green dashed lines (C, D) pointing to a course, 
                    you need ONE from blue (A OR B) AND ONE from green (C OR D).
                  </p>
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
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Single Click</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Focus on a course to highlight its prerequisites and unlock "View Course Details"</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <MousePointerClick className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Double Click</p>
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
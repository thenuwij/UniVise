import { createPortal } from 'react-dom';
import { X, MousePointer2, MousePointerClick, Hand, Network } from "lucide-react";

export default function WelcomeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full overflow-hidden">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Network className="h-7 w-7 text-slate-700 dark:text-slate-300" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">MindMesh Guide</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">How to read and interact with the course graph</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Understanding Lines */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Understanding Connections</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 flex items-center">
                  <svg width="48" height="16">
                    <line x1="0" y1="8" x2="40" y2="8" stroke="#3b82f6" strokeWidth="2.5"/>
                    <polygon points="38,5 44,8 38,11" fill="#3b82f6"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Solid line</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">You must complete this course before moving on (mandatory prerequisite)</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 flex items-center">
                  <svg width="48" height="16">
                    <line x1="0" y1="8" x2="40" y2="8" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="5,4"/>
                    <polygon points="38,5 44,8 38,11" fill="#8b5cf6"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dashed line</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Flexible connection — one option among alternatives (OR prerequisite or corequisite)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Course Node Levels */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Course Levels</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { level: "Level 1", code: "1xxx", color: "#2F8DDB" },
                { level: "Level 2", code: "2xxx", color: "#2563EB" },
                { level: "Level 3", code: "3xxx", color: "#178756" },
                { level: "Level 4+", code: "4xxx", color: "#8A4FF7" },
              ].map(({ level, code, color }) => (
                <div key={level} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: color }}>
                    {code}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{level}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Interactions */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">How to Interact</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                <MousePointer2 className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Single click</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Focus a course — highlights its connections and shows course details below</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <MousePointerClick className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Double click</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Expand the graph to show all courses connected to this one</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <Hand className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Drag & zoom</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Drag nodes to rearrange, scroll to zoom, drag background to pan</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 rounded-xl font-semibold text-white text-sm
                       bg-gradient-to-r from-blue-500 to-indigo-500
                       hover:from-blue-600 hover:to-indigo-600
                       shadow-md hover:shadow-lg transition-all duration-200"
          >
            Got it, let's explore
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

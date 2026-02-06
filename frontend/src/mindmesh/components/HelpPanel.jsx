// src/pages/mindmesh/components/HelpPanel.jsx
import { ChevronDown, ChevronUp, HelpCircle, Sparkles, ZoomIn } from "lucide-react";
import { useState } from "react";

export default function HelpPanel() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute top-4 left-4 z-20 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border-2 border-slate-200 dark:border-slate-700">
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-xl" />
      
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">How to Use MindMesh</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* CRITICAL FIRST STEP */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                          rounded-xl p-4 border-2 border-blue-300 dark:border-blue-700 shadow-md">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-base text-blue-900 dark:text-blue-100 mb-2">
                  ⚡ Start Here!
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 font-bold leading-relaxed">
                  Always click the <span className="px-2 py-0.5 rounded bg-blue-600 text-white">Auto Layout</span> button first to organize all courses clearly!
                </p>
              </div>
            </div>
          </div>

          {/* What you see */}
          <div className="space-y-2">
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
              What You're Viewing
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Each circle is a course. Lines connecting them show which courses you need to take first (prerequisites).
            </p>
          </div>

          {/* Basic controls */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Basic Controls
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                <span className="text-lg">👆</span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Click a course</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">View course details and highlights</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                <span className="text-lg">✌️</span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Double-click a course</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Expand to show connected courses</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                <ZoomIn className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Scroll wheel</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Zoom in and out</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                <span className="text-lg">🖱️</span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Drag courses</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Move them to organize your view</p>
                </div>
              </div>
            </div>
          </div>

          {/* Helpful buttons */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <p className="font-bold text-sm text-green-900 dark:text-green-100 mb-2">
              💡 Helpful Buttons
            </p>
            <ul className="space-y-1 text-xs text-green-800 dark:text-green-200">
              <li>• <strong>Freeze:</strong> Stop courses from moving around</li>
              <li>• <strong>Fit View:</strong> Center everything on screen</li>
              <li>• <strong>Reset:</strong> Start fresh with all courses</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
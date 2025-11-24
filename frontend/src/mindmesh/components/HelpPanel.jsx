// src/pages/mindmesh/components/HelpPanel.jsx
import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Info } from "lucide-react";

export default function HelpPanel() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute top-4 left-4 z-20 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Quick Guide</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 text-sm">
          {/* What you're seeing */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              What you're seeing
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Each course is a <strong>node</strong>, and <strong>lines</strong> show prerequisite relationships.
            </p>
          </div>

          {/* Legend */}
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
              Connection Types
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-slate-600 dark:bg-slate-400"></div>
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Solid:</strong> Must complete first
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="32" height="2">
                  <line 
                    x1="0" 
                    y1="1" 
                    x2="32" 
                    y2="1" 
                    stroke="#60a5fa"
                    strokeWidth="2" 
                    strokeDasharray="4,4" 
                  />
                </svg>
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Dashed:</strong> One of multiple options
                </span>
              </div>
            </div>
          </div>

          {/* Interactions */}
          <div className="space-y-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
              Interactions
            </p>
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <p><strong className="text-slate-900 dark:text-slate-100">Click once:</strong> Focus & view details</p>
              <p><strong className="text-slate-900 dark:text-slate-100">Double-click:</strong> Expand to connected courses</p>
              <p><strong className="text-slate-900 dark:text-slate-100">Drag:</strong> Move nodes around</p>
              <p><strong className="text-slate-900 dark:text-slate-100">Scroll:</strong> Zoom in/out</p>
            </div>
          </div>

        {/* Tips */}
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-200 dark:border-sky-800">
        <p className="font-semibold text-sky-900 dark:text-sky-100 text-xs mb-1.5">💡 Pro Tips</p>
        <ul className="space-y-1 text-xs text-sky-900 dark:text-sky-100">
            <li>• <strong>Always click Auto Layout</strong> to build the graph clearly</li>
            <li>• Use <strong>Freeze</strong> to stop movement</li>
            <li>• <strong>Fit View</strong> centers everything</li>
        </ul>
        </div>
        </div>
      )}
    </div>
  );
}
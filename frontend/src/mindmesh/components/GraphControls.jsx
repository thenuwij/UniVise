// src/pages/mindmesh/components/GraphControls.jsx
import { HelpCircle } from "lucide-react";
import AutoLayoutControls from "./AutoLayoutControls";

export default function GraphControls({
  graphHistory,
  handleBack,
  handleHome,
  fitView,
  toggleFreeze,
  frozen,
  graph,
  setGraph,
  canvasSize,
  graphRef,
  setFrozen,
  focusedNode,          
  handleViewCourse,
  onShowHelp,
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 
                    bg-white dark:bg-slate-900 shadow-sm">
      {/* Title + Subtitle */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">MindMesh</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Interactive course prerequisite visualizer
          </p>
        </div>

        {/* View Course Button (appears when node is focused) */}
        {focusedNode && (
          <button
            onClick={handleViewCourse}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl
                     bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 
                     hover:from-sky-600 hover:via-blue-600 hover:to-indigo-600
                     shadow-lg hover:shadow-xl transition-all duration-200
                     hover:scale-105 active:scale-95"
          >
            View Course Details
          </button>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Help Button */}
        <button
          onClick={onShowHelp}
          className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 
                   bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700
                   text-slate-700 dark:text-slate-300 transition-colors"
          title="Show help guide"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Navigation Buttons */}
        {graphHistory.current.length > 0 && (
          <>
            <button 
              onClick={handleBack} 
              className="control-btn"
              title="Go back to previous view"
            >
              Back
            </button>
            <button 
              onClick={handleHome} 
              className="control-btn"
              title="Return to initial view"
            >
              Home
            </button>
          </>
        )}

        {/* View Controls */}
        <button 
          onClick={fitView} 
          className="control-btn"
          title="Fit all nodes in view"
        >
          Fit View
        </button>

        <button
          onClick={toggleFreeze}
          className={`control-btn ${
            frozen
              ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
              : ""
          }`}
          title={frozen ? "Unfreeze graph movement" : "Freeze graph movement"}
        >
          {frozen ? "Unfreeze" : "Freeze"}
        </button>

        {/* Layout Controls */}
        <AutoLayoutControls
          graph={graph}
          setGraph={setGraph}
          canvasSize={canvasSize}
          graphRef={graphRef}
          setFrozen={setFrozen}
        />
      </div>
    </div>
  );
}
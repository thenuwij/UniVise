import AutoLayoutControls from "./AutoLayoutControls";

/**
 * GraphControls.jsx
 * Toolbar for navigation, layout, and freeze controls in the MindMesh graph.
 */
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
}) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
      {/* Title + Subtitle + View Button */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">MindMesh</h1>
          <p className="text-sm text-slate-300/80">
            Interactive graph of your selected degrees and courses.
          </p>
        </div>

        {/* button appears next to the title when a node is selected */}
        {focusedNode && (
          <button
            onClick={handleViewCourse}
            className="
              px-6 py-2.5 text-base font-semibold tracking-wide
              text-white rounded-xl
              bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700
              hover:from-sky-400 hover:via-blue-500 hover:to-indigo-600
              border border-blue-400/40
              shadow-[0_0_10px_rgba(56,189,248,0.3)]
              hover:shadow-[0_0_18px_rgba(56,189,248,0.5)]
              transition-all duration-200
              hover:scale-[1.05] active:scale-[0.98]
            "
          >
            View Course Details
          </button>
        )}

      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {graphHistory.current.length > 0 && (
          <>
            <button onClick={handleBack} className="control-btn">
              Back
            </button>
            <button onClick={handleHome} className="control-btn">
              Home
            </button>
          </>
        )}

        <button onClick={fitView} className="control-btn">
          Fit
        </button>

        <button
          onClick={toggleFreeze}
          className={`control-btn ${
            frozen
              ? "border-emerald-600 bg-emerald-700/20 text-emerald-300"
              : "border-slate-700 bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {frozen ? "Unfreeze" : "Freeze"}
        </button>

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

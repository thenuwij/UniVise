// src/pages/mindmesh/components/GraphControls.jsx
import { forwardRef, useRef, useImperativeHandle, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import AutoLayoutControls from "./AutoLayoutControls";
import WelcomeModal from "./WelcomeModal";

export default forwardRef(function GraphControls({
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
}, ref) {
  const layoutControlsRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useImperativeHandle(ref, () => ({
    autoLayout: () => layoutControlsRef.current?.autoLayout?.(),
  }));

  return (
    <div className="border-b border-slate-200 dark:border-slate-700
                    bg-white/95 dark:bg-slate-900/95
                    shadow-sm backdrop-blur-sm">
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">Click a course to see what it needs and what it unlocks.</p>
        {/* Right: compact toolbar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {graphHistory?.current?.length > 0 && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Undo the last step"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
              <button
                onClick={handleHome}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Go back to the full graph"
              >
                <RotateCcw className="h-4 w-4" />
                Reset view
              </button>
            </>
          )}

          <button
            onClick={() => setShowWelcome(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium
                       bg-slate-100 dark:bg-slate-800
                       border border-slate-200 dark:border-slate-600
                       text-slate-700 dark:text-slate-200
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-all duration-200"
          >
            Help
          </button>

          <button
            onClick={fitView}
            className="px-3 py-1.5 rounded-lg text-sm font-medium
                       bg-slate-100 dark:bg-slate-800
                       border border-slate-200 dark:border-slate-600
                       text-slate-700 dark:text-slate-200
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-all duration-200"
            title="Fit all nodes in view"
          >
            Fit View
          </button>

          <button
            onClick={toggleFreeze}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              frozen
                ? "bg-blue-600 text-white border border-blue-500 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title={frozen ? "Unfreeze graph movement" : "Freeze graph movement"}
          >
            {frozen ? "Unfreeze" : "Freeze"}
          </button>

          <button
            onClick={() => layoutControlsRef.current?.autoLayout?.()}
            disabled={!graph?.nodes?.length}
            className="px-3 py-1.5 rounded-lg text-sm font-medium
                       bg-slate-100 dark:bg-slate-800
                       border border-slate-200 dark:border-slate-600
                       text-slate-700 dark:text-slate-200
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200"
            title="Automatically arrange courses by level"
          >
            Auto Layout
          </button>


        </div>
      </div>

      {/* Hidden AutoLayoutControls — keeps ref alive for programmatic autoLayout on graph change */}
      <div className="hidden">
        <AutoLayoutControls
          ref={layoutControlsRef}
          graph={graph}
          setGraph={setGraph}
          canvasSize={canvasSize}
          graphRef={graphRef}
          setFrozen={setFrozen}
        />
      </div>

      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    </div>
  );
});

// src/pages/mindmesh/components/GraphControls.jsx
import { forwardRef, useRef, useImperativeHandle, useState } from "react";
import { HelpCircle, LayoutGrid, Maximize2, Pause, Play, RotateCcw, Undo2 } from "lucide-react";
import AutoLayoutControls from "./AutoLayoutControls";
import WelcomeModal from "./WelcomeModal";

const TOOL =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
const TOOL_ON =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-600 border border-blue-600 shadow-sm hover:bg-blue-700 transition-colors";

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
      <div className="px-4 py-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <p className="text-sm text-ink-muted">Click a course to see what it needs and what it unlocks.</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {graphHistory?.current?.length > 0 && (
            <>
              <button onClick={handleBack} className={TOOL} title="Undo the last step">
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
              <button onClick={handleHome} className={TOOL} title="Go back to the full graph">
                <RotateCcw className="h-4 w-4" />
                Reset view
              </button>
            </>
          )}
          <button onClick={fitView} className={TOOL} title="Fit all courses on screen">
            <Maximize2 className="h-4 w-4" />
            Fit to screen
          </button>
          <button
            onClick={() => layoutControlsRef.current?.autoLayout?.()}
            disabled={!graph?.nodes?.length}
            className={TOOL}
            title="Arrange courses by level"
          >
            <LayoutGrid className="h-4 w-4" />
            Arrange by level
          </button>
          <button
            onClick={toggleFreeze}
            aria-pressed={frozen}
            className={frozen ? TOOL_ON : TOOL}
            title={frozen ? "Let the graph move again" : "Stop the graph moving"}
          >
            {frozen ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {frozen ? "Unfreeze" : "Freeze"}
          </button>
          <button
            onClick={() => setShowWelcome(true)}
            aria-label="How CourseMesh works"
            title="How CourseMesh works"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
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

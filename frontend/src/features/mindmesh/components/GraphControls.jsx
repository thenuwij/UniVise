// src/pages/mindmesh/components/GraphControls.jsx
import { forwardRef, useRef, useImperativeHandle, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  isProgramView,
  programMeta,
  programCourses,
}, ref) {
  const navigate = useNavigate();
  const layoutControlsRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useImperativeHandle(ref, () => ({
    autoLayout: () => layoutControlsRef.current?.autoLayout?.(),
  }));

  const goBack = () => navigate(-1);

  return (
    <div className="border-b border-slate-200 dark:border-slate-700
                    bg-white/95 dark:bg-slate-900/95
                    shadow-sm backdrop-blur-sm">

      <div className="px-4 py-2.5 flex items-center justify-between gap-4">

        {/* Left: back button + title + program badge */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0
                       bg-slate-100 dark:bg-slate-800
                       border border-slate-200 dark:border-slate-600
                       text-slate-700 dark:text-slate-200
                       font-medium text-sm
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Roadmap
          </button>

          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600
                           dark:from-blue-400 dark:via-sky-400 dark:to-cyan-400
                           bg-clip-text text-transparent tracking-tight leading-tight">
              MindMesh
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">
              Prerequisite visualizer
            </p>
          </div>

          {/* Program badge */}
          {isProgramView && programMeta && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg min-w-0
                           bg-blue-50 dark:bg-blue-900/30
                           border border-blue-200 dark:border-blue-700">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate max-w-[200px]">
                {programMeta.program_name || programMeta.degree_code}
              </span>
              {programCourses?.length > 0 && (
                <span className="text-xs text-blue-500 dark:text-blue-400 flex-shrink-0">
                  · {programCourses.length} courses
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: compact toolbar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {graphHistory?.current?.length > 0 && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Go back to previous graph state"
              >
                ← Back
              </button>
              <button
                onClick={handleHome}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Return to initial graph state"
              >
                ⌂ Home
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

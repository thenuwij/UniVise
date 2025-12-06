// src/pages/mindmesh/components/GraphControls.jsx
import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from "react";
import { HelpCircle, ArrowLeft, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AutoLayoutControls from "./AutoLayoutControls";

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
  focusedNode,          
  handleViewCourse,
  onShowHelp,
}, ref) {
  const navigate = useNavigate();
  const layoutControlsRef = useRef(null);
  const [showHelpPointer, setShowHelpPointer] = useState(true);
  
  useImperativeHandle(ref, () => ({
    autoLayout: () => layoutControlsRef.current?.autoLayout?.()
  }));

  // Hide the help pointer after 10 seconds or when clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelpPointer(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleHelpClick = () => {
    setShowHelpPointer(false);
    onShowHelp();
  };

  const goBack = () => navigate(-1);

  return (
    <div className="border-b-2 border-slate-300 dark:border-slate-600
                    bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 
                    dark:from-slate-700 dark:via-slate-800 dark:to-slate-700
                    shadow-lg backdrop-blur-sm">
      
      {/* Back to Roadmap Button - Top Row */}
      <div className="px-6 pt-3 pb-2">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800
                     border-2 border-slate-300 dark:border-slate-600
                     text-slate-700 dark:text-slate-200
                     font-semibold text-sm
                     shadow-sm hover:shadow-md
                     transition-all duration-200
                     hover:border-slate-400 dark:hover:border-slate-500
                     hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Roadmap
        </button>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-between px-6 pb-4">
        
        {/* Left: Title and Help Button */}
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 
                           dark:from-blue-400 dark:via-sky-400 dark:to-cyan-400 
                           bg-clip-text text-transparent tracking-tight">
              MindMesh
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Interactive course prerequisite visualizer
            </p>
          </div>
          
          {/* Help Button with Animated Pointer */}
          <div className="relative">
            <button
              onClick={handleHelpClick}
              className="px-6 py-3 rounded-xl 
                         bg-gradient-to-r from-blue-500 to-sky-500
                         hover:from-blue-600 hover:to-sky-600
                         text-white font-bold text-base
                         shadow-lg hover:shadow-xl
                         transition-all duration-200
                         hover:scale-105 active:scale-95
                         flex items-center gap-2.5
                         border-2 border-blue-400/50"
              title="Click here for help and tutorial!"
            >
              <HelpCircle className="h-6 w-6" />
              Need Help?
            </button>

            {/* Animated Red Arrow Pointer */}
            {showHelpPointer && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex items-center gap-2 pointer-events-none z-50">
                <div className="animate-bounce-horizontal">
                  <ArrowLeft className="h-8 w-8 text-red-500 drop-shadow-lg" />
                </div>
                <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm whitespace-nowrap shadow-lg animate-pulse">
                  Click for help!
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: All Control Buttons */}
        <div className="flex items-center gap-2">
          
          {/* View Course Button - BLUE */}
          {focusedNode && (
            <button
              onClick={handleViewCourse}
              className="px-4 py-2 text-sm font-bold text-white rounded-lg
                         bg-gradient-to-r from-blue-500 to-cyan-500 
                         hover:from-blue-600 hover:to-cyan-600
                         shadow-md hover:shadow-lg transition-all duration-200
                         hover:scale-105 active:scale-95
                         border border-blue-400/30"
            >
              View Course Details
            </button>
          )}
          
          {/* Navigation Buttons */}
          {graphHistory.current.length > 0 && (
            <>
              <button 
                onClick={handleBack} 
                className="px-4 py-2 rounded-lg
                           bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800
                           border-2 border-slate-300 dark:border-slate-600
                           text-slate-700 dark:text-slate-200
                           font-semibold text-sm
                           shadow-sm hover:shadow-md
                           transition-all duration-200
                           hover:border-slate-400 dark:hover:border-slate-500
                           hover:scale-105 active:scale-95"
                title="Go back to previous view"
              >
                Back
              </button>
              <button 
                onClick={handleHome} 
                className="px-4 py-2 rounded-lg
                           bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800
                           border-2 border-slate-300 dark:border-slate-600
                           text-slate-700 dark:text-slate-200
                           font-semibold text-sm
                           shadow-sm hover:shadow-md
                           transition-all duration-200
                           hover:border-slate-400 dark:hover:border-slate-500
                           hover:scale-105 active:scale-95"
                title="Return to initial view"
              >
                Home
              </button>
            </>
          )}
          
          {/* View Controls */}
          <button 
            onClick={fitView} 
            className="px-4 py-2 rounded-lg
                       bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800
                       border-2 border-slate-300 dark:border-slate-600
                       text-slate-700 dark:text-slate-200
                       font-semibold text-sm
                       shadow-sm hover:shadow-md
                       transition-all duration-200
                       hover:border-slate-400 dark:hover:border-slate-500
                       hover:scale-105 active:scale-95"
            title="Fit all nodes in view"
          >
            Fit View
          </button>
          
          {/* Freeze Button - BLUE when active */}
          <button
            onClick={toggleFreeze}
            className={`px-4 py-2 rounded-lg font-semibold text-sm
                       shadow-sm hover:shadow-md
                       transition-all duration-200
                       hover:scale-105 active:scale-95
                       ${frozen
                         ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-2 border-blue-400 shadow-lg" 
                         : "bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500"
                       }`}
            title={frozen ? "Unfreeze graph movement" : "Freeze graph movement"}
          >
            {frozen ? "Unfreeze" : "Freeze"}
          </button>
          
          {/* Layout Controls */}
          <AutoLayoutControls
            ref={layoutControlsRef}
            graph={graph}
            setGraph={setGraph}
            canvasSize={canvasSize}
            graphRef={graphRef}
            setFrozen={setFrozen}
          />
        </div>
      </div>

      {/* Custom CSS for horizontal bounce animation */}
      <style jsx>{`
        @keyframes bounce-horizontal {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-10px);
          }
        }
        
        .animate-bounce-horizontal {
          animation: bounce-horizontal 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
});
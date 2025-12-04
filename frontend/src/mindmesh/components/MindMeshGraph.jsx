// src/pages/mindmesh/components/MindMeshGraph.jsx
import { forwardRef, useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";

const MindMeshGraph = forwardRef(function MindMeshGraph(
  {
    graph,
    canvasSize,
    focusedNode,
    handleNodeClick,
    onBackgroundClick,
    setHoverLink,
    nodeCanvasObject,
    nodePointerAreaPaint,
    linkColor,
    linkWidth,
  },
  graphRef
) {

  const [bgColor, setBgColor] = useState("rgba(15,23,42,1)");

  useEffect(() => {
    const updateBgColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setBgColor(isDark ? "rgba(15,23,42,1)" : "rgba(248,250,252,1)");
    };

    updateBgColor();

    const observer = new MutationObserver(updateBgColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);


  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center 
                      text-slate-500 dark:text-slate-400 text-sm">
        No courses to display. Generate a roadmap to visualize course connections.
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
      <ForceGraph2D
        ref={graphRef} 
        graphData={graph}
        width={canvasSize.w}
        height={canvasSize.h}
        backgroundColor={bgColor}
        nodeId="id"
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkLineDash={(l) => (l.logic_type === "and" ? [6, 6] : null)}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        onNodeClick={handleNodeClick}
        onBackgroundClick={onBackgroundClick}
        onLinkHover={setHoverLink}
      />
    </div>
  );
});

export default MindMeshGraph;
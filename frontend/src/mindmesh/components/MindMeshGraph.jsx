// src/mindmesh/components/MindMeshGraph.jsx
import { forwardRef } from "react";
import ForceGraph2D from "react-force-graph-2d";

/**
 * MindMeshGraph.jsx
 * Renders the ForceGraph2D canvas and forwards ref
 * to preserve zoomToFit / layout control from parent.
 */
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
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm">
        No items to display.
      </div>
    );
  }

  return (
    <ForceGraph2D
      ref={graphRef} 
      graphData={graph}
      width={canvasSize.w}
      height={canvasSize.h}
      backgroundColor="rgba(15,23,42,1)"
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
  );
});

export default MindMeshGraph;

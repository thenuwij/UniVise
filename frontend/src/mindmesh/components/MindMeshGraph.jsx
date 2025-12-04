// src/pages/mindmesh/components/MindMeshGraph.jsx
import { forwardRef, useEffect, useState } from "react";
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
    linkLineDash,
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
  
  // Calculate node dimensions matching NodeRenderer.js logic
  const getNodeSize = (node) => {

    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    const code = node.id;
    const sub = node.metadata?.uoc ? `${node.metadata.uoc} UOC` : "";
    const titleSize = 15;
    const subSize = 12;
    const padX = 12;
    const padY = 9;
    const gapY = sub ? 3 : 0;
    
    // Measure title
    ctx.font = `600 ${titleSize}px Inter, system-ui, -apple-system`;
    const titleW = ctx.measureText(code).width;
    
    // Measure subtitle if exists
    let subW = 0;
    if (sub) {
      ctx.font = `500 ${subSize}px Inter, system-ui, -apple-system`;
      subW = ctx.measureText(sub).width;
    }
    
    const textW = Math.max(titleW, subW);
    const h = titleSize + (sub ? gapY + subSize : 0) + padY * 2;
    const w = textW + padX * 2;
    
    // Return half-dimensions
    return {
      width: w / 2,
      height: h / 2
    };
  };
  
  // Calculate arrow position based on actual node size and link length
  const linkDirectionalArrowRelPos = (link) => {
    const source = typeof link.source === 'object' ? link.source : graph.nodes.find(n => n.id === link.source);
    const target = typeof link.target === 'object' ? link.target : graph.nodes.find(n => n.id === link.target);
    
    if (!source || !target || !target.x || !target.y || !source.x || !source.y) {
      return 0.95;
    }
    
    // Calculate distance between nodes
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 1) return 0.95;
    
    // Get target node dimensions
    const targetSize = getNodeSize(target);
    
    // Calculate the maximum extent of the node 
    const nodeRadius = Math.sqrt(targetSize.width ** 2 + targetSize.height ** 2);
    
    const arrowLength = 16;
    const buffer = 5; 
    
    // Calculate position
    const stopDistance = nodeRadius + arrowLength + buffer;
    const relPos = Math.max(0.5, Math.min(0.98, 1 - (stopDistance / distance)));
    
    return relPos;
  };
  
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
        linkLineDash={linkLineDash}
        linkDirectionalArrowLength={16}
        linkDirectionalArrowRelPos={linkDirectionalArrowRelPos}
        linkDirectionalArrowColor={linkColor}
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
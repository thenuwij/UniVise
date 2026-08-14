// src/pages/MindMeshGraphPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import GraphControls from "./components/GraphControls";
import { nodeCanvasObject, nodePointerAreaPaint } from "./components/NodeRenderer";
import useMindMeshData from "./hooks/useMindMeshData";
import { colorFor } from "./utils/index";
import MindMeshGraph from "./components/MindMeshGraph";
import MindMeshInfoPanel from "./components/MindMeshInfoPanel";

export default function MindMeshGraphPage() {
  const { session } = UserAuth();
  const [searchParams] = useSearchParams();

  const [frozen, setFrozen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedNode, setFocusedNode] = useState(null);
  const [, setHoverLink] = useState(null);
  const [showHint, setShowHint] = useState(true);

  const graphRef = useRef(null);
  const controlsRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 700 });
  const graphHistoryRef = useRef([]);
  const lastClickRef = useRef({ id: null, time: 0 });

  const programCode = searchParams.get("program");
  const isProgramView = !!programCode;
  const { graph, setGraph, programCourses, programMeta } = useMindMeshData({
    isProgramView,
    session,
    programCode
  });

  const idOf = (v) => (v && typeof v === "object" ? v.id : v);
  const isAutoLayoutInProgress = useRef(false);
  const lastGraphSignature = useRef(null);

  useEffect(() => {
    if (!graph?.nodes?.length) return;
    if (isAutoLayoutInProgress.current) return;

    const currentSignature = graph.nodes.map(n => n.id).sort().join(',');
    if (lastGraphSignature.current === currentSignature) return;

    const t = setTimeout(() => {
      isAutoLayoutInProgress.current = true;
      lastGraphSignature.current = currentSignature;
      controlsRef.current?.autoLayout?.();
      setTimeout(() => {
        isAutoLayoutInProgress.current = false;
      }, 500);
    }, 150);

    return () => clearTimeout(t);
  }, [graph?.nodes]);

  // Hide hint after 4 seconds
  useEffect(() => {
    if (showHint) {
      const t = setTimeout(() => setShowHint(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showHint]);

  // Resize handling
  useEffect(() => {
    if (!containerRef.current) return;

    const computeSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const reserved = 140;
      const h = Math.max(420, viewportH - reserved);
      setCanvasSize({ w: Math.floor(rect.width), h });
    };

    const ro = new ResizeObserver(computeSize);
    ro.observe(containerRef.current);
    window.addEventListener("resize", computeSize, { passive: true });
    computeSize();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeSize);
    };
  }, []);

  useEffect(() => {
    if (!focusedNode || !graphRef.current) return;
    const interval = setInterval(() => {
    }, 100);
    return () => clearInterval(interval);
  }, [focusedNode]);

  // Layout & style helpers
  const isEdgeOfFocus = useCallback(
    (l) => {
      if (!focusedNode) return true;
      const s = idOf(l.source);
      const t = idOf(l.target);
      return s === focusedNode.id || t === focusedNode.id;
    },
    [focusedNode]
  );

  const linkColor = useCallback((l) => {
    const isFocused = !focusedNode || isEdgeOfFocus(l);
    if (l.logic_type === 'and') {
      return isFocused ? "#3b82f6" : "rgba(148,163,184,0.35)";
    }
    return isFocused ? "#8b5cf6" : "rgba(148,163,184,0.35)";
  }, [focusedNode, isEdgeOfFocus]);

  const linkWidth = useCallback((l) => {
    const isFocused = !focusedNode || isEdgeOfFocus(l);
    return isFocused ? 2 : 1;
  }, [focusedNode, isEdgeOfFocus]);

  const linkLineDash = useCallback((l) => {
    if (l.logic_type === 'and') return null;
    return [6, 6];
  }, []);

  // Neighbour helper
  const getDirectNeighbours = useCallback(
    (id) => {
      const set = new Set([id]);
      graph.links.forEach((l) => {
        const s = idOf(l.source), t = idOf(l.target);
        if (s === id) set.add(t);
        if (t === id) set.add(s);
      });
      return set;
    },
    [graph.links]
  );

  // Graph interactions
  const expandGlobalMindMesh = async (n) => {
    graphHistoryRef.current.push(graph);
    const courseKey = n.id;

    try {
      const { data: edgesData } = await supabase
        .from("mindmesh_edges_global")
        .select("from_key,to_key,edge_type,confidence,logic_type,group_id")
        .or(`from_key.eq."${courseKey}",to_key.eq."${courseKey}"`);

      if (!edgesData?.length) return;

      const connectedKeys = Array.from(new Set([courseKey, ...edgesData.flatMap((e) => [e.from_key, e.to_key])]));

      const { data: nodesData } = await supabase
        .from("mindmesh_nodes_global")
        .select("key,label,uoc,faculty,school,level")
        .in("key", connectedKeys);

      const nodes = (nodesData || []).map((n) => ({
        id: n.key,
        label: n.label || n.key,
        type: "course",
        metadata: { uoc: n.uoc, faculty: n.faculty, school: n.school, level: n.level },
      }));

      const nodeIds = new Set(nodes.map(n => n.id));
      const validEdges = edgesData.filter(e => nodeIds.has(e.from_key) && nodeIds.has(e.to_key));

      const links = validEdges.map((e) => ({
        source: e.from_key,
        target: e.to_key,
        type: e.edge_type,
        confidence: e.confidence,
        logic_type: e.logic_type || "and",
        group_id: e.group_id || null,
      }));

      setGraph({ nodes, links });
      setFocusedNode(null);
      setFrozen(false);
      requestAnimationFrame(() => graphRef.current?.zoomToFit(600, 80));
    } catch (err) {
      console.error("Error expanding node:", err);
    }
  };

  const handleNodeClick = async (node) => {
    setShowHint(false);

    const now = Date.now();
    const delta = now - lastClickRef.current.time;

    // double-click → expand
    if (lastClickRef.current.id === node.id && delta < 250) {
      lastClickRef.current = { id: null, time: 0 };
      await expandGlobalMindMesh(node);

      return;
    }

    // single click → focus + show button
    lastClickRef.current = { id: node.id, time: now };
    setFocusedNode((f) => (f?.id === node.id ? null : node));

  };

  // UI Controls
  const onBackgroundClick = () => setFocusedNode(null);
  const fitView = () => graphRef.current?.zoomToFit(400, 40);
  const toggleFreeze = () => setFrozen((f) => !f);

  const handleBackGraph = () => {
    if (graphHistoryRef.current.length === 0) return;
    const prev = graphHistoryRef.current.pop();
    setGraph(prev);
    setFocusedNode(null);
    setFrozen(false);
    requestAnimationFrame(() => graphRef.current?.zoomToFit(600, 80));
  };

  const handleHomeGraph = () => {
    if (graphHistoryRef.current.length === 0) return;
    const first = graphHistoryRef.current[0];
    graphHistoryRef.current = [];
    setGraph(first);
    setFocusedNode(null);
    setFrozen(false);
    requestAnimationFrame(() => graphRef.current?.zoomToFit(600, 80));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100
                    dark:from-slate-900 dark:via-slate-900 dark:to-slate-950
                    text-slate-900 dark:text-slate-100 transition-colors duration-300">

      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <GraphControls
        ref={controlsRef}
        graphHistory={graphHistoryRef}
        handleBack={handleBackGraph}
        handleHome={handleHomeGraph}
        fitView={fitView}
        toggleFreeze={toggleFreeze}
        frozen={frozen}
        graph={graph}
        setGraph={setGraph}
        canvasSize={canvasSize}
        graphRef={graphRef}
        setFrozen={setFrozen}
        isProgramView={isProgramView}
        programMeta={programMeta}
        programCourses={programCourses}
      />

      {/* Graph Canvas */}
      <div className="flex-grow flex justify-center px-4 relative">
        <div ref={containerRef} className="w-full max-w-[1600px] relative">

          {/* First-load hint */}
          {showHint && graph?.nodes?.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-slate-900/80 dark:bg-slate-100/90 text-white dark:text-slate-900 text-sm font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
                Click any course node to explore its prerequisites
              </div>
            </div>
          )}

          <MindMeshGraph
            ref={graphRef}
            graph={graph}
            canvasSize={canvasSize}
            focusedNode={focusedNode}
            handleNodeClick={handleNodeClick}
            onBackgroundClick={onBackgroundClick}
            setHoverLink={setHoverLink}
            nodeCanvasObject={(node, ctx) =>
              nodeCanvasObject(node, ctx, { focusedNode, getDirectNeighbours, colorFor })
            }
            nodePointerAreaPaint={nodePointerAreaPaint}
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkLineDash={linkLineDash}
          />
        </div>
      </div>

      {/* Bottom info panel — shown when a node is focused */}
      <MindMeshInfoPanel
        focusedNode={focusedNode}
        onDismiss={() => setFocusedNode(null)}
      />
    </div>
  );
}

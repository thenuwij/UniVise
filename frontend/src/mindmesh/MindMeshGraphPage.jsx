import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import GraphControls from "./components/GraphControls";
import Legend from "./components/Legend";
import { nodeCanvasObject, nodePointerAreaPaint } from "./components/NodeRenderer";
import useMindMeshData from "./hooks/useMindMeshData";
import { colorFor, levelStyle } from "./utils/index";
import MindMeshGraph from "./components/MindMeshGraph"; 
import MindMeshInfoPanel from "./components/MindMeshInfoPanel";


export default function MindMeshGraphPage() {
  // ------------------------------------------------------------
  // 1. Setup / Hooks
  // ------------------------------------------------------------
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [frozen, setFrozen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedNode, setFocusedNode] = useState(null);
  const [hoverLink, setHoverLink] = useState(null);

  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 700 });
  const graphHistoryRef = useRef([]);
  const lastClickRef = useRef({ id: null, time: 0 });

  const programCode = searchParams.get("program");
  const isProgramView = !!programCode;
  const { graph, setGraph, debugInfo, programCourses, programMeta } = useMindMeshData({ isProgramView, session, programCode });
  const idOf = (v) => (v && typeof v === "object" ? v.id : v);

  const [buttonPos, setButtonPos] = useState(null);


  // ------------------------------------------------------------
  // 2. Resize handling
  // ------------------------------------------------------------
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
    const pos = graphRef.current.graph2ScreenCoords(focusedNode.x, focusedNode.y);
    setButtonPos(pos);
  }, 100);
  return () => clearInterval(interval);
}, [focusedNode]);


  // ------------------------------------------------------------
  // 4. Layout & style helpers
  // ------------------------------------------------------------
  const isEdgeOfFocus = useCallback(
    (l) => {
      if (!focusedNode) return true;
      const s = idOf(l.source);
      const t = idOf(l.target);
      return s === focusedNode.id || t === focusedNode.id;
    },
    [focusedNode]
  );

  const linkColor = (l) => {
    const srcId = typeof l.source === "object" ? l.source.id : l.source;
    const srcNode = graph.nodes.find((n) => n.id === srcId);
    const lvl = parseInt(srcNode?.metadata?.level) || 1;
    const { color } = levelStyle(lvl);
    return !focusedNode || isEdgeOfFocus(l) ? color : "rgba(148,163,184,0.1)";
  };

  const linkWidth = (l) => {
    const srcId = typeof l.source === "object" ? l.source.id : l.source;
    const srcNode = graph.nodes.find((n) => n.id === srcId);
    const lvl = parseInt(srcNode?.metadata?.level) || 1;
    const { width } = levelStyle(lvl);
    return focusedNode && isEdgeOfFocus(l) ? width + 0.5 : width;
  };

  // ------------------------------------------------------------
  // 5. Neighbour helper
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // 6. Graph interactions
  // ------------------------------------------------------------
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
        id: n.key, label: n.label || n.key, type: "course",
        metadata: { uoc: n.uoc, faculty: n.faculty, school: n.school, level: n.level },
      }));

      setGraph({
        nodes,
        links: edgesData.map((e) => ({
          source: e.from_key, target: e.to_key, type: e.edge_type,
          confidence: e.confidence, logic_type: e.logic_type || "and", group_id: e.group_id || null,
        })),
      });
      setDebugInfo({ nodes, edges: edgesData });
      setFocusedNode(null);
      setFrozen(false);
      requestAnimationFrame(() => graphRef.current?.zoomToFit(600, 80));
    } catch (err) {
      console.error("Error expanding node:", err);
    }
  };

const handleNodeClick = async (node) => {
  const now = Date.now();
  const delta = now - lastClickRef.current.time;

  // double-click → expand
  if (lastClickRef.current.id === node.id && delta < 250) {
    lastClickRef.current = { id: null, time: 0 };
    await expandGlobalMindMesh(node);
    setButtonPos(null);
    return;
  }

  // single click → focus + show button
  lastClickRef.current = { id: node.id, time: now };
  setFocusedNode((f) => (f?.id === node.id ? null : node));

  if (graphRef.current && node) {
    const pos = graphRef.current.graph2ScreenCoords(node.x, node.y);
    setButtonPos(pos);
  }
};


  // ------------------------------------------------------------
  // 7. UI Controls
  // ------------------------------------------------------------
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

  const handleViewCourse = async () => {
    if (!focusedNode?.id) return;
    const { data: match } = await supabase
      .from("unsw_courses")
      .select("id")
      .eq("code", focusedNode.id)
      .maybeSingle();
    if (match?.id) navigate(`/course/${match.id}`);
  };


  // ------------------------------------------------------------
  // 8. Render
  // ------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      
      {/* Header + Controls */}
      <GraphControls
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
        focusedNode={focusedNode}         
        handleViewCourse={handleViewCourse} 
      />

      {/* Graph Canvas */}
      <div className="flex-grow flex justify-center px-4 relative">
        <div ref={containerRef} className="w-full max-w-[1600px] relative">
          <Legend />
          <MindMeshInfoPanel
            graph={graph}
            programCode={programCode}
            programMeta={programMeta}
            isProgramView={isProgramView}
            programCourses={programCourses}
          />
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
          />
        </div>

      </div>
    </div>
  );
}

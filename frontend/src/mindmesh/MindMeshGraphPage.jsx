// src/pages/MindMeshGraphPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import GraphControls from "./components/GraphControls";
import WelcomeModal from "./components/WelcomeModal";
import { nodeCanvasObject, nodePointerAreaPaint } from "./components/NodeRenderer";
import useMindMeshData from "./hooks/useMindMeshData";
import { colorFor, levelStyle } from "./utils/index";
import MindMeshGraph from "./components/MindMeshGraph"; 
import MindMeshInfoPanel from "./components/MindMeshInfoPanel";

export default function MindMeshGraphPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [frozen, setFrozen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedNode, setFocusedNode] = useState(null);
  const [hoverLink, setHoverLink] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 700 });
  const graphHistoryRef = useRef([]);
  const lastClickRef = useRef({ id: null, time: 0 });

  const programCode = searchParams.get("program");
  const isProgramView = !!programCode;
  const { graph, setGraph, debugInfo, programCourses, programMeta } = useMindMeshData({ 
    isProgramView, 
    session, 
    programCode 
  });
  
  const idOf = (v) => (v && typeof v === "object" ? v.id : v);
  const [buttonPos, setButtonPos] = useState(null);

  // Check if first time visiting
  useEffect(() => {
    const hasVisited = localStorage.getItem("mindmesh_visited");
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem("mindmesh_visited", "true");
    }
  }, []);

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
      const pos = graphRef.current.graph2ScreenCoords(focusedNode.x, focusedNode.y);
      setButtonPos(pos);
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

  // Color palette for OR groups 
  const getGroupColor = useCallback((groupId, link, isFocused) => {
    if (!isFocused) return "rgba(148,163,184,0.4)";
    
    // Hash ONLY the group_id to get consistent color for same group
    let hash = 0;
    for (let i = 0; i < groupId.length; i++) {
      hash = groupId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % 4; 
    
    // highly distinct colors, enough for most courses
    const colors = [
      "#3b82f6", // blue
      "#10b981", // emerald/green
      "#8b5cf6", // purple
      "#f59e0b", // amber/orange
    ];
    
    return colors[colorIndex];
  }, []);

  const linkColor = useCallback((l) => {
    const srcId = typeof l.source === "object" ? l.source.id : l.source;
    const tgtId = typeof l.target === "object" ? l.target.id : l.target;
    const srcNode = graph.nodes.find((n) => n.id === srcId);
    const lvl = parseInt(srcNode?.metadata?.level) || 1;
    const { color } = levelStyle(lvl);
    const isFocused = !focusedNode || isEdgeOfFocus(l);
    
    // Handle OR groups
    if (l.logic_type === 'or' || l.logic_type === 'or_group') {
      // Count how many unique OR groups this target course has
      const targetOrGroups = new Set(
        graph.links
          .filter(link => {
            const linkTgt = typeof link.target === "object" ? link.target.id : link.target;
            return linkTgt === tgtId && 
                  (link.logic_type === 'or' || link.logic_type === 'or_group') && 
                  link.group_id;
          })
          .map(link => link.group_id)
      );
      
      // If only ONE OR group → use single blue color
      if (targetOrGroups.size <= 1) {
        return isFocused ? "#3b82f6" : "rgba(59,130,246,0.4)";
      }
      
      // If MULTIPLE OR groups → color-code by level
      if (l.group_id) {
        return getGroupColor(l.group_id, l, isFocused);
      }
      
      // Fallback
      return isFocused ? "#3b82f6" : "rgba(59,130,246,0.4)";
    }
    
    // AND (solid) edges use level-based color
    return isFocused ? color : "rgba(148,163,184,0.35)";
  }, [graph.nodes, graph.links, focusedNode, isEdgeOfFocus, getGroupColor]);

  const linkWidth = useCallback((l) => {
    const srcId = typeof l.source === "object" ? l.source.id : l.source;
    const srcNode = graph.nodes.find((n) => n.id === srcId);
    const lvl = parseInt(srcNode?.metadata?.level) || 1;
    const { width } = levelStyle(lvl);
    const isFocused = !focusedNode || isEdgeOfFocus(l);
    
    return isFocused ? width + 0.5 : width;
  }, [graph.nodes, focusedNode, isEdgeOfFocus]);

  const linkLineDash = useCallback((l) => {
    // Solid lines for AND 
    if (l.logic_type === 'and') {
      return null; // solid line
    }
    
    // Dashed lines for OR and OR_GROUP (alternatives)
    if (l.logic_type === 'or' || l.logic_type === 'or_group') {
      return [6, 6]; 
    }

    return null;
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

      console.log("Expand node:", courseKey);
      console.log("  - Edges fetched:", edgesData.length);
      console.log("  - Connected keys:", connectedKeys.length);
      console.log("  - Nodes fetched:", nodesData?.length || 0);

      const nodes = (nodesData || []).map((n) => ({
        id: n.key, 
        label: n.label || n.key, 
        type: "course",
        metadata: { uoc: n.uoc, faculty: n.faculty, school: n.school, level: n.level },
      }));

      // Filter out edges where nodes don't exist
      const nodeIds = new Set(nodes.map(n => n.id));
      const validEdges = edgesData.filter(e => nodeIds.has(e.from_key) && nodeIds.has(e.to_key));
      
      console.log("  - Valid edges (both nodes exist):", validEdges.length);
      console.log("  - Invalid edges removed:", edgesData.length - validEdges.length);

      const links = validEdges.map((e) => ({
        source: e.from_key, 
        target: e.to_key, 
        type: e.edge_type,
        confidence: e.confidence, 
        logic_type: e.logic_type || "and", 
        group_id: e.group_id || null,
      }));

      setGraph({
        nodes,
        links,
      });
      
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

  const handleViewCourse = async () => {
    if (!focusedNode?.id) return;
    const { data: match } = await supabase
      .from("unsw_courses")
      .select("id")
      .eq("code", focusedNode.id)
      .maybeSingle();
    if (match?.id) navigate(`/course/${match.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 
                    dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 
                    text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      
      {/* Welcome Modal */}
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      
      {/* Header and Controls */}
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
        onShowHelp={() => setShowWelcome(true)}
      />

      {/* Graph Canvas */}
      <div className="flex-grow flex justify-center px-4 relative">
        <div ref={containerRef} className="w-full max-w-[1600px] relative">
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
            linkLineDash={linkLineDash}
          />
        </div>
      </div>
    </div>
  );
}
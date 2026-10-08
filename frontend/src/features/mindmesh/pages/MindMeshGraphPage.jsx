// src/pages/MindMeshGraphPage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase";
import { UserAuth } from "@/app/AuthContext";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import GraphControls from "../components/GraphControls";
import { nodeCanvasObject, nodePointerAreaPaint } from "../components/NodeRenderer";
import useMindMeshData from "../hooks/useMindMeshData";
import { colorFor } from "../utils/index";
import MindMeshGraph from "../components/MindMeshGraph";
import MindMeshInfoPanel from "../components/MindMeshInfoPanel";
import StatusLegend from "../components/StatusLegend";
import PicksPanel from "../components/PicksPanel";
import ElectivesPanel from "../components/ElectivesPanel";
import { useCoursePicks } from "../hooks/useCoursePicks";
import { STATUS, courseStatus, prereqGroups } from "../utils/availability";
import { hasSeenGuide } from "../utils/onboarding";
import { useEnrolledProgram } from "@/features/roadmap/hooks/useEnrolledProgram";
import { setCourseCompleted } from "@/features/transfer/utils/completedCourses";
import { setCourseAdded } from "@/features/roadmap/utils/programCourses";
import { notNeededCodes } from "@/features/roadmap/utils/myCourses";
import { ArrowRight, Plus, X } from "lucide-react";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";

export default function MindMeshGraphPage() {
  const { session } = UserAuth();
  const [searchParams] = useSearchParams();

  const [frozen, setFrozen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedNode, setFocusedNode] = useState(null);
  const [, setHoverLink] = useState(null);
  const [showHint, setShowHint] = useState(() => hasSeenGuide());

  const graphRef = useRef(null);
  const controlsRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 700 });
  const graphHistoryRef = useRef([]);
  const lastClickRef = useRef({ id: null, time: 0 });

  const { program: enrolled, loading: enrolledLoading } = useEnrolledProgram();
  const programCode = searchParams.get("program") || enrolled?.degree_code || null;
  const userId = session?.user?.id;
  const {
    graph, setGraph, programMeta, loading, thin, mine, reload,
    completed, completedRows, setCompletedRows, prereqEdges, addPrereqEdges,
  } = useMindMeshData({ programCode, userId });
  const noProgram = !programCode && !enrolledLoading;
  const noCourses = !!programCode && !loading && !graph.nodes.length;
  const needsSpecialisation = !!programCode && !loading && thin;
  const [savingDone, setSavingDone] = useState(false);
  const groups = useMemo(() => prereqGroups(prereqEdges), [prereqEdges]);
  const notNeeded = useMemo(() => (mine ? notNeededCodes(mine, completed, mine.added) : new Set()), [mine, completed]);
  const statusOf = useCallback(
    (code) => (notNeeded.has(code) ? "not_needed" : courseStatus(code, completed, groups)),
    [notNeeded, completed, groups]
  );
  const isOwnProgram = !!programCode && programCode === enrolled?.degree_code;
  const counts = useMemo(() => {
    const c = { completed: 0, available: 0, locked: 0 };
    for (const n of graph?.nodes || []) {
      const st = statusOf(n.id);
      if (st in c) c[st] += 1;
    }
    return c;
  }, [graph?.nodes, statusOf]);
  const coursePicks = useCoursePicks(isOwnProgram);
  const pickCodes = useMemo(() => new Set(coursePicks.picks.map((p) => p.code)), [coursePicks.picks]);
  const isPick = useCallback((code) => pickCodes.has(code), [pickCodes]);
  const [showElectives, setShowElectives] = useState(false);
  const [savingAdded, setSavingAdded] = useState(false);
  const options = useMemo(() => new Map((mine?.options || []).map((o) => [o.code, o])), [mine]);
  const canAdd = useCallback(
    (code) => options.has(code) && !graph.nodes.some((n) => n.id === code),
    [options, graph.nodes]
  );

  const toggleAdded = async (option, added) => {
    if (!userId || !option || savingAdded) return;
    setSavingAdded(true);
    try {
      await setCourseAdded({ userId, course: option, section: option.section, added });
      await reload();
    } catch (err) {
      console.error("Error saving elective:", err);
    } finally {
      setSavingAdded(false);
    }
  };

  const toggleDone = async (node) => {
    if (!userId || savingDone) return;
    const existing = completedRows[node.id];
    const isCompleted = !existing?.is_completed;
    setSavingDone(true);
    setCompletedRows((prev) => ({ ...prev, [node.id]: { ...existing, course_code: node.id, is_completed: isCompleted } }));
    try {
      const row = await setCourseCompleted({
        userId,
        course: { code: node.id, name: node.label, uoc: node.metadata?.uoc },
        existing,
        isCompleted,
      });
      setCompletedRows((prev) => ({ ...prev, [node.id]: row }));
    } catch (err) {
      console.error("Error saving course:", err);
      setCompletedRows((prev) => ({ ...prev, [node.id]: existing }));
    } finally {
      setSavingDone(false);
    }
  };

  const focusCourse = (code) => {
    const node = graph.nodes.find((n) => n.id === code);
    if (!node) return;
    setShowHint(false);
    setFocusedNode(node);
    graphRef.current?.centerAt(node.x, node.y, 600);
  };

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
      const t = setTimeout(() => setShowHint(false), 8000);
      return () => clearTimeout(t);
    }
  }, [showHint]);

  // Resize handling
  useEffect(() => {
    if (!containerRef.current) return;

    const computeSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasSize({ w: Math.floor(rect.width), h: Math.max(320, Math.floor(rect.height)) });
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
    return isFocused ? "#3b82f6" : "rgba(148,163,184,0.35)";
  }, [focusedNode, isEdgeOfFocus]);

  const linkWidth = useCallback((l) => {
    const isFocused = !focusedNode || isEdgeOfFocus(l);
    return isFocused ? 2 : 1;
  }, [focusedNode, isEdgeOfFocus]);

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

      await addPrereqEdges(nodes.map((node) => node.id));

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
    <div className="flex flex-col min-h-screen md:h-[100dvh] md:overflow-hidden app-page text-slate-900 dark:text-slate-100 transition-colors duration-300">

      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <section className="relative overflow-hidden bg-gradient-to-r from-brand-navy via-brand-blue to-brand-indigo dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div aria-hidden className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-blue-300/15 dark:bg-blue-400/10" />
        <div className="relative max-w-[1600px] mx-auto px-5 md:px-8 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-band-soft">CourseMesh</p>
            <h1 className="truncate text-lg md:text-xl font-extrabold text-band-ink">
              {programMeta?.program_name || programCode || "How your courses connect"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {isOwnProgram && graph?.nodes?.length > 0 && (
              <>
                {[["completed", "done"], ["available", "available now"], ["locked", "to go"]].map(([key, text]) => (
                  <span key={key} className="inline-flex items-center gap-2 text-sm text-band-soft">
                    <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white/40" style={{ backgroundColor: STATUS[key].color }} />
                    <span className="font-bold text-band-ink">{counts[key]}</span> {text}
                  </span>
                ))}
                <Link
                  to={roadmapStepUrl("structure")}
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-blue-700 bg-white shadow-md hover:bg-blue-50 hover:-translate-y-0.5 dark:bg-slate-100 dark:text-blue-900 transition-all"
                >
                  Tick courses in your roadmap
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
            {isOwnProgram && options.size > 0 && (
              <button
                onClick={() => setShowElectives(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-blue-700 bg-white/90 shadow-md hover:bg-white hover:-translate-y-0.5 dark:bg-slate-100 dark:text-blue-900 transition-all"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add electives
              </button>
            )}
          </div>
        </div>
      </section>

      {showElectives && (
        <ElectivesPanel
          options={mine?.options || []}
          added={mine?.added || new Set()}
          completed={completed}
          saving={savingAdded}
          onToggle={toggleAdded}
          onClose={() => setShowElectives(false)}
        />
      )}

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
      />

      {/* Graph Canvas */}
      <div className="flex-1 min-h-0 flex justify-center px-3 pt-2 pb-3 relative">
        <div ref={containerRef} className="w-full max-w-[1600px] h-[70vh] md:h-full relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg shadow-blue-900/5">

          {(noProgram || noCourses || needsSpecialisation) && (
            <div className="absolute inset-x-0 top-16 z-10 flex justify-center px-4">
              <div className="max-w-md p-6 rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-200 dark:from-blue-950/60 dark:via-slate-900 dark:to-indigo-950/60 shadow-lg text-center">
                <p className="text-[15px] font-medium text-ink-strong">
                  {noProgram
                    ? "We don't know your program yet, so there is nothing to show here."
                    : "Most of this program's courses sit inside its majors or streams. Choose yours in your roadmap to see them here."}
                </p>
                <Link
                  to={noProgram ? "/roadmap-entryload" : `/roadmap?program=${programCode}`}
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-[15px] font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  {noProgram ? "Open Roadmap" : "Choose your major or stream"}
                </Link>
              </div>
            </div>
          )}

          {graph?.nodes?.length > 0 && <StatusLegend />}

          {graph?.nodes?.length > 0 && !focusedNode && (
            <p className="absolute bottom-3 left-4 z-10 px-3 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 border border-line pointer-events-none">
              Scroll to zoom · drag to move
            </p>
          )}

          {isOwnProgram && graph?.nodes?.length > 0 && (
            <PicksPanel
              picks={coursePicks.picks}
              loading={coursePicks.loading}
              failed={coursePicks.failed}
              onRetry={coursePicks.retry}
              onSelect={focusCourse}
              canAdd={canAdd}
              onAdd={(code) => toggleAdded(options.get(code), true)}
              saving={savingAdded}
            />
          )}

          {/* First-load hint */}
          {showHint && graph?.nodes?.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-3 pl-4 pr-2 py-2 rounded-full text-sm font-medium text-blue-800 dark:text-blue-100 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 shadow-lg">
                Tip: click any course to see what it needs and what it unlocks
                <button
                  onClick={() => setShowHint(false)}
                  aria-label="Dismiss tip"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
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
              nodeCanvasObject(node, ctx, { focusedNode, getDirectNeighbours, colorFor, statusOf, isPick })
            }
            nodePointerAreaPaint={nodePointerAreaPaint}
            linkColor={linkColor}
            linkWidth={linkWidth}
          />
          <MindMeshInfoPanel
            focusedNode={focusedNode}
            status={focusedNode ? statusOf(focusedNode.id) : null}
            requirements={focusedNode ? groups.get(focusedNode.id) || [] : []}
            completed={completed}
            onToggleDone={isOwnProgram ? toggleDone : null}
            saving={savingDone}
            onDismiss={() => setFocusedNode(null)}
          />
        </div>
      </div>
    </div>
  );
}

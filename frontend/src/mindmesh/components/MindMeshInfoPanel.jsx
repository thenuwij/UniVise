// src/mindmesh/components/MindMeshInfoPanel.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { GripVertical, ChevronDown, ChevronRight } from "lucide-react";

export default function MindMeshInfoPanel({
  graph,
  programCode,
  isProgramView,
  programCourses = [],
  programMeta,
}) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState([]);
  const [missing, setMissing] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  // ----- derive loaded/missing -----
  useEffect(() => {
    if (!isProgramView || !programCourses.length || !graph?.nodes?.length) return;
    const nodeSet = new Set(graph.nodes.map((n) => n.id));
    setLoaded(programCourses.filter((c) => nodeSet.has(c.code)));
    setMissing(programCourses.filter((c) => !nodeSet.has(c.code)));
  }, [graph, programCourses, isProgramView]);

  if (!isProgramView) return null;

  // ----- draggable setup -----
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  const onPointerDown = (e) => {
    if (!e.target.closest(".drag-handle")) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    origin.current = { x: pos.x, y: pos.y };
    panelRef.current?.setPointerCapture?.(e.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const pad = 12;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const el = panelRef.current;
    const rectW = el?.offsetWidth || 320;
    const rectH = el?.offsetHeight || 240;
    const nextX = Math.min(Math.max(origin.current.x + dx, -w + rectW + pad), w - pad);
    const nextY = Math.min(Math.max(origin.current.y + dy, pad), h - rectH - pad);
    setPos({ x: nextX, y: nextY });
  };

  const onPointerUp = (e) => {
    dragging.current = false;
    panelRef.current?.releasePointerCapture?.(e.pointerId);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.removeEventListener("pointermove", onPointerMove);
  };

  // --- graph stats ---
  const totalNodes = graph?.nodes?.length || 0;
  const totalEdges = graph?.links?.length || 0;

  // --- group by level helper ---
  function groupByLevel(courses = []) {
    const grouped = { 1: [], 2: [], 3: [], 4: [], other: [] };
    for (const c of courses) {
      const match = c.code?.match(/\d+/);
      const digit = match ? match[0][0] : null;
      if (digit === "1") grouped[1].push(c);
      else if (digit === "2") grouped[2].push(c);
      else if (digit === "3") grouped[3].push(c);
      else if (digit === "4" || digit === "5" || digit === "6") grouped[4].push(c);
      else grouped.other.push(c);
    }
    return grouped;
  }

  const loadedByLevel = useMemo(() => groupByLevel(loaded), [loaded]);
  const missingByLevel = useMemo(() => groupByLevel(missing), [missing]);

  // --- handle course click (same as ProgramStructure) ---
  const handleCourseClick = async (course) => {
    if (!course?.code) return;
    try {
      const { data: match } = await supabase
        .from("unsw_courses")
        .select("id")
        .eq("code", course.code)
        .maybeSingle();

      if (match?.id) navigate(`/course/${match.id}`);
    } catch (err) {
      console.error("Failed to navigate to course:", err);
    }
  };

  // --- render grouped courses ---
  const renderGroupedCourses = (grouped, variant = "loaded") => {
    const blocks = Object.entries(grouped).filter(([, list]) => list.length);
    const isLoaded = variant === "loaded";

    return blocks.length ? (
      blocks.map(([lvl, list]) => (
        <div key={lvl}>
          <h5
            className={`text-[11px] font-semibold uppercase tracking-wide mb-1 mt-2 ${
              isLoaded ? "text-sky-300" : "text-red-400"
            }`}
          >
            {lvl === "other" ? "Other" : `Level ${lvl}`}
          </h5>
          <ul className="space-y-1.5">
            {list.map((c) => (
              <li
                key={c.code}
                onClick={() => handleCourseClick(c)}
                className={`flex flex-col cursor-pointer ${
                  isLoaded
                    ? "bg-slate-700/40 hover:bg-sky-700/30"
                    : "bg-red-900/30 hover:bg-red-800/30"
                } px-2.5 py-1.5 rounded-md text-[11px] transition-all duration-200 hover:-translate-y-[1px]`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold ${
                      isLoaded
                        ? "text-sky-300 hover:text-sky-200"
                        : "text-red-400 hover:text-red-300"
                    }`}
                  >
                    {c.code}
                  </span>
                  <span className={isLoaded ? "text-slate-400" : "text-red-300"}>
                    {c.uoc ? `${c.uoc} UOC` : ""}
                  </span>
                </div>
                <span
                  className={isLoaded ? "truncate text-slate-200" : "truncate text-red-200"}
                >
                  {c.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))
    ) : (
      <p className="text-xs text-slate-500 italic">None.</p>
    );
  };

  return (
    <div
      ref={panelRef}
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        top: 24,
        right: 24,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
      }}
      className="z-30 w-80 bg-slate-900/85 text-slate-200 rounded-2xl shadow-xl border border-slate-700 backdrop-blur-lg select-none"
    >
      {/* Header */}
      <div
        className="drag-handle flex items-center justify-between px-4 py-3 border-b border-slate-700 cursor-grab active:cursor-grabbing"
        onDoubleClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-slate-400" />
          <h2 className="text-lg font-bold text-sky-300 tracking-wide drop-shadow-sm">
            Mesh Info
          </h2>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-2 p-1 hover:bg-slate-700/50 rounded-md transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Collapsible content */}
      {!collapsed && (
        <div className="p-3 space-y-4 max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/30">
          {/* Program info */}
          {programMeta && (
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-300">
                Degree:{" "}
                <span className="text-sky-300">{programMeta.program_name || programCode}</span>
              </p>
              {programMeta.degree_code && <p className="text-slate-400">Code: {programMeta.degree_code}</p>}
              {programMeta.faculty && <p className="text-slate-400">Faculty: {programMeta.faculty}</p>}
            </div>
          )}

          {/* Graph stats */}
          <div className="text-xs text-slate-400 space-y-0.5">
            <p><span className="text-slate-300 font-semibold">Loaded Courses:</span> {loaded.length}</p>
            <p><span className="text-slate-300 font-semibold">Missing Courses:</span> {missing.length}</p>
          </div>

          {/* Loaded grouped */}
          <div>
            <h4 className="text-xs font-semibold text-sky-300 uppercase tracking-wide">Loaded Courses</h4>
            {renderGroupedCourses(loadedByLevel, "loaded")}
          </div>

          {/* Missing grouped */}
          <div>
            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide">Missing Courses</h4>
            {renderGroupedCourses(missingByLevel, "missing")}
          </div>
        </div>
      )}
    </div>
  );
}

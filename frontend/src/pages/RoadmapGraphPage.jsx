// src/pages/RoadmapGraphPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { supabase } from "../supabaseClient";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import AutoLayoutControls from "../components/mindmesh/AutoLayoutControls";

export default function RoadmapGraphPage() {
  const { degreeCode } = useParams(); // from /roadmap-graph/:degreeCode
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [frozen, setFrozen] = useState(false);
  const [hoverLink, setHoverLink] = useState(null);

  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 700 });

  // Resize canvas to container
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
    window.addEventListener("resize", computeSize);
    computeSize();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeSize);
    };
  }, []);

  // Fetch graph (nodes + edges)
  const fetchGraph = useCallback(async () => {
    if (!degreeCode) return;

    try {
      // 1. Get edges for this degree
      const { data: edges, error: eErr } = await supabase
        .from("course_edges")
        .select("from_course, to_course, edge_type")
        .eq("degree_code", degreeCode);

      if (eErr) throw eErr;
      if (!edges || edges.length === 0) {
        setGraph({ nodes: [], links: [] });
        return;
      }

      // 2. Collect all course codes
      const courseCodes = [
        ...new Set(edges.flatMap(e => [e.from_course, e.to_course]))
      ];

      // 3. Fetch course metadata
      const { data: courses, error: cErr } = await supabase
        .from("unsw_courses")
        .select("id, code, title, uoc")
        .in("code", courseCodes);

      if (cErr) throw cErr;

      // 4. Build nodes
      const nodes = (courses ?? []).map(c => ({
        id: c.code,
        label: c.title || c.code,
        type: "course",
        metadata: { code: c.code, uoc: c.uoc }
      }));

      // 5. Build links
      const links = (edges ?? []).map(e => ({
        source: e.from_course,
        target: e.to_course,
        type: e.edge_type
      }));

      setGraph({ nodes, links });
    } catch (err) {
      console.error("[RoadmapGraph] fetchGraph error:", err.message);
    }
  }, [degreeCode]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  const hasNodes = graph.nodes.length > 0;

  // --- Styling ---
  const colorFor = (type) =>
    type === "degree" ? "#2563eb" : type === "specialisation" ? "#7c3aed" : "#0ea5e9";

  const idOf = n => (typeof n === "object" ? n.id : n);

  const linkColor = (l) => {
    if (hoverLink === l) return "rgba(255,255,255,0.95)";
    if (l.type === "co_req") return "rgba(148,163,184,0.6)";
    return "rgba(203,213,225,0.9)"; // prereq default
  };

  const linkWidth = (l) => {
    const base = l.type === "co_req" ? 1.2 : 1.6; // prereq thicker
    return hoverLink === l ? base + 1.2 : base;
  };

  const linkCanvasObject = (link, ctx) => {
    if (link.type !== "co_req") return;
    const src = typeof link.source === "object" ? link.source : null;
    const trg = typeof link.target === "object" ? link.target : null;
    if (!src || !trg || src.x == null || trg.x == null) return;

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = linkWidth(link);
    ctx.strokeStyle = linkColor(link);
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(trg.x, trg.y);
    ctx.stroke();
    ctx.restore();
  };

  const nodeLabel = useCallback((n) => {
    const lines = [n.label || n.id, `Type: ${n.type}`];
    if (n.metadata?.code) lines.push(`Code: ${n.metadata.code}`);
    if (n.metadata?.uoc != null) lines.push(`UOC: ${n.metadata.uoc}`);
    return lines.join("\n");
  }, []);

  const nodeCanvasObject = useCallback((node, ctx) => {
    const title = node.label || node.id;
    const sub = node.metadata?.uoc ? `${node.metadata.uoc} UOC` : "";

    const titleSize = 14;
    const subSize = sub ? 12 : 0;
    const padX = 12, padY = 9, gapY = sub ? 3 : 0;
    const radius = 10;

    ctx.font = `${titleSize}px Inter, system-ui, -apple-system`;
    const titleW = ctx.measureText(title).width;
    ctx.font = `${subSize || titleSize}px Inter, system-ui, -apple-system`;
    const subW = sub ? ctx.measureText(sub).width : 0;
    const textW = Math.max(titleW, subW);
    const h = titleSize + (sub ? gapY + subSize : 0) + padY * 2;
    const w = textW + padX * 2;

    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = colorFor(node.type) + "80";

    ctx.fillStyle = colorFor(node.type);
    roundRect(ctx, node.x - w / 2, node.y - h / 2, w, h, radius);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `${titleSize}px Inter, system-ui, -apple-system`;
    const titleY = node.y - (sub ? (subSize + gapY) / 2 : 0);
    ctx.fillText(title, node.x, titleY);

    if (sub) {
      ctx.globalAlpha = 0.95;
      ctx.font = `${subSize}px Inter, system-ui, -apple-system`;
      const subY = node.y + (titleSize + gapY) / 2;
      ctx.fillText(sub, node.x, subY);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, []);

  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    const title = node.label || node.id;
    const sub = node.metadata?.uoc ? `${node.metadata.uoc} UOC` : "";

    const titleSize = 14;
    const subSize = sub ? 12 : 0;
    const padX = 12, padY = 9, gapY = sub ? 3 : 0;
    const radius = 10;

    ctx.font = `${titleSize}px Inter, system-ui, -apple-system`;
    const titleW = ctx.measureText(title).width;
    ctx.font = `${subSize || titleSize}px Inter, system-ui, -apple-system`;
    const subW = sub ? ctx.measureText(sub).width : 0;
    const textW = Math.max(titleW, subW);
    const h = titleSize + (sub ? gapY + subSize : 0) + padY * 2;
    const w = textW + padX * 2;

    ctx.fillStyle = color;
    roundRect(ctx, node.x - w / 2, node.y - h / 2, w, h, radius);
    ctx.fill();
  }, []);

  const fitView = () => {
    if (!graphRef.current) return;
    graphRef.current.zoomToFit(400, 40);
  };
  const toggleFreeze = () => setFrozen((f) => !f);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-semibold">Course Pathway</h1>
          <p className="text-sm text-slate-300/80">
            Visualised course structure for {degreeCode}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fitView} className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm">
            Fit
          </button>
          <button
            onClick={toggleFreeze}
            className={`px-3 py-2 rounded-xl border text-sm ${
              frozen ? "border-emerald-600 bg-emerald-700/20 text-emerald-300" : "border-slate-700 bg-slate-800 hover:bg-slate-700"
            }`}
          >
            {frozen ? "Unfreeze" : "Freeze"}
          </button>
          <AutoLayoutControls
            graph={graph}
            setGraph={setGraph}
            canvasSize={canvasSize}
            graphRef={graphRef}
            setFrozen={setFrozen}
          />
        </div>
      </div>

      <div className="flex-grow flex justify-center px-4">
        <div ref={containerRef} className="w-full max-w-[1600px] relative">
          {hasNodes ? (
            <ForceGraph2D
              ref={graphRef}
              graphData={graph}
              nodeId="id"
              width={canvasSize.w}
              height={canvasSize.h}
              backgroundColor="rgba(15,23,42,1)"
              nodeRelSize={7}
              cooldownTicks={frozen ? 0 : 120}
              onEngineStop={() => {
                if (!frozen) setFrozen(true);
              }}
              linkColor={linkColor}
              linkWidth={linkWidth}
              linkOpacity={0.9}
              linkDirectionalParticles={l => (l.type === "prereq" ? 2 : 0)}
              linkDirectionalParticleSpeed={0.004}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={0.92}
              linkCanvasObject={linkCanvasObject}
              linkCanvasObjectMode={() => 'after'}
              linkLabel={l =>
                l.type === "prereq"
                  ? `${idOf(l.source)} is a prerequisite of ${idOf(l.target)}`
                  : l.type === "co_req"
                  ? `${idOf(l.source)} must be taken with ${idOf(l.target)}`
                  : `${idOf(l.source)} → ${idOf(l.target)} (${l.type})`
              }
              nodeLabel={nodeLabel}
              nodeCanvasObject={nodeCanvasObject}
              nodePointerAreaPaint={nodePointerAreaPaint}
              onLinkHover={setHoverLink}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm">
              No course edges found for this program.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

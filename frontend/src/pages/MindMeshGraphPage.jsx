// src/pages/MindMeshGraphPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import AutoLayoutControls from "../components/mindmesh/AutoLayoutControls";


export default function MindMeshGraphPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [frozen, setFrozen] = useState(false);
  const [hoverLink, setHoverLink] = useState(null);

  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 700 });


  // Resize canvas to the container width + viewport height minus top bars
  useEffect(() => {
    if (!containerRef.current) return;

    const computeSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const reserved = 140; // approx space used by nav + top bar
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
    const userId = session?.user?.id;
    if (!userId) return;

    const { data: mesh, error: mErr } = await supabase
      .from("mindmeshes")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (mErr) {
      console.error(mErr);
      return;
    }
    const meshId = mesh?.id;
    if (!meshId) return;

    const { data: items, error: iErr } = await supabase
      .from("mindmesh_items")
      .select("item_type,item_key,title,tags,metadata,source_table,source_id")
      .eq("user_id", userId)
      .eq("mesh_id", meshId);
    if (iErr) console.error(iErr);

    const { data: edges, error: eErr } = await supabase
      .from("mindmesh_edges")
      .select("from_key,to_key,edge_type,confidence")
      .eq("user_id", userId)
      .eq("mesh_id", meshId);
    if (eErr) console.error(eErr);

    const nodes = (items ?? []).map((it) => ({
      id: it.item_key, // <- link keys must match these exactly
      label: it.title,
      type: it.item_type, // 'degree' | 'specialisation' | 'course'
      tags: it.tags || [],
      metadata: it.metadata || {},
      sourceTable: it.source_table || null,
      sourceId: it.source_id || null,
    }));

    // Build links, then drop any whose endpoints don't exist
    const rawLinks = (edges ?? []).map((e) => ({
      source: e.from_key,
      target: e.to_key,
      type: e.edge_type, // 'prereq' | 'co_req' | 'belongs_to' | 'theme' | 'ai_inferred'
      confidence: e.confidence,
    }));
    const idSet = new Set(nodes.map((n) => n.id));
    const links = rawLinks.filter((l) => idSet.has(l.source) && idSet.has(l.target));
    const pruned = rawLinks.length - links.length;
    if (pruned > 0) {
      console.warn(`[MindMesh] Pruned ${pruned} orphan link(s) with missing nodes`);
    }

    setGraph({ nodes, links });
  }, [session?.user?.id]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // Live refresh on add/remove
  useEffect(() => {
    const onChanged = () => fetchGraph();
    window.addEventListener("mindmesh:changed", onChanged);
    return () => window.removeEventListener("mindmesh:changed", onChanged);
  }, [fetchGraph]);

  const hasNodes = graph.nodes.length > 0;

  // Colors per type
  const colorFor = (type) =>
    type === "degree" ? "#2563eb" : type === "specialisation" ? "#7c3aed" : "#0ea5e9";

  const idOf = n => (typeof n === "object" ? n.id : n);

// Link styling
const linkColor = (l) => {
  if (hoverLink === l) return "rgba(255,255,255,0.95)";     
  if (l.type === "ai_inferred") return "rgba(148,163,184,0.45)";
  if (l.type === "theme") return "rgba(148,163,184,0.6)";
  return "rgba(203,213,225,0.9)"; // prereq / belongs_to / co_req default
};

const linkWidth = (l) => {
  const base =
    l.type === "ai_inferred" ? 0.6 :
    l.type === "co_req"      ? 1.2 :
    l.type === "belongs_to"  ? 1   :
    l.type === "theme"       ? 0.8 :
                               1.6; // prereq
  return hoverLink === l ? base + 1.2 : base;
};


  // SAFE: only draw dashed overlay when coords exist (source/target may be IDs initially)
  const linkCanvasObject = (link, ctx) => {
    if (link.type !== "co_req") return;
    const src = typeof link.source === "object" ? link.source : null;
    const trg = typeof link.target === "object" ? link.target : null;
    if (!src || !trg || src.x == null || src.y == null || trg.x == null || trg.y == null) return;

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

  // Tooltip content with metadata
  const nodeLabel = useCallback((n) => {
    const lines = [n.label || n.id, `Type: ${n.type}`];
    if (n.type === "course") {
      const code = n.metadata?.code || n.id;
      const uoc = n.metadata?.uoc;
      if (code) lines.push(`Code: ${code}`);
      if (uoc != null) lines.push(`UOC: ${uoc}`);
      if (n.metadata?.term) lines.push(`Term: ${n.metadata.term}`);
    } else if (n.type === "degree") {
      if (n.metadata?.uac_code) lines.push(`UAC: ${n.metadata.uac_code}`);
      if (n.metadata?.total_uoc != null) lines.push(`Total UOC: ${n.metadata.total_uoc}`);
    }
    return lines.join("\n");
  }, []);

  // Node renderer: larger "cards" with subline + glow
  const nodeCanvasObject = useCallback((node, ctx) => {
    const title = node.label || node.id;
    const sub =
      node.type === "course"
        ? [node.metadata?.code || node.id, node.metadata?.uoc != null ? `${node.metadata.uoc} UOC` : null]
            .filter(Boolean)
            .join(" · ")
        : node.type === "degree"
        ? [
            node.metadata?.uac_code ? `UAC ${node.metadata.uac_code}` : null,
            node.metadata?.total_uoc != null ? `${node.metadata.total_uoc} UOC` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : "";

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

    ctx.lineWidth = 1;
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

  // Expand pointer hit area to match card size
  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    const title = node.label || node.id;
    const sub =
      node.type === "course"
        ? [node.metadata?.code || node.id, node.metadata?.uoc != null ? `${node.metadata.uoc} UOC` : null]
            .filter(Boolean)
            .join(" · ")
        : node.type === "degree"
        ? [
            node.metadata?.uac_code ? `UAC ${node.metadata.uac_code}` : null,
            node.metadata?.total_uoc != null ? `${node.metadata.total_uoc} UOC` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : "";

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

  // Click → navigate to details
  const onNodeClick = useCallback((n) => {
    if (!n?.sourceTable || !n?.sourceId) return;
    if (n.sourceTable === "unsw_degrees") navigate(`/degrees/${n.sourceId}`);
    else if (n.sourceTable === "unsw_courses") navigate(`/course/${n.sourceId}`); // NOTE: singular
    else if (n.sourceTable === "unsw_specialisations") navigate(`/specialisations/${n.sourceId}`);
  }, [navigate]);

  // Toolbar
  const fitView = () => {
    if (!graphRef.current) return;
    graphRef.current.zoomToFit(400, 40);
  };
  const toggleFreeze = () => setFrozen((f) => !f);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      {/* Top bar with title + toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-semibold">MindMesh</h1>
          <p className="text-sm text-slate-300/80">Interactive graph of your selected degrees and courses.</p>
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

      {/* Graph area with comfortable max width */}
      <div className="flex-grow flex justify-center px-4">
        <div ref={containerRef} className="w-full max-w-[1600px] relative">
          {/* Legend overlaid inside the graph container */}
          <div className="absolute top-4 left-4 z-10 bg-slate-800/70 rounded-lg px-3 py-2 text-xs text-slate-300 backdrop-blur">
            <div className="flex flex-wrap gap-3">
              <LegendDot color="#2563eb" label="Degree" />
              <LegendDot color="#7c3aed" label="Specialisation" />
              <LegendDot color="#0ea5e9" label="Course" />
              <LegendLine style="solid" label="Prereq" />
              <LegendLine style="dashed" label="Co‑req" />
              <LegendLine style="faint" label="AI / Theme" />
            </div>

            <div className="mt-2 text-[11px] leading-snug text-slate-400">
              <span className="text-slate-300 font-medium">Direction:</span> A → B means
              <span className="text-slate-200"> A is required for B</span>. Dashed = co-requisite.
            </div>
          </div>

          {/* Graph sized to the container */}
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
                if (!frozen) setFrozen(true); // auto-freeze when settled
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
              onNodeClick={onNodeClick}
              onLinkHover={setHoverLink}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm">
              No items yet — add something and come back here.
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

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </span>
  );
}

function LegendLine({ style, label }) {
  const cls = style === "dashed" ? "border-dashed opacity-80" : style === "faint" ? "opacity-60" : "";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block w-6 border-t ${cls} border-slate-300`} />
      <span>{label}</span>
    </span>
  );
}

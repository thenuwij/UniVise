import { useCallback } from "react";

export default function AutoLayoutControls({
  graph,
  setGraph,
  canvasSize,
  graphRef,
  setFrozen,
  className = "",
}) {
  const idOf = (n) => (typeof n === "object" ? n.id : n);
  const normalizeLinksToIds = (links) =>
    links.map((l) => ({ ...l, source: idOf(l.source), target: idOf(l.target) }));

  const codeDigitLevel = (n) => {
    const m = String(n?.item_key || n?.code || "").match(/\d{4}/);
    return m ? Number(m[0][0]) : undefined;
  };

  const inferBaseLevel = (n) => {
    if (n.item_type === "degree") return 0;
    const meta = Number(n?.metadata?.level);
    if (!Number.isNaN(meta) && meta >= 0) return Math.max(1, Math.min(meta, 8));
    const dig = codeDigitLevel(n);
    if (dig !== undefined) return Math.max(1, Math.min(dig, 8));
    return 1;
  };

  const autoLayout = useCallback(() => {
  if (!graph?.nodes?.length) return;

  const nodes = graph.nodes.map((n) => ({ ...n }));
  const links = normalizeLinksToIds(graph.links);
  const idSet = new Set(nodes.map((n) => n.id));

  // --- adjacency and constraints ---
  const prereq = links.filter((l) => l.type === "prereq");
  const belongs = links.filter((l) => l.type === "belongs_to");
  const constraints = [...prereq, ...belongs];

  const base = new Map(nodes.map((n) => [n.id, inferBaseLevel(n)]));
  nodes.forEach((n) =>
    base.set(n.id, n.item_type === "degree" ? 0 : Math.max(1, base.get(n.id) ?? 1))
  );

  const indeg = new Map([...idSet].map((id) => [id, 0]));
  const adj = new Map([...idSet].map((id) => [id, []]));
  constraints.forEach((l) => {
    const s = l.source, t = l.target;
    if (!idSet.has(s) || !idSet.has(t)) return;
    indeg.set(t, (indeg.get(t) || 0) + 1);
    adj.get(s).push(t);
  });

  const level = new Map(base);
  const q = [...idSet].filter((id) => (indeg.get(id) || 0) === 0);
  while (q.length) {
    const u = q.shift();
    for (const v of adj.get(u)) {
      const promoted = Math.max(level.get(v) || 0, (level.get(u) || 0) + 1);
      level.set(v, Math.max(promoted, base.get(v) || 0));
      indeg.set(v, (indeg.get(v) || 0) - 1);
      if (indeg.get(v) === 0) q.push(v);
    }
  }

  // --- bucket by level ---
  const maxLevel = Math.max(0, ...nodes.map((n) => level.get(n.id) ?? base.get(n.id) ?? 0));
  const rows = maxLevel + 1;
  const buckets = Array.from({ length: rows }, () => []);
  const isolated = [];

  // detect isolated nodes
  const connected = new Set(links.flatMap((l) => [l.source, l.target]));
  nodes.forEach((n) => {
    if (!connected.has(n.id)) {
      isolated.push(n);
      return;
    }
    const lv = level.get(n.id) ?? base.get(n.id) ?? 0;
    const clamped = Math.max(0, Math.min(lv, rows - 1));
    buckets[clamped].push(n);
  });

  const keySort = (a, b) => {
    if (a.item_type !== b.item_type) return a.item_type === "degree" ? -1 : 1;
    const ka = (a.item_key || a.code || a.title || "").toString();
    const kb = (b.item_key || b.code || b.title || "").toString();
    return ka.localeCompare(kb);
  };
  buckets.forEach((r) => r.sort(keySort));

  // --- improved layout spacing ---
  const marginTop = 100;
  const marginSide = 120;
  const baseRowGap = Math.max(220, canvasSize.h / (rows + 1));

  const H = Math.max(baseRowGap * (rows - 1), 400);
  const W = Math.max(800, canvasSize.w - marginSide * 2);

  const yForRow = (r) => marginTop + r * baseRowGap;

  buckets.forEach((rowArr, r) => {
    const y = yForRow(r);
    const count = rowArr.length;
    if (!count) return;

    // Dynamic spacing per row
    const approxNodeWidth = 120;
    const maxPossible = Math.floor(W / approxNodeWidth);
    const scalingFactor = count > maxPossible ? count / maxPossible : 1;
    const xSpacing = Math.max(160, (W / (count + 1)) * scalingFactor);
    const startX = marginSide + (W - (count - 1) * xSpacing) / 2;

    rowArr.forEach((n, i) => {
      const x = startX + i * xSpacing + (Math.random() - 0.5) * 4; // jitter ±2px
      const yPos = y + (Math.random() - 0.5) * 4;
      n.fx = x;
      n.fy = yPos;
      n.x = x;
      n.y = yPos;
    });
  });

  // --- isolated nodes cluster (bottom-left) ---
  if (isolated.length > 0) {
    const baseX = 200;
    const baseY = canvasSize.h - 180;
    const cols = Math.ceil(Math.sqrt(isolated.length));
    const gap = 80;

    isolated.forEach((n, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      n.fx = baseX + c * gap;
      n.fy = baseY + r * gap;
      n.x = n.fx;
      n.y = n.fy;
    });
  }

  setGraph({ nodes, links });
  setFrozen?.(true);
  requestAnimationFrame(() => graphRef.current?.zoomToFit(600, 80));
}, [graph, canvasSize, graphRef, setGraph, setFrozen]);


  const resetLayout = useCallback(() => {
    const nodes = graph.nodes.map(({ fx, fy, ...n }) => ({ ...n, fx: undefined, fy: undefined }));
    const links = normalizeLinksToIds(graph.links);
    setGraph({ nodes, links });
    setFrozen?.(false);
    requestAnimationFrame(() => graphRef.current?.d3ReheatSimulation());
  }, [graph, graphRef, setGraph, setFrozen]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={autoLayout}
        className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm"
        disabled={!graph?.nodes?.length}
        title="Auto layout (degree → L1 → L2 → …, isolated in corner)"
      >
        Auto layout
      </button>
      <button
        onClick={resetLayout}
        className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm"
        disabled={!graph?.nodes?.length}
        title="Reset to free layout"
      >
        Reset
      </button>
    </div>
  );
}

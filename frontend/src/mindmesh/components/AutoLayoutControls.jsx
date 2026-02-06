// src/pages/mindmesh/components/AutoLayoutControls.jsx
import { useCallback, forwardRef, useImperativeHandle } from "react";

export default forwardRef(function AutoLayoutControls({
  graph,
  setGraph,
  canvasSize,
  graphRef,
  setFrozen,
  className = "",
}, ref) {

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

    const allNodes = graph.nodes.map((n) => ({ ...n }));
    const links = normalizeLinksToIds(graph.links);
    const idSet = new Set(allNodes.map((n) => n.id));

    const validLinks = links.filter(l => idSet.has(l.source) && idSet.has(l.target));
    
    const connectedNodeIds = new Set(validLinks.flatMap((l) => [l.source, l.target]));
    const nodes = allNodes.filter(n => connectedNodeIds.has(n.id));
    
    console.log("🎯 Auto Layout:");
    console.log("  - Total nodes:", allNodes.length);
    console.log("  - Connected nodes:", nodes.length);
    console.log("  - Isolated nodes removed:", allNodes.length - nodes.length);
    console.log("  - Valid links:", validLinks.length);

    if (nodes.length === 0) {
      console.warn("⚠️ No connected nodes to layout");
      return;
    }

    const prereq = validLinks.filter((l) => l.type === "prereq");
    const belongs = validLinks.filter((l) => l.type === "belongs_to");
    const constraints = [...prereq, ...belongs];

    const base = new Map(nodes.map((n) => [n.id, inferBaseLevel(n)]));
    nodes.forEach((n) =>
      base.set(n.id, n.item_type === "degree" ? 0 : Math.max(1, base.get(n.id) ?? 1))
    );

    const nodeIdSet = new Set(nodes.map(n => n.id));
    const indeg = new Map([...nodeIdSet].map((id) => [id, 0]));
    const adj = new Map([...nodeIdSet].map((id) => [id, []]));
    
    constraints.forEach((l) => {
      const s = l.source, t = l.target;
      if (!nodeIdSet.has(s) || !nodeIdSet.has(t)) return;
      indeg.set(t, (indeg.get(t) || 0) + 1);
      adj.get(s).push(t);
    });

    const level = new Map(base);
    const q = [...nodeIdSet].filter((id) => (indeg.get(id) || 0) === 0);
    while (q.length) {
      const u = q.shift();
      for (const v of adj.get(u)) {
        const promoted = Math.max(level.get(v) || 0, (level.get(u) || 0) + 1);
        level.set(v, Math.max(promoted, base.get(v) || 0));
        indeg.set(v, (indeg.get(v) || 0) - 1);
        if (indeg.get(v) === 0) q.push(v);
      }
    }

    const maxLevel = Math.max(0, ...nodes.map((n) => level.get(n.id) ?? base.get(n.id) ?? 0));
    const rows = maxLevel + 1;
    const buckets = Array.from({ length: rows }, () => []);

    nodes.forEach((n) => {
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

    const marginBottom = 100;
    const marginSide = 120;
    const baseRowGap = Math.max(220, canvasSize.h / (rows + 1));

    const W = Math.max(800, canvasSize.w - marginSide * 2);
    const yForRow = (r) => canvasSize.h - marginBottom - r * baseRowGap;
    
    buckets.forEach((rowArr, r) => {
      const y = yForRow(r);
      const count = rowArr.length;
      if (!count) return;

      const approxNodeWidth = 120;
      const maxPossible = Math.floor(W / approxNodeWidth);
      const scalingFactor = count > maxPossible ? count / maxPossible : 1;
      const xSpacing = Math.max(160, (W / (count + 1)) * scalingFactor);
      const startX = marginSide + (W - (count - 1) * xSpacing) / 2;

      rowArr.forEach((n, i) => {
        const x = startX + i * xSpacing + (Math.random() - 0.5) * 4;
        const yPos = y + (Math.random() - 0.5) * 4;
        n.fx = x;
        n.fy = yPos;
        n.x = x;
        n.y = yPos;
      });
    });

    setGraph({ nodes, links: validLinks });
    setFrozen?.(true);
    requestAnimationFrame(() => graphRef.current?.zoomToFit(600, 80));
  }, [graph, canvasSize, graphRef, setGraph, setFrozen]);

  useImperativeHandle(ref, () => ({
    autoLayout
  }));

  const resetLayout = useCallback(() => {
    if (!graph?.nodes?.length) return;

    const allNodes = graph.nodes.map(({ fx, fy, ...n }) => ({ ...n, fx: undefined, fy: undefined }));
    const links = normalizeLinksToIds(graph.links);
    
    const idSet = new Set(allNodes.map((n) => n.id));
    const validLinks = links.filter(l => idSet.has(l.source) && idSet.has(l.target));
    
    const connectedNodeIds = new Set(validLinks.flatMap((l) => [l.source, l.target]));
    const nodes = allNodes.filter(n => connectedNodeIds.has(n.id));
    
    console.log("Reset Layout:");
    console.log("Connected nodes:", nodes.length);
    console.log("Valid links:", validLinks.length);
    
    setGraph({ nodes, links: validLinks });
    setFrozen?.(false);
    requestAnimationFrame(() => graphRef.current?.d3ReheatSimulation());
  }, [graph, graphRef, setGraph, setFrozen]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={autoLayout}
        className="px-4 py-2 rounded-lg
                   bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800
                   border-2 border-slate-300 dark:border-slate-600
                   text-slate-700 dark:text-slate-200
                   font-semibold text-sm
                   shadow-sm hover:shadow-md
                   transition-all duration-200
                   hover:border-slate-400 dark:hover:border-slate-500
                   hover:scale-105 active:scale-95
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        disabled={!graph?.nodes?.length}
        title="Automatically arrange courses by level (1→2→3→4)"
      >
        Auto Layout
      </button>
      <button
        onClick={resetLayout}
        className="px-4 py-2 rounded-lg
                   bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800
                   border-2 border-slate-300 dark:border-slate-600
                   text-slate-700 dark:text-slate-200
                   font-semibold text-sm
                   shadow-sm hover:shadow-md
                   transition-all duration-200
                   hover:border-slate-400 dark:hover:border-slate-500
                   hover:scale-105 active:scale-95
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        disabled={!graph?.nodes?.length}
        title="Reset to free-form physics layout"
      >
        Reset Layout
      </button>
    </div>
  );
});
import { useCallback } from "react";

// Reusable toolbar with Auto layout + Reset
export default function AutoLayoutControls({
  graph,            // { nodes, links }
  setGraph,         // setState from parent
  canvasSize,       // { w, h }
  graphRef,         // ref from ForceGraph2D
  setFrozen,        // setter from parent
  className = "",
}) {
  const idOf = (n) => (typeof n === "object" ? n.id : n);
  const normalizeLinksToIds = (links) =>
    links.map((l) => ({ ...l, source: idOf(l.source), target: idOf(l.target) }));

  const codeDigitLevel = (n) => {
    const m = String(n?.item_key || n?.code || "").match(/\d{4}/);
    return m ? Number(m[0][0]) : undefined; // e.g. 1511 -> 1
  };

  const inferBaseLevel = (n) => {
    if (n.item_type === "degree") return 0; // degrees top row
    const meta = Number(n?.metadata?.level);
    if (!Number.isNaN(meta) && meta >= 0) return Math.max(1, Math.min(meta, 8));
    const dig = codeDigitLevel(n);
    if (dig !== undefined) return Math.max(1, Math.min(dig, 8));
    return 1;
  };

  const autoLayout = useCallback(() => {
    if (!graph?.nodes?.length) return;

    // clone + normalize
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = normalizeLinksToIds(graph.links);
    const idSet = new Set(nodes.map((n) => n.id));

    // use BOTH prereqs and belongs_to to build hierarchy constraints
    const prereq = links.filter((l) => l.type === "prereq");
    const belongs = links.filter((l) => l.type === "belongs_to");
    const constraints = [...prereq, ...belongs];

    // 1) base levels (strict floor by type/digit)
    const base = new Map(nodes.map((n) => [n.id, inferBaseLevel(n)]));
    // degrees must be 0, non-degrees >=1
    nodes.forEach((n) => base.set(n.id, n.item_type === "degree" ? 0 : Math.max(1, base.get(n.id) ?? 1)));

    // 2) promote along constraints (longest path) but never below base
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

    // 3) bucket by level (degrees row 0, L1 row 1, …)
    const maxLevel = Math.max(0, ...nodes.map((n) => level.get(n.id) ?? base.get(n.id) ?? 0));
    const rows = maxLevel + 1;
    const buckets = Array.from({ length: rows }, () => []);
    nodes.forEach((n) => {
      const lv = level.get(n.id) ?? base.get(n.id) ?? 0;
      const clamped = Math.max(0, Math.min(lv, rows - 1));
      buckets[clamped].push(n);
    });

    // stable sort inside each row (type then code) for determinism
    const keySort = (a, b) => {
      if (a.item_type !== b.item_type) return a.item_type === "degree" ? -1 : 1;
      const ka = (a.item_key || a.code || a.title || "").toString();
      const kb = (b.item_key || b.code || b.title || "").toString();
      return ka.localeCompare(kb);
    };
    buckets.forEach((rowArr) => rowArr.sort(keySort));

    // 3b) barycenter pass (reduce crossings): order row r by avg index of its predecessors in row r-1
    const indexInRow = new Map(); // node.id -> index within its row
    const buildIndexMap = (r) => buckets[r].forEach((n, i) => indexInRow.set(n.id, i));
    buildIndexMap(0);
    for (let r = 1; r < rows; r++) {
      const prev = new Set(buckets[r - 1].map((n) => n.id));
      const predsOf = (nid) =>
        constraints
          .filter((l) => l.target === nid && prev.has(l.source))
          .map((l) => indexInRow.get(l.source))
          .filter((x) => x !== undefined);

      buckets[r].sort((a, b) => {
        const pa = predsOf(a.id);
        const pb = predsOf(b.id);
        const ba = pa.length ? pa.reduce((s, x) => s + x, 0) / pa.length : Infinity;
        const bb = pb.length ? pb.reduce((s, x) => s + x, 0) / pb.length : Infinity;
        return ba - bb;
      });
      buildIndexMap(r);
    }

    // 4) compute coordinates (big vertical gaps so rows are visually distinct)
    const marginTop = 60;
    const marginSide = 80;
    const rowGap = 180; // increase/decrease for taller/shorter pyramid
    const H = Math.max(rowGap * (rows - 1), 240);
    const W = Math.max(480, canvasSize.w - marginSide * 2);

    const yForRow = (r) => marginTop + r * rowGap;

    buckets.forEach((rowArr, r) => {
      const y = yForRow(r);
      const count = rowArr.length;
      if (!count) return;

      if (r === 0 && count === 1 && rowArr[0].item_type === "degree") {
        // single degree at center
        const x = marginSide + W / 2;
        const n = rowArr[0];
        n.fx = x; n.fy = y; n.x = x; n.y = y;
        return;
      }

      // spread evenly across width
      for (let i = 0; i < count; i++) {
        const x = marginSide + ((i + 1) * W) / (count + 1);
        const n = rowArr[i];
        n.fx = x; n.fy = y; n.x = x; n.y = y;
      }
    });

    // finalize
    setGraph({ nodes, links });
    setFrozen?.(true);
    requestAnimationFrame(() => graphRef.current?.zoomToFit(600, 50));
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
        title="Arrange as a strict pyramid (degree → L1 → L2 → …) with prereq ordering"
      >
        Auto layout
      </button>
      <button
        onClick={resetLayout}
        className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm"
        disabled={!graph?.nodes?.length}
        title="Release fixed positions"
      >
        Reset
      </button>
    </div>
  );
}

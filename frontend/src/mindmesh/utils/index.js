// src/components/mindmesh/index.js

/**
 * Draw a rounded rectangle on a canvas.
 */
export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// /**
//  * Colour utilities for nodes & edges.
//  */
// export const levelPalette = {
//   1: "#f9fafb",
//   2: "#34d399",
//   3: "#818cf8",
//   4: "#c084fc",
// };

export function colorFor(type) {
  switch (type?.toLowerCase()) {
    case "degree":
      return "#2563eb";
    case "specialisation":
      return "#7c3aed";
    case "course":
    default:
      return "#000000ff";
  }
}

export function levelStyle(lvl) {
  return {
    color: levelPalette[lvl] || "#94a3b8",
    width: 2.0 - (lvl - 1) * 0.3,
  };
}


// --- Node colours ---
export function getLevelColor(level) {
  const lvl = Number(level);
  if (!lvl) return "#3BAFDA";        // default
  if (lvl === 1) return "#2F8DDB";   // sapphire blue — clarity & trust
  if (lvl === 2) return "#2563EB";   // royal cobalt — focused intelligence
  if (lvl === 3) return "#178756";   // deep jade — growth & stability
  if (lvl >= 4) return "#8A4FF7";    // vivid amethyst — mastery & insight
  return "#8E8E93";
}

// --- Edge colours ---
export const levelPalette = {
  1: "#70BEE9",  // icy sky tint
  2: "#86A7F7",  // muted cobalt tint
  3: "#6DD8A4",  // gentle emerald tint
  4: "#B58CFA",  // lilac-glow tint
  default: "#A1A1AA",
};


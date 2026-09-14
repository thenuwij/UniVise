// src/components/mindmesh/index.js

// Draw a rounded rectangle on a canvas.
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

// Node colours
export function getLevelColor(level) {
  const lvl = Number(level);
  if (!lvl) return "#3BAFDA";       
  if (lvl === 1) return "#2F8DDB";  
  if (lvl === 2) return "#2563EB";   
  if (lvl === 3) return "#178756";  
  if (lvl >= 4) return "#8A4FF7";    
  return "#8E8E93";
}


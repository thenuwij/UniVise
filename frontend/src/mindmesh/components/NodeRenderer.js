// src/components/mindmesh/NodeRenderer.js
import { roundRect, getLevelColor } from "../utils";

// ----- Color helpers -----
function lighten(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
function darken(hex, percent) {
  return lighten(hex, -percent);
}

/**
 * Draws a MindMesh node (course, degree, etc.)
 */
export function nodeCanvasObject(node, ctx, state) {
  const { focusedNode, getDirectNeighbours, colorFor } = state;

  const connected = focusedNode ? getDirectNeighbours(focusedNode.id) : null;
  const isFocused = focusedNode && connected.has(node.id);
  const opacity = focusedNode ? (isFocused ? 1 : 0.25) : 1;

  const level =
    node.level ||
    node.metadata?.level ||
    (node.id?.match(/\d/) ? parseInt(node.id.match(/\d/)[0]) : null);
  let color = getLevelColor(level) || colorFor(node.type);

  // --- Focus highlight ---
  if (focusedNode) {
    if (node.id === focusedNode.id) {
      color = lighten(getLevelColor(level), 18);
    } else if (isFocused) {
      color = lighten(getLevelColor(level), 10);
    }
  }

  const code = node.id;
  const sub = node.metadata?.uoc ? `${node.metadata.uoc} UOC` : "";

  // Layout
  const titleSize = 15;
  const subSize = sub ? 12 : 0;
  const padX = 12;
  const padY = 9;
  const gapY = sub ? 3 : 0;
  const radius = 10;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Measure
  ctx.font = `600 ${titleSize}px Inter, system-ui, -apple-system`;
  const titleW = ctx.measureText(code).width;
  const subW = sub ? ctx.measureText(sub).width : 0;
  const textW = Math.max(titleW, subW);
  const h = titleSize + (sub ? gapY + subSize : 0) + padY * 2;
  const w = textW + padX * 2;

  // Gradient background
  let fill = color;
  if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
    const grad = ctx.createLinearGradient(node.x, node.y - h / 2, node.x, node.y + h / 2);
    grad.addColorStop(0, lighten(color, 10));
    grad.addColorStop(1, darken(color, 10));
    fill = grad;
  }

  // Glow
  ctx.shadowBlur = isFocused ? 25 : 15;
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = fill;
  roundRect(ctx, node.x - w / 2, node.y - h / 2, w, h, radius);
  ctx.fill();

  // ---- Text ----
  ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Clean, crisp text (no stroke, strong dark shadow for contrast)
  ctx.font = `600 ${titleSize}px Inter, system-ui, -apple-system`;
  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  const titleY = node.y - (sub ? (subSize + gapY) / 2 : 0);
  ctx.fillText(code, node.x, titleY);

  // Subtext (UOC)
  if (sub) {
    ctx.font = `500 ${subSize}px Inter, system-ui, -apple-system`;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 1.5;
    ctx.shadowOffsetY = 1;
    const subY = node.y + (titleSize + gapY) / 2;
    ctx.fillText(sub, node.x, subY);
  }

  ctx.restore();
}

/**
 * Draws the invisible pointer hit area for interaction detection.
 */
export function nodePointerAreaPaint(node, color, ctx) {
  const code = node.id;
  const sub = node.metadata?.uoc ? `${node.metadata.uoc} UOC` : "";

  const titleSize = 15;
  const padX = 12;
  const padY = 9;
  const gapY = sub ? 3 : 0;
  const radius = 10;

  const textW = Math.max(
    ctx.measureText(code).width,
    sub ? ctx.measureText(sub).width : 0
  );
  const h = titleSize + (sub ? gapY + 12 : 0) + padY * 2;
  const w = textW + padX * 2;

  ctx.fillStyle = color;
  roundRect(ctx, node.x - w / 2, node.y - h / 2, w, h, radius);
  ctx.fill();
}

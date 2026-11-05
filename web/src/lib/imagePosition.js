// Per-image crop focus. Positions are stored as percentages (0-100) and
// applied through CSS object-position, so the same photo looks right in
// cards, the listing gallery and the lightbox regardless of aspect ratio.

export const DEFAULT_POSITION = { x: 50, y: 50 };

function clamp(n) {
  return Math.min(100, Math.max(0, n));
}

export function positionFor(positions, url) {
  const p = positions && url ? positions[url] : null;
  const x = Number(p && p.x);
  const y = Number(p && p.y);
  return {
    x: Number.isFinite(x) ? clamp(x) : DEFAULT_POSITION.x,
    y: Number.isFinite(y) ? clamp(y) : DEFAULT_POSITION.y,
  };
}

export function objectPosition(positions, url) {
  const { x, y } = positionFor(positions, url);
  return `${x}% ${y}%`;
}

export function isDefaultPosition(positions, url) {
  const { x, y } = positionFor(positions, url);
  return x === DEFAULT_POSITION.x && y === DEFAULT_POSITION.y;
}

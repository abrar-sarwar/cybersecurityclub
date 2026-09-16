/** Shared projection for the static poster and the progressively loaded canvas. */
export type GlobePoint = [number, number, number];
export const GLOBE_SIZE = 720;
export const GLOBE_RADIUS = 286;
export const GLOBE_CENTER = 360;

export function projectGlobePoint([x, y, z]: GlobePoint, angle = 0) {
  const longitude = angle + Math.PI / 4;
  const rx = x * Math.cos(longitude) + z * Math.sin(longitude);
  const rz = z * Math.cos(longitude) - x * Math.sin(longitude);
  const north = y * Math.cos(0.24) - rz * Math.sin(0.24);
  const depth = y * Math.sin(0.24) + rz * Math.cos(0.24);
  const screenX = rx * Math.cos(-0.15) - north * Math.sin(-0.15);
  const screenY = rx * Math.sin(-0.15) + north * Math.cos(-0.15);
  const light = Math.max(0, -screenX * 0.65 + screenY * 0.4 + depth * 0.55);
  return {
    x: GLOBE_CENTER + screenX * GLOBE_RADIUS,
    y: GLOBE_CENTER - screenY * GLOBE_RADIUS,
    depth,
    alpha: (0.08 + light * 0.92) * Math.min(1, depth * 5),
  };
}

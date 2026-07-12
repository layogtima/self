// Typed walkable regions shared by the FPV controller and build mode.
//   { type:'rect', x0, x1, z0, z1 }
//   { type:'poly', points: [[x,z], …] }  — convex, wound consistently

// regular n-gon, inset measured along the inradius so edges shrink uniformly
export function ngonPoints(n, cx, cz, R, inset = 0, rot = 0) {
  const pts = [];
  const inFactor = Math.cos(Math.PI / n);
  const r = Math.max(1, R - inset / inFactor);
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return pts;
}

// octagon with edges facing the cardinals + diagonals (vertices at 22.5°+k·45°)
export function octPoints(cx, cz, R, inset = 0) {
  return ngonPoints(8, cx, cz, R, inset, Math.PI / 8);
}

// vault square rotated 45° (vertices on the axes)
export function sqPoints(cx, cz, R, inset = 0) {
  return ngonPoints(4, cx, cz, R, inset, 0);
}

// kept for park/ legacy modules
export function hexPoints(cx, cz, R, inset = 0) {
  return ngonPoints(6, cx, cz, R, inset, 0);
}

export function pointInPoly(pts, x, z) {
  // convex, consistent winding: sign of cross product must not flip
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % pts.length];
    const cross = (bx - ax) * (z - az) - (bz - az) * (x - ax);
    if (cross !== 0) {
      const s = Math.sign(cross);
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

export function pointInRegion(r, x, z, margin = 0) {
  if (r.type === 'poly') return pointInPoly(r.points, x, z); // pre-inset margin
  return x >= r.x0 + margin && x <= r.x1 - margin && z >= r.z0 + margin && z <= r.z1 - margin;
}

export function inAnyRegion(regions, x, z, margin = 0) {
  for (const r of regions) if (pointInRegion(r, x, z, margin)) return true;
  return false;
}

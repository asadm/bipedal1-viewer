// Millimetres, +X forward, +Y left, +Z up; matches cad/kinematics.py.
export function wheel(p, height, bump = 0) {
  const drop = p.low_axle_drop + height - bump;
  return [p.pivot_x + Math.sqrt(p.arm_length ** 2 - drop ** 2), -drop];
}

export function lowerEye(p, height, bump = 0) {
  const [x, z] = wheel(p, height, bump);
  return [p.pivot_x + p.shock_fraction * (x - p.pivot_x), p.shock_fraction * z];
}

export function upperEye(p, height) {
  const [x, z] = lowerEye(p, height);
  return z + Math.sqrt(p.shock_loaded_length ** 2 - (p.shock_x - x) ** 2);
}

export function actuatorStroke(p) {
  return upperEye(p, 0) - upperEye(p, p.height_range);
}

// The primary slider drives actual yoke travel, not an arbitrary body translation.
export function heightFromTravel(p, travel) {
  const target = upperEye(p, 0) - Math.max(0, Math.min(actuatorStroke(p), travel));
  let lo = 0, hi = p.height_range;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (upperEye(p, mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function pose(p, height, leftBump = 0, rightBump = 0) {
  const u = upperEye(p, height);
  const result = {
    height, bodyZ: p.wheel_diameter / 2 + p.low_axle_drop + height,
    upperZ: u, travel: upperEye(p, 0) - u,
  };
  for (const [side, bump] of [['left', leftBump], ['right', rightBump]]) {
    const w = wheel(p, height, bump), lower = lowerEye(p, height, bump);
    result[side] = {
      wheel: w, lower,
      armAngle: Math.atan2(-w[1], w[0] - p.pivot_x),
      // Rotation about Y of a shock aligned initially with +Z.
      shockAngle: Math.atan2(p.shock_x - lower[0], u - lower[1]),
      shockLength: Math.hypot(p.shock_x - lower[0], u - lower[1]),
    };
  }
  return result;
}

export function rotateY([x, y, z], angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [c*x + s*z, y, -s*x + c*z];
}

export function motionFor(part) {
  if (part.group === 'fixed') return 'fixed';
  if (part.group === 'height') return 'yoke';
  if (part.name.endsWith('_shock_body')) return 'shockBody';
  if (part.name.endsWith('_shock_rod')) return 'shockRod';
  if (part.name.endsWith('_tire') || part.name.endsWith('_rim_hub')) return 'wheel';
  return 'arm';
}

// Rigid transforms refer to the CAD's fixed chassis datum, before body elevation.
export function transformFor(part, p, state) {
  const side = state[part.group];
  const sign = part.group === 'left' ? 1 : -1;
  switch (motionFor(part)) {
    case 'fixed': return { position: [0, 0, 0], angle: 0 };
    case 'yoke': return { position: [p.shock_x, 0, state.upperZ], angle: 0 };
    case 'arm': return { position: [p.pivot_x, 0, 0], angle: side.armAngle };
    case 'wheel': return { position: [side.wheel[0], 0, side.wheel[1]], angle: 0 };
    case 'shockBody': return { position: [p.shock_x, sign*p.shock_y, state.upperZ], angle: side.shockAngle };
    case 'shockRod': return { position: [side.lower[0], sign*p.shock_y, side.lower[1]], angle: side.shockAngle };
  }
  throw new Error(`Unknown part: ${part.name}`);
}

export function localVertex(vertex, transform, bodyZ) {
  const pos = transform.position;
  return rotateY([vertex[0]-pos[0], vertex[1]-pos[1], vertex[2]-bodyZ-pos[2]], -transform.angle);
}

export function worldVertex(vertex, transform, bodyZ) {
  const rotated = rotateY(vertex, transform.angle);
  return rotated.map((v, i) => v + transform.position[i] + (i === 2 ? bodyZ : 0));
}

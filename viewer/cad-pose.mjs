import {leg, pose} from '../concept06/internal-kinematics.mjs';

// Transform the physical spring pin coordinates through the recorded bodies.
// The 50 mm spring has 14 mm allocated to end fittings, hence 64 mm free pin span.
function world(body, point) {
  const [w, x, y, z] = body.quat, [a, b, c] = point;
  const t = [2 * (y * c - z * b), 2 * (z * a - x * c), 2 * (x * b - y * a)];
  return [a + w * t[0] + y * t[2] - z * t[1], b + w * t[1] + z * t[0] - x * t[2],
    c + w * t[2] + x * t[1] - y * t[0]].map((v, i) => v + body.pos[i]);
}

export function springSeats(parameters, bodies) {
  const s = parameters.spring;
  return ['left', 'right'].map((side, i) => {
    const y = (i ? -1 : 1) * s.seat_y_from_leg_m;
    return [world(bodies[side + '_upper'], [parameters.geometry.crank_mm / 1000 - s.upper_seat_from_knee_m, y, 0]),
      world(bodies[side + '_lower'], [s.lower_seat_from_knee_m, y, 0])];
  });
}

export function inspectionRange(manifest) {
  const p = manifest.parameters;
  // The archived stance heights include balance pitch. Manual inspection holds
  // the chassis level, so derive its height range using that same level pose.
  const height = q => p.wheel_radius_m * 1000 - leg(p.geometry, q).E[1];
  const [minimum, maximum] = manifest.stance.stance_q_range_rad.map(height);
  return {minimum, maximum, stroke: maximum - minimum, ride: height(p.nominal_q_rad) - minimum};
}

export function inspectionPose(manifest, heights) {
  const p = manifest.parameters, [lo, hi] = manifest.stance.stance_q_range_rad;
  const {stroke} = inspectionRange(manifest);
  const frame = pose({...p, geometry: {...p.geometry, q_low_rad: lo, q_high_rad: hi}},
    heights.map(h => Math.max(0, Math.min(stroke, h))));
  frame.compression_m = springSeats(p, frame.bodies).map(([a, b]) =>
    Math.max(0, p.spring.free_pin_span_m - Math.hypot(...a.map((v, i) => v - b[i]))));
  return frame;
}

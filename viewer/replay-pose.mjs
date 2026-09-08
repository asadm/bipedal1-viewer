// Display-only interpolation. Physics measurements, event times and qualification
// always come from the original recording; no simulated state is replaced.
export function interpolateBodies(a, b, fraction) {
  const t = Math.max(0, Math.min(1, fraction)), result = {};
  for (const [name, start] of Object.entries(a)) {
    const end = b[name]; if (!end) throw Error('Missing interpolation body: ' + name);
    let q = [...end.quat], dot = start.quat.reduce((sum, v, i) => sum + v * q[i], 0);
    if (dot < 0) { q = q.map(v => -v); dot = -dot; }
    let wa = 1 - t, wb = t;
    if (dot < .9995) {
      const theta = Math.acos(Math.max(-1, Math.min(1, dot))), sine = Math.sin(theta);
      wa = Math.sin((1 - t) * theta) / sine; wb = Math.sin(t * theta) / sine;
    }
    const quat = start.quat.map((v, i) => wa * v + wb * q[i]), length = Math.hypot(...quat);
    result[name] = {pos: start.pos.map((v, i) => v + (end.pos[i] - v) * t), quat: quat.map(v => v / length)};
  }
  return result;
}

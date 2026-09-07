// Verify continuous motion against Python kinematics and independently exported CAD poses.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pose, upperEye, heightFromTravel, transformFor, localVertex, worldVertex } from './kinematics.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const read = path => JSON.parse(readFileSync(resolve(here, path), 'utf8'));
const fixtures = read('kinematics-reference.json');
const p = read('../cad/parameters.json');
assert.deepEqual(fixtures.parameters, p, 'Regenerate Python fixtures after editing the CAD parameters');
const close = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a-b) <= tolerance, `${a} differs from ${b}`);
for (const expected of fixtures.poses) {
  const state = pose(p, expected.height_mm);
  close(state.bodyZ, expected.body_z_mm);
  close(state.upperZ, expected.upper_eye_z_mm);
  close(heightFromTravel(p, state.travel), expected.height_mm);
  for (const side of ['left', 'right']) {
    state[side].wheel.forEach((v, i) => close(v, expected[side+'_wheel'][i]));
    state[side].lower.forEach((v, i) => close(v, expected[side+'_lower_eye'][i]));
    close(state[side].shockLength, expected[side+'_shock_mm']);
    close(state.bodyZ + state[side].wheel[1] - p.wheel_diameter/2, 0);
  }
}
const normal = read('../output/mesh_normal.json');
const reference = pose(p, p.height_range/2);
function bounds(vertices) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const vertex of vertices) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], vertex[i]); max[i] = Math.max(max[i], vertex[i]); }
  return [...min, ...max];
}
let checkedParts = 0, maxBoundError = 0;
for (const [name, height] of [['low', 0], ['raised', p.height_range]]) {
  const targetParts = new Map(read(`../output/mesh_${name}.json`).map(part => [part.name, part]));
  const state = pose(p, height);
  for (const part of normal) {
    const from = transformFor(part, p, reference), to = transformFor(part, p, state);
    const actual = bounds(part.vertices.map(v => worldVertex(localVertex(v, from, reference.bodyZ), to, state.bodyZ)));
    const expected = bounds(targetParts.get(part.name).vertices);
    for (let i=0; i<6; i++) {
      const error = Math.abs(actual[i]-expected[i]);
      maxBoundError = Math.max(error, maxBoundError);
      assert.ok(error < .25, `${name}/${part.name}: CAD bound error ${error.toFixed(4)} mm`);
    }
    checkedParts++;
  }
}
console.log(JSON.stringify({python_reference_poses:fixtures.poses.length, matched_CAD_part_poses:checkedParts,
  max_tessellated_bound_error_mm:maxBoundError, yoke_travel_mm:upperEye(p,0)-upperEye(p,p.height_range),
  body_rise_mm:p.height_range, result:'passed'}, null, 2));

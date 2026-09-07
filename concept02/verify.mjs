import fs from 'node:fs';
import assert from 'node:assert/strict';
import { angleRange,pose,transformFor } from './kinematics.mjs';
const root=new URL('../output/concept02/',import.meta.url);
const p=JSON.parse(fs.readFileSync(new URL('./parameters.json',import.meta.url)));
const parts=JSON.parse(fs.readFileSync(new URL('parts.json',root)));
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
assert.deepEqual(p,manifest.parameters);
let maxError=0;
function bounds(vertices) {
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(const v of vertices) for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],v[i]);hi[i]=Math.max(hi[i],v[i]);}
  return [...lo,...hi];
}
for(const [name,spec] of Object.entries(manifest.poses)) {
  const state=pose(p,spec.state.left.angle);
  const reference=JSON.parse(fs.readFileSync(new URL('mesh_'+name+'.json',root)));
  for(let j=0;j<parts.length;j++) {
    const part=parts[j];
    assert.equal(part.name,reference[j].name);
    const t=transformFor(part,p,state),c=Math.cos(t.angle),s=Math.sin(t.angle);
    const predicted=bounds(part.vertices.map(([x,y,z])=>[c*x+s*z+t.position[0],y+t.position[1],-s*x+c*z+t.position[2]]));
    const expected=bounds(reference[j].vertices);
    for(let i=0;i<6;i++)maxError=Math.max(maxError,Math.abs(predicted[i]-expected[i]));
  }
}
assert.ok(maxError<.3,`CAD/JS bound mismatch ${maxError} mm`);
const [low,high]=angleRange(p);
for(let i=0;i<=100;i++)for(const bump of [0,p.bump_preview]) {
  const state=pose(p,low+(high-low)*i/100,bump,0);
  assert.ok(Math.abs(state.bodyZ+state.left.wheel[2]-p.wheel_radius-bump)<1e-10);
  assert.ok(Math.abs(state.bodyZ+state.right.wheel[2]-p.wheel_radius)<1e-10);
}
for(const part of manifest.print_envelopes) {
  assert.equal(part.solid_count,1,part.name);
  assert.ok(part.fits_conservative_build_box,part.name);
}
console.log(`Verified ${parts.length*3} CAD part poses and 202 height/bump states; max mesh-bound deviation ${maxError.toFixed(4)} mm.`);

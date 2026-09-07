import fs from 'node:fs';
import assert from 'node:assert/strict';
import {leg,pose,angleAtHeight} from './kinematics.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./output/kinematics_reference.json',import.meta.url)));
let maxError=0;
for(const row of data.fixtures){
 const s=leg(data.parameters.geometry,row.q);
 for(const k of ['C','D','E'])for(let i=0;i<2;i++)maxError=Math.max(maxError,Math.abs(s[k][i]-row[k][i]));
 for(const k of ['phi','beta','knee'])assert.ok(Math.abs(s[k]-row[k])<1e-10);
}
assert.ok(maxError<1e-8);
const p=data.parameters,g=p.geometry;
for(const left of [0,10,25,40,50.22685])for(const right of [0,10,25,40,50.22685]){
 const f=pose(p,[left,right]);
 assert.equal(f.angles[0],angleAtHeight(g,left));assert.equal(f.angles[1],angleAtHeight(g,right));
 assert.ok(Math.abs(f.blocks[0]-f.blocks[1]-(right-left)/1000)<1e-9);
 assert.ok(f.compression_m.every(v=>v>=0&&v<.02));
}
console.log(JSON.stringify({python_reference_poses:data.fixtures.length,max_point_error_mm:maxError,independent_browser_pose_pairs:25,pass:true},null,2));

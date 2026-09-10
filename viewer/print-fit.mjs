import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {sha256} from './sha256.mjs';

const $ = id => document.getElementById(id);
const descriptions = {
  'rigid-fit-plate.stl':'Bearing holes: Ø13, 15, 16 and 19, each in 0.1 mm diameter steps. The M3 row tests screw holes and nut pockets. Tab labels show clearance per side; the separate key is 4 × 7 mm.',
  'horizontal-bearing-plate.stl':'The same bearing ladders printed on their sides. Compare roundness with the upright holes and match the supports planned for the robot part. Each strip has an integral foot.',
  'M2p5-fasteners.stl':'Pi mounting hardware: screw holes Ø2.5–3.0 mm, nut pockets 5.0–5.5 mm across flats. Labels give the addition to the nominal hardware dimension.',
  'TPU-hub-fit-plate.stl':'Print in the intended wheel TPU. Each 3 mm web has three sleeve holes on the robot’s Ø34 mm bolt circle. Hole sizes run Ø5.0–5.5 mm. These samples test fit; the robot still uses a single-piece 120 mm wheel.',
};

try {
  const response = await fetch('../clanky-v2/print-fit/coupons.json');
  if (!response.ok) throw Error('Fit samples are not available');
  const manifest = await response.json();
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#eef0eb');
  const renderer = new THREE.WebGLRenderer({canvas:$('cad'), antialias:true, preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const camera = new THREE.PerspectiveCamera(36,1,.1,2000); camera.up.set(0,0,1);
  const controls = new OrbitControls(camera,$('cad')); controls.enableDamping=true;
  controls.minDistance=50; controls.maxDistance=700; controls.target.set(0,0,0);
  const orbit = () => {camera.up.set(0,0,1); camera.position.set(170,-230,290); controls.target.set(0,0,0); controls.update();};
  orbit();
  $('orbit').onclick=orbit;
  $('top').onclick=()=>{camera.up.set(0,1,0);camera.position.set(0,0,380);controls.target.set(0,0,0);controls.update();};
  scene.add(new THREE.HemisphereLight(0xffffff,0x8b9a86,2));
  const key = new THREE.DirectionalLight(0xffffff,3); key.position.set(-90,-120,240); scene.add(key);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(180,180,1),new THREE.MeshStandardMaterial({color:0xe3e7de,roughness:1}));
  bed.position.z=-.7;scene.add(bed);
  const grid = new THREE.GridHelper(180,18,0xa8b5a3,0xc7d0c1);grid.rotateX(Math.PI/2);grid.position.z=-.18;scene.add(grid);
  let current=null,serial=0;
  async function select() {
    const request=++serial,name=$('plate').value;
    $('description').textContent=descriptions[name];$('status').textContent='Loading CAD…';
    try {
      const row=manifest.outputs.find(r=>r.file===name);
      if (!row) throw Error('Unknown fit sample');
      const r=await fetch('../clanky-v2/print-fit/'+name);
      if (!r.ok) throw Error('Sample STL is not available');
      const bytes=await r.arrayBuffer();
      if (await sha256(bytes)!==row.sha256) throw Error('STL and fit manifest do not match');
      if (request!==serial) return;
      // The local generator exports binary STL. Require its exact layout.
      if(bytes.byteLength<84) throw Error('Incomplete binary STL');
      const view=new DataView(bytes),count=view.getUint32(80,true);
      if(bytes.byteLength!==84+50*count) throw Error('Unexpected STL format');
      const positions=new Float32Array(count*9),normals=new Float32Array(count*9);
      for(let i=0;i<count;i++) {
        const start=84+50*i;
        for(let v=0;v<3;v++) for(let a=0;a<3;a++) {
          positions[i*9+v*3+a]=view.getFloat32(start+12+12*v+4*a,true);
          normals[i*9+v*3+a]=view.getFloat32(start+4*a,true);
        }
      }
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.computeBoundingBox();
      const b=geometry.boundingBox;
      geometry.translate(-(b.min.x+b.max.x)/2,-(b.min.y+b.max.y)/2,-b.min.z);
      if(current){scene.remove(current);current.geometry.dispose();current.material.dispose();}
      current=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:name.startsWith('TPU')?0x34483e:0x7ea292,roughness:.72}));
      scene.add(current);
      $('status').textContent=`${row.bounds_mm.map(x=>Math.round(x*10)/10).join(' × ')} mm · ${row.solids} ${row.solids===1?'sample':'separate samples'} · not yet printed`;
    } catch(error) { if(request===serial) $('status').textContent=error.message; }
  }
  $('plate').onchange=select;await select();
  const resize=()=>{const b=$('cad').parentElement.getBoundingClientRect();renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();};
  new ResizeObserver(resize).observe($('cad').parentElement);resize();
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
} catch(error) { $('status').textContent=error.message; }

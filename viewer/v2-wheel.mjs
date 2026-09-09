import {sha256 as digest} from './sha256.mjs';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {shellNormals} from './cad-robot.mjs';

const $ = id => document.getElementById(id);
async function resource(name) {
  const r = await fetch('../clanky-v2/geared-wheel/'+name);
  if (!r.ok) throw Error('Wheel module export unavailable: '+name);
  return r;
}
try {
  const manifest = await (await resource('manifest.json')).json();
  const bytes = await (await resource('parts.json')).arrayBuffer();
  const sha = await digest(bytes);
  if (sha !== manifest.asset_sha256['parts.json']) throw Error('Module CAD checksum mismatch');
  const parts = JSON.parse(new TextDecoder().decode(bytes));
  const audit = await (await resource('interfaces.json')).json();
  if (sha !== audit.parts_sha256) throw Error('Module fit evidence is stale');
  $('evidence').textContent = audit.passed
    ? 'Modeled parts pass the nominal internal collision check. Full robot fit, loads and assembly tolerances are still being checked.'
    : 'Internal collisions remain in this development assembly. This is not an approved build.';
  $('prints').textContent = parts.filter(p=>p.printed).length;

  THREE.Object3D.DEFAULT_UP.set(0,0,1);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#edf1ef');
  const root = new THREE.Group(); scene.add(root);
  const colors = {shell:'#c7d2ca', tire:'#23332e', metal:'#8d9b98', motor:'#536760', copper:'#b77338', gear:'#bba06b', board:'#316b56'};
  const objects = parts.map(p => {
    let g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p.vertices.flat(),3));
    g.setIndex(p.triangles.flat()); g.computeVertexNormals();
    if(p.material==='shell')g=shellNormals(g);
    const motor = p.name.startsWith('pinion') || p.name.startsWith('rotor_') || ['V2806_rotor','encoder_magnet'].includes(p.name);
    const z = motor ? manifest.motor_offset_xz_mm[1] : 0;
    g.translate(0,0,-z);
    const pivot=new THREE.Group();pivot.position.z=z;root.add(pivot);
    const material=new THREE.MeshStandardMaterial({color:colors[p.material]??colors.metal,roughness:p.material==='tire'?.92:.48,metalness:['metal','gear','motor','copper'].includes(p.material)?.35:0});
    const mesh=new THREE.Mesh(g,material);mesh.castShadow=mesh.receiveShadow=true;pivot.add(mesh);
    return {p,mesh,pivot,motor};
  });
  const canvas=$('model-canvas'),viewport=canvas.parentElement;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const camera=new THREE.PerspectiveCamera(35,1,.5,3000),controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=80;controls.maxDistance=1500;
  scene.add(new THREE.HemisphereLight('#ffffff','#687d6f',1.8));
  const key=new THREE.DirectionalLight('#fff4df',3.2);key.position.set(150,280,450);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.normalBias=.12;
  Object.assign(key.shadow.camera,{left:-230,right:230,top:230,bottom:-230,near:1,far:1000});scene.add(key);
  const fill=new THREE.DirectionalLight('#d9e9ff',1.2);fill.position.set(-160,-200,160);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),new THREE.MeshStandardMaterial({color:'#e8eee9',roughness:1}));floor.position.z=-60.3;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(1800,90,'#bfccc3','#d4ded7');grid.rotation.x=Math.PI/2;grid.position.z=-60.2;grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);
  let view='cutaway',cameraMode='iso',playing=false,last=performance.now(),wheelAngle=0;
  function draw() {
    const explode=$('explode').valueAsNumber,angle=$('rotation').valueAsNumber*Math.PI/180;
    $('explode-value').textContent=Math.round(explode*100)+'%';$('rotation-value').textContent=Math.round(angle*180/Math.PI)+'°';
    for(const {p,mesh,pivot,motor} of objects){
      pivot.rotation.y=p.rotates?angle*(motor?-5:1):0;
      let shift=0;
      if(p.name==='tire')shift=65;
      else if(p.name.startsWith('wheel_')||p.name.startsWith('TPU_')||p.name.startsWith('shaft_end'))shift=43;
      else if(p.name==='encoder_service_cap'||p.name.startsWith('encoder_')||p.name.startsWith('rear_cap'))shift=-30;
      else if(p.name==='bearing_service_lid'||p.name.startsWith('lid_'))shift=19;
      else if(p.name==='shin_case')shift=-12;
      pivot.position.y=shift*explode;
      const ghost=view==='cutaway'&&(p.material==='shell'||p.material==='tire');
      mesh.material.transparent=ghost;mesh.material.opacity=ghost?.07:1;mesh.material.depthWrite=!ghost;mesh.castShadow=!ghost;
    }
  }
  function fit(){
    const b=new THREE.Box3().setFromObject(root),target=b.getCenter(new THREE.Vector3()),r=b.getSize(new THREE.Vector3()).length()/2;
    const half=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
    const direction={iso:[1.15,1.9,.9],face:[0,1,.001],edge:[1,0,.001]}[cameraMode];
    camera.position.copy(target).addScaledVector(new THREE.Vector3(...direction).normalize(),r/Math.sin(half)*1.06);controls.target.copy(target);controls.update();
  }
  $('explode').oninput=draw;$('rotation').oninput=()=>{wheelAngle=$('rotation').valueAsNumber;playing=false;$('spin').textContent='Play gear motion';draw();};
  $('spin').onclick=()=>{playing=!playing;$('spin').textContent=playing?'Pause gear motion':'Play gear motion';};
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));draw();});
  document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{cameraMode=b.dataset.camera;document.querySelectorAll('[data-camera]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));fit();});
  $('fit').onclick=fit;
  const resize=()=>{renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();fit();};
  draw();resize();new ResizeObserver(resize).observe(viewport);$('load-status').hidden=true;
  renderer.setAnimationLoop(now=>{const dt=Math.min(.05,(now-last)/1000);last=now;if(playing){wheelAngle=(wheelAngle+25*dt)%360;$('rotation').value=wheelAngle;draw();}controls.update();renderer.render(scene,camera);});
}catch(error){$('load-status').textContent=error.message;$('load-status').classList.add('error');console.error(error);}

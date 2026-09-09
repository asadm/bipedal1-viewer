import {sha256 as digest} from './sha256.mjs';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {shellNormals} from './cad-robot.mjs';

const $ = id => document.getElementById(id);
const query = new URLSearchParams(location.search);
async function resource(path) {
  const response = await fetch('../clanky-v2/'+path);
  if (!response.ok) throw Error('CAD resource unavailable: '+path);
  return response.arrayBuffer();
}
const decode = bytes => JSON.parse(new TextDecoder().decode(bytes));

try {
  const [manifestBytes, supplierBytes, mountingBytes, sizingBytes, driveBytes, layoutBytes] = await Promise.all([
    'integrated-hip/viewer-manifest.json','integrated-hip/viewer-parts.json',
    'integrated-hip/mounting-screen.json','integrated-hip/actuator-screen.json',
    'hip-gear-layout/viewer-parts.json','hip-gear-layout/layout-screen.json'
  ].map(resource));
  const manifest=decode(manifestBytes), mounting=decode(mountingBytes), sizing=decode(sizingBytes), layout=decode(layoutBytes);
  if (await digest(supplierBytes)!==manifest.parts_sha256 || await digest(mountingBytes)!==manifest.source_sha256['integrated-hip/mounting-screen.json']) throw Error('RS05 geometry or mounting study checksum mismatch');
  if (await digest(driveBytes)!==layout.viewer_parts_sha256) throw Error('Custom drive geometry checksum mismatch');
  const supplier=decode(supplierBytes), current=decode(driveBytes).filter(p=>p.name.startsWith('left_'));
  if (supplier.length!==manifest.parts || supplier.length!==mounting.supplier_solids.length) throw Error('Supplier component count mismatch');
  $('rs05-size').textContent=manifest.supplier_bounds_mm.map(n=>Math.round(n)).join(' × ')+' mm';
  $('rs05-mass').textContent=sizing.rs05.mass_g+' g';
  $('rs05-voltage').textContent=sizing.rs05.supply_range_V.join('–')+' / '+sizing.rs05.rated_voltage_V+' V';
  $('rs05-price').textContent='$'+sizing.rs05.price_USD;
  $('edulite-price').textContent='$'+sizing.edulite05.price_USD;
  $('source-status').textContent=`All ${supplier.length} supplier solids loaded. CAD checksums match the mounting study and gear layout. Finishes are illustrative. The current drive's case and detailed output joint are omitted here to expose its gear train.`;

  THREE.Object3D.DEFAULT_UP.set(0,0,1);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#edf1ef');
  const root=new THREE.Group(),custom=new THREE.Group(),rs05=new THREE.Group();scene.add(root);root.add(custom,rs05);
  const supplierMeshes=[];
  function mesh(part,color) {
    let geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.vertices.flat(),3));
    geometry.setIndex(part.triangles.flat());
    geometry=shellNormals(geometry);
    const material=new THREE.MeshStandardMaterial({color,roughness:.42,metalness:.38});
    const result=new THREE.Mesh(geometry,material);result.castShadow=result.receiveShadow=true;return result;
  }
  for (const part of current) {
    const allocation=part.material==='allocation';
    const color=allocation?'#d69648':part.sku?.startsWith('2302')?'#aebebf':'#455552';
    const object=mesh(part,color);
    if (allocation) {object.material.transparent=true;object.material.opacity=.43;object.material.depthWrite=false;object.castShadow=false;}
    custom.add(object);
  }
  for (const part of supplier) {
    const color={housing:'#3b4d4c',metal:'#b2bfc0',board:'#347c60'}[part.finish];
    const object=mesh(part,color);rs05.add(object);supplierMeshes.push({part,object,color});
  }
  // The exact old-shaft probe used by integrated_hip_cad.py, in this display frame.
  const probe=new THREE.Mesh(new THREE.CylinderGeometry(4,4,55,48),new THREE.MeshStandardMaterial({color:'#c54435',roughness:.4,transparent:true,opacity:.8}));
  probe.position.y=-20.5;probe.visible=false;rs05.add(probe);
  const customBounds=new THREE.Box3().setFromObject(custom);
  const rs05Bounds=new THREE.Box3().setFromObject(rs05);
  // Independent rigid translations only: both CAD assemblies retain millimetre scale.
  const customCentre=customBounds.getCenter(new THREE.Vector3()), rs05Centre=rs05Bounds.getCenter(new THREE.Vector3());
  custom.position.set(-85-customCentre.x,-customCentre.y,-customBounds.min.z+12);
  rs05.position.set(80-rs05Centre.x,-rs05Centre.y,-rs05Bounds.min.z+12);
  const tagPoints={custom:new THREE.Vector3(-85,0,-5),rs05:new THREE.Vector3(80,0,-5)};
  const canvas=$('model-canvas'),viewport=canvas.parentElement;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const camera=new THREE.PerspectiveCamera(35,1,.5,4000),controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.minDistance=60;controls.maxDistance=2000;
  scene.add(new THREE.HemisphereLight('#ffffff','#738579',1.7));
  const key=new THREE.DirectionalLight('#fff6e9',3);key.position.set(30,180,360);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.normalBias=.08;
  Object.assign(key.shadow.camera,{left:-220,right:220,top:220,bottom:-220,near:1,far:1000});scene.add(key);
  const fill=new THREE.DirectionalLight('#dce9ff',1.2);fill.position.set(-240,-200,150);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshStandardMaterial({color:'#e7ece8',roughness:1}));floor.position.z=-12;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(2000,100,'#b8c6bc','#ccd6cf');grid.rotation.x=Math.PI/2;grid.position.z=-11.9;grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);
  let selection=['compare','custom','rs05'].includes(query.get('scene'))?query.get('scene'):'compare',cameraMode='iso';
  $('spindle').checked=query.get('spindle')==='1';
  if ($('spindle').checked && selection==='custom') selection='rs05';
  function update() {
    custom.visible=selection!=='rs05';rs05.visible=selection!=='custom';
    const conflict=$('spindle').checked;probe.visible=conflict;
    for (const {part,object,color} of supplierMeshes) {
      const ghost=conflict&&!part.spindle_conflict;
      object.material.color.set(conflict&&part.spindle_conflict?'#cb806e':color);
      if (object.material.transparent!==ghost) object.material.needsUpdate=true;
      object.material.transparent=ghost;object.material.opacity=ghost?.1:1;object.material.depthWrite=!ghost;object.castShadow=!ghost;
    }
    $('view-note').textContent=conflict
      ? 'Red: the existing Ø8 mm spindle. Three supplier solids intersect it. The ghosted housing reveals the conflict; this is not an assembled replacement.'
      : 'Current: gear layout with amber motor and support allocations. RS05: actual supplier module. The robot case and custom output joint are hidden for comparison.';
    if (!conflict && selection==='rs05') $('view-note').textContent='The RS05 output face points outward. Mounts, thigh coupling and heat sink are not modeled in this supplier assembly.';
    if (!conflict && selection==='custom') $('view-note').textContent='The current 16:1 gear layout: 15→60 teeth, then 20→80. Amber solids reserve motor and support space. Case and detailed output joint are hidden.';
    document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===selection)));
    const url=new URL(location.href);url.searchParams.set('scene',selection);if(conflict)url.searchParams.set('spindle','1');else url.searchParams.delete('spindle');history.replaceState(null,'',url);
  }
  function fit() {
    root.updateMatrixWorld(true);
    const bounds=new THREE.Box3();if(custom.visible)bounds.expandByObject(custom);if(rs05.visible)bounds.expandByObject(rs05);
    const target=bounds.getCenter(new THREE.Vector3());
    const direction={iso:[.7,2,1],front:[0,1,.001],side:[1,0,.001]}[cameraMode];
    const backward=new THREE.Vector3(...direction).normalize(),right=new THREE.Vector3().crossVectors(camera.up,backward).normalize(),up=new THREE.Vector3().crossVectors(backward,right);
    const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanX=tanY*camera.aspect;
    let distance=60;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      const point=new THREE.Vector3(x,y,z).sub(target),depth=point.dot(backward);
      distance=Math.max(distance,depth+Math.abs(point.dot(right))/tanX,depth+Math.abs(point.dot(up))/tanY);
    }
    camera.position.copy(target).addScaledVector(backward,distance*1.22);controls.target.copy(target);controls.update();
  }
  function placeTags() {
    for (const [name,group] of [['custom',custom],['rs05',rs05]]) {
      const label=$(name+'-label'),p=tagPoints[name].clone().project(camera);
      label.hidden=!group.visible||p.z>1||p.z< -1||Math.abs(p.x)>.92||Math.abs(p.y)>.84;
      label.style.left=((p.x+1)/2*viewport.clientWidth)+'px';label.style.top=((1-p.y)/2*viewport.clientHeight)+'px';
    }
  }
  document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{selection=b.dataset.scene;if(selection==='custom')$('spindle').checked=false;update();fit();});
  $('spindle').onchange=()=>{if($('spindle').checked)selection='rs05';update();fit();};
  document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{cameraMode=b.dataset.camera;document.querySelectorAll('[data-camera]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));fit();});
  $('fit').onclick=fit;
  const resize=()=>{renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();fit();};
  update();resize();new ResizeObserver(resize).observe(viewport);$('load-status').hidden=true;
  renderer.setAnimationLoop(()=>{controls.update();placeTags();renderer.render(scene,camera);});
} catch(error) {
  $('load-status').textContent=error.message;$('load-status').classList.add('error');console.error(error);
}

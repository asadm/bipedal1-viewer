import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { angleRange, pose, transformFor } from '../concept02/kinematics.mjs';

const canvas = document.getElementById('model-canvas');
const viewport = canvas.parentElement;
const status = document.getElementById('load-status');
const slider = document.getElementById('height-travel');
const $ = (id) => document.getElementById(id);
const colors = {
  shell:'#e4e7df', arm:'#d9dfd6', bumper:'#303c3c', tire:'#222b2b',
  rim:'#485859', hub:'#cbd5cb', glass:'#11212a', light:'#4cd6eb',
  metal:'#889f9e', jump:'#e99142', spring:'#c6a05c', drive:'#54796a',
  battery:'#657179', electronics:'#436c60',
};
const categories = { shell:'Printed body shell', arm:'Covered printed arm', bumper:'TPU impact wrap',
  tire:'Purchased tire envelope', rim:'Wheel / pivot detail', hub:'Wheel / pivot detail',
  glass:'Fixed sensor face', light:'Light aperture', metal:'Hardware reservation',
  jump:'Provisional jump drive', spring:'Provisional elastic coupling', drive:'Wheel motor envelope',
  battery:'Battery reservation', electronics:'Electronics reservation' };
const skin = new Set(['shell','arm','bumper','glass','light']);

try {
  const responses = await Promise.all([fetch('../concept02/parameters.json'), fetch('../output/concept02/parts.json'), fetch('../output/concept02/manifest.json')]);
  for (const response of responses) if (!response.ok) throw new Error(`Missing design asset (${response.status}): ${response.url}`);
  const [p, parts, manifest] = await Promise.all(responses.map(r => r.json()));
  if (!manifest.poses.normal) throw new Error('Build all CAD poses first; the normal pose is required.');
  // Reject stale CAD instead of animating old meshes with new parameters.
  if (JSON.stringify(manifest.parameters) !== JSON.stringify(p)) throw new Error('CAD parameters changed. Rebuild the CAD before viewing.');
  const [lowAngle, highAngle] = angleRange(p);
  const deg=180/Math.PI;

  THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#edf1ef');
  scene.fog = new THREE.Fog('#edf1ef', 1200, 2500);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(36, 1, 1, 4000);
  camera.up.set(0, 0, 1);
  camera.position.set(350, -470, 310);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(-10, 0, 104);
  controls.enableDamping = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.dampingFactor = .09;
  controls.minDistance = 85;
  controls.maxDistance = 1800;
  controls.minPolarAngle = .001;
  controls.maxPolarAngle = Math.PI - .001;
  controls.zoomSpeed = .8;
  controls.panSpeed = .8;
  controls.rotateSpeed = .7;
  let dirty = true;
  controls.addEventListener('change', () => { dirty = true; });
  controls.addEventListener('start', () => document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', 'false')));
  scene.add(new THREE.HemisphereLight('#ffffff', '#9da895', 2.25));
  const keyLight = new THREE.DirectionalLight('#fffaf1', 3.1);
  keyLight.position.set(190, -270, 580);
  keyLight.target.position.set(0, 0, 85);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  Object.assign(keyLight.shadow.camera, { left: -270, right: 270, top: 270, bottom: -270, near: 10, far: 1100 });
  keyLight.shadow.normalBias = .25;
  keyLight.shadow.bias = -.00008;
  scene.add(keyLight, keyLight.target);
  const fillLight = new THREE.DirectionalLight('#e1edff', 1.4);
  fillLight.position.set(-280, 160, 240);
  scene.add(fillLight);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: '#e7ece8', roughness: 1 }));
  floor.position.z = -.5;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(800, 40, '#acb8ab', '#c4cec1');
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -.3;
  grid.material.transparent = true;
  grid.material.opacity = .26;
  scene.add(grid);
  const assembly = new THREE.Group();
  scene.add(assembly);
  const meshes = [];
  let state, selected = null, frameMode = 'solid';

  for (const part of parts) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices.flat(), 3));
    geometry.setIndex(part.triangles.flat());
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const material = new THREE.MeshStandardMaterial({
      color: colors[part.material], roughness: part.material === 'glass' ? .19 : part.material === 'tire' ? .92 : .47,
      metalness: part.material === 'metal' ? .55 : .03,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    });
    if(part.material==='light') { material.emissive.set('#38aec4'); material.emissiveIntensity=.45; }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = part.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.part = part;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 28), new THREE.LineBasicMaterial({ color: '#293b3c', transparent: true, opacity: .21 }));
    mesh.add(edges);
    mesh.userData.edges = edges;
    assembly.add(mesh);
    meshes.push(mesh);
  }

  const bumpBlock=new THREE.Mesh(new THREE.BoxGeometry(109,34,p.bump_preview),new THREE.MeshStandardMaterial({color:'#b4bfad',roughness:.9}));
  bumpBlock.receiveShadow=true; bumpBlock.castShadow=true; scene.add(bumpBlock);
  function setAngle(angle) {
    state=pose(p,angle,$('show-bump').checked?p.bump_preview:0,0);
    for(const mesh of meshes) {
      const t=transformFor(mesh.userData.part,p,state);
      mesh.position.set(...t.position); mesh.rotation.set(0,t.angle,0);
    }
    slider.value=String(state.angle*deg);
    slider.setAttribute('aria-valuetext',`${(state.angle*deg).toFixed(1)} degrees shared leg angle, ${state.height.toFixed(1)} millimetres body rise`);
    $('travel-output').innerHTML=`${(state.angle*deg).toFixed(1)} <span>°</span>`;
    $('rise-output').textContent=`${state.height.toFixed(1)} / ${p.height_range} mm`;
    $('overall-output').textContent=`${(state.bodyZ+p.body_top).toFixed(1)} mm`;
    for(const button of document.querySelectorAll('[data-height]')) {
      const target=button.dataset.height==='low'?0:button.dataset.height==='high'?p.height_range:p.height_range/2;
      button.setAttribute('aria-pressed',String(Math.abs(state.height-target)<.025));
    }
    bumpBlock.visible=$('show-bump').checked;
    bumpBlock.position.set(state.left.wheel[0],p.track/2,p.bump_preview/2);
    dirty=true;
  }
  function setHeight(height) { setAngle(Math.asin((p.low_axle_drop+height)/p.arm_length)); }

  function clearSelection() {
    if (selected) { selected.material.emissive.set(selected.userData.part.material==='light'?'#38aec4':'#000000'); selected.material.emissiveIntensity=selected.userData.part.material==='light'?.45:1; }
    selected = null;
    $('selection').replaceChildren();
    const label = document.createElement('p');
    label.className = 'selection-empty';
    label.textContent = 'Click a part in the model to inspect it.';
    $('selection').append(label);
    $('clear-selection').hidden = true;
    dirty = true;
  }

  function showSelection(mesh) {
    clearSelection();
    if (!mesh) return;
    selected = mesh;
    selected.material.emissive.set('#bd7228');
    selected.material.emissiveIntensity = .32;
    const part = mesh.userData.part;
    const name = part.name.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
    $('selection').replaceChildren();
    for (const [className, text] of [['part-category', categories[part.material]], ['part-name', name], ['part-detail', part.description || 'Part of the current CAD assembly.']]) {
      const el = document.createElement('p'); el.className = className; el.textContent = text; $('selection').append(el);
    }
    $('clear-selection').hidden = false;
    dirty = true;
  }

  function updateDisplay() {
    for(const mesh of meshes) {
      const part=mesh.userData.part;
      mesh.visible= !part.group.endsWith('_wheel') || $('show-wheels').checked;
      if(frameMode==='cutaway' && part.hide_cutaway) mesh.visible=false;
      const ghost=frameMode==='ghost' && skin.has(part.material);
      mesh.material.transparent=ghost;
      mesh.material.opacity=ghost?.13:1;
      mesh.material.depthWrite=!ghost;
      mesh.castShadow=!ghost;
      mesh.material.needsUpdate=true;
      mesh.userData.edges.visible=$('show-edges').checked;
    }
    if(selected && !selected.visible) clearSelection();
    $('canvas-caption').textContent=frameMode==='cutaway'?'Front shell and right arm cover removed':frameMode==='ghost'?'Transparent enclosure':'Enclosed concept';
    dirty=true;
  }

  function fitView(direction) {
    const offset = direction || camera.position.clone().sub(controls.target).normalize();
    controls.target.set(-10, 0, 104);
    const extent = Math.max(240, 275 / Math.max(.3, camera.aspect));
    const distance = extent / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.42;
    camera.position.copy(controls.target).addScaledVector(offset, distance);
    camera.lookAt(controls.target);
    controls.update();
    dirty = true;
  }

  function cameraView(name) {
    const directions = { iso: [1, -1.35, .80], front: [1, 0, 0], side: [0, -1, 0], top: [.00001, 0, 1] };
    fitView(new THREE.Vector3(...directions[name]).normalize());
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  }

  slider.min=String(lowAngle*deg);
  slider.max=String(highAngle*deg);
  // Include the exact end position; keyboard End and the far-right thumb hit full travel.
  slider.step = 'any';
  slider.disabled = false;
  slider.addEventListener('input', () => setAngle(Number(slider.value)/deg));
  for (const button of document.querySelectorAll('[data-height]')) {
    button.disabled = false;
    button.addEventListener('click', () => setHeight(button.dataset.height === 'low' ? 0 : button.dataset.height === 'high' ? p.height_range : p.height_range / 2));
  }
  for (const button of document.querySelectorAll('[data-frame]')) button.addEventListener('click', () => {
    frameMode = button.dataset.frame;
    document.querySelectorAll('[data-frame]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    updateDisplay();
  });
  for(const id of ['show-wheels','show-edges']) $(id).addEventListener('change',updateDisplay);
  $('show-bump').addEventListener('change',()=>setAngle(state.angle));
  $('locate-drive').addEventListener('click',()=>{
    document.querySelector('[data-frame="cutaway"]').click();
    showSelection(meshes.find(m=>m.name==='jump_drive_reservation'));
  });
  for (const button of document.querySelectorAll('[data-view]')) button.addEventListener('click', () => cameraView(button.dataset.view));
  $('fit-view').addEventListener('click', () => fitView());
  $('clear-selection').addEventListener('click', clearSelection);
  const raycaster = new THREE.Raycaster();
  let pointerStart = null;
  canvas.addEventListener('pointerdown', e => { if (e.button === 0) pointerStart = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointercancel', () => { pointerStart = null; });
  canvas.addEventListener('pointerup', e => {
    if (e.button !== 0 || !pointerStart) return;
    const moved = Math.hypot(e.clientX-pointerStart[0], e.clientY-pointerStart[1]);
    pointerStart = null;
    if (moved > 5) return;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1, -(e.clientY-rect.top)/rect.height*2+1), camera);
    const eligible = meshes.filter(m => m.visible && !(frameMode === 'ghost' && skin.has(m.userData.part.material)));
    showSelection(raycaster.intersectObjects(eligible, false)[0]?.object);
  });
  canvas.addEventListener('keydown', e => {
    const offset = camera.position.clone().sub(controls.target);
    if (e.key === 'Home') { e.preventDefault(); cameraView('iso'); return; }
    if (e.key === '+' || e.key === '=') offset.multiplyScalar(.90);
    else if (e.key === '-') offset.multiplyScalar(1.10);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') offset.applyAxisAngle(new THREE.Vector3(0,0,1), e.key === 'ArrowLeft' ? -.10 : .10);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') offset.applyAxisAngle(offset.clone().cross(camera.up).normalize(), e.key === 'ArrowUp' ? .10 : -.10);
    else return;
    e.preventDefault();
    offset.clampLength(controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset); camera.lookAt(controls.target); controls.update(); dirty = true;
  });
  let firstResize = true;
  new ResizeObserver(() => {
    const w = viewport.clientWidth, h = viewport.clientHeight;
    camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
    if (firstResize) { cameraView('iso'); firstResize = false; }
    else fitView();
    dirty = true;
  }).observe(viewport);
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault(); status.hidden = false; status.className = 'error'; status.textContent = '3D graphics were interrupted. Reload this page to reconnect.';
  });
  setHeight(p.height_range / 2);
  updateDisplay();
  status.hidden = true;
  function render() { requestAnimationFrame(render); controls.update(); if (dirty) { renderer.render(scene, camera); dirty = false; } }
  render();
} catch (error) {
  status.hidden = false;
  status.className = 'error';
  status.textContent = `Could not open the 3D model. ${error.message} Use the local viewer server and a browser with WebGL enabled.`;
  console.error(error);
}

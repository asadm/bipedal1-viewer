import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { actuatorStroke, heightFromTravel, upperEye, pose, transformFor, localVertex } from './kinematics.mjs';

const canvas = document.getElementById('model-canvas');
const viewport = canvas.parentElement;
const status = document.getElementById('load-status');
const slider = document.getElementById('height-travel');
const $ = (id) => document.getElementById(id);
const colors = {
  frame: '#718799', arm: '#2d96bf', height: '#ef922f', shock: '#d5ab4c',
  metal: '#aebec5', tire: '#292f34', rim: '#bcc9cf', drive: '#3d9473',
  battery: '#5197aa', electronics: '#697088', bumper: '#484b4e',
};
const categories = { frame: 'Printed chassis', arm: 'Printed suspension arm', height: 'Height mechanism',
  shock: 'Spring and damper', metal: 'Metal hardware', tire: 'Rubber tire', rim: 'Printed rim / hub',
  drive: 'Wheel motor', battery: 'Battery envelope', electronics: 'Electronics envelope', bumper: 'TPU stop sleeve' };

try {
  const responses = await Promise.all([fetch('../cad/parameters.json'), fetch('../output/mesh_normal.json'), fetch('../output/assembly_manifest.json')]);
  for (const response of responses) if (!response.ok) throw new Error(`Missing design asset (${response.status}): ${response.url}`);
  const [p, parts, manifest] = await Promise.all(responses.map(r => r.json()));
  if (!manifest.poses.normal) throw new Error('Build all CAD poses first; the normal pose is required.');
  // Reject stale CAD instead of animating old meshes with new parameters.
  if (JSON.stringify(manifest.parameters) !== JSON.stringify(p)) throw new Error('CAD parameters changed. Rebuild the CAD before viewing.');
  const reference = pose(p, manifest.poses.normal.state.height_mm);
  const stroke = actuatorStroke(p);
  const fixedTop = Math.max(...parts.filter(v => v.group === 'fixed').flatMap(v => v.vertices.map(x => x[2] - reference.bodyZ)));

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
    const referenceTransform = transformFor(part, p, reference);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices.flatMap(v => localVertex(v, referenceTransform, reference.bodyZ)), 3));
    geometry.setIndex(part.triangles.flat());
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const material = new THREE.MeshStandardMaterial({
      color: colors[part.material], roughness: part.material === 'metal' ? .32 : .64,
      metalness: part.material === 'metal' ? .55 : .03,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    });
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

  function setHeight(height) {
    state = pose(p, height);
    assembly.position.z = state.bodyZ;
    for (const mesh of meshes) {
      const transform = transformFor(mesh.userData.part, p, state);
      mesh.position.set(...transform.position);
      mesh.rotation.set(0, transform.angle, 0);
    }
    slider.value = String(state.travel);
    slider.setAttribute('aria-valuetext', `${state.travel.toFixed(2)} millimetres actuator travel, ${height.toFixed(1)} millimetres body rise`);
    $('travel-output').innerHTML = `${state.travel.toFixed(2)} <span>mm</span>`;
    $('rise-output').textContent = `${height.toFixed(1)} / ${p.height_range} mm`;
    $('overall-output').textContent = `${(state.bodyZ + fixedTop).toFixed(1)} mm`;
    $('shock-output').textContent = `${state.left.shockLength.toFixed(1)} mm`;
    for (const button of document.querySelectorAll('[data-height]')) {
      const target = button.dataset.height === 'low' ? 0 : button.dataset.height === 'high' ? p.height_range : p.height_range / 2;
      button.setAttribute('aria-pressed', String(Math.abs(height - target) < .025));
    }
    dirty = true;
  }

  function clearSelection() {
    if (selected) { selected.material.emissive.setHex(0); selected.material.emissiveIntensity = 1; }
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
    for (const mesh of meshes) {
      const part = mesh.userData.part;
      mesh.visible = !(part.material === 'tire' || part.material === 'rim') || $('show-wheels').checked;
      if (part.material === 'battery' || part.material === 'electronics') mesh.visible = $('show-electronics').checked;
      if (part.material === 'frame') {
        mesh.visible = !(frameMode === 'cutaway' && part.name === 'right_chassis');
        mesh.material.transparent = frameMode === 'ghost';
        mesh.material.opacity = frameMode === 'ghost' ? .14 : 1;
        mesh.material.depthWrite = frameMode !== 'ghost';
        mesh.castShadow = frameMode !== 'ghost';
        mesh.material.needsUpdate = true;
      }
      mesh.userData.edges.visible = $('show-edges').checked;
      mesh.userData.edges.material.opacity = part.material === 'frame' && frameMode === 'ghost' ? .10 : .21;
    }
    if (selected && !selected.visible) clearSelection();
    $('canvas-caption').textContent = frameMode === 'cutaway' ? 'Right chassis half removed' : frameMode === 'ghost' ? 'Transparent chassis' : 'Full assembly';
    dirty = true;
  }

  function fitView(direction) {
    const offset = direction || camera.position.clone().sub(controls.target).normalize();
    controls.target.set(-10, 0, 104);
    const extent = Math.max(235, 265 / Math.max(.3, camera.aspect));
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

  slider.max = String(stroke);
  // Include the exact end position; keyboard End and the far-right thumb hit full travel.
  slider.step = 'any';
  slider.disabled = false;
  slider.addEventListener('input', () => setHeight(heightFromTravel(p, Number(slider.value))));
  for (const button of document.querySelectorAll('[data-height]')) {
    button.disabled = false;
    button.addEventListener('click', () => setHeight(button.dataset.height === 'low' ? 0 : button.dataset.height === 'high' ? p.height_range : p.height_range / 2));
  }
  for (const button of document.querySelectorAll('[data-frame]')) button.addEventListener('click', () => {
    frameMode = button.dataset.frame;
    document.querySelectorAll('[data-frame]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    updateDisplay();
  });
  for (const id of ['show-wheels', 'show-electronics', 'show-edges']) $(id).addEventListener('change', updateDisplay);
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
    const eligible = meshes.filter(m => m.visible && !(frameMode === 'ghost' && m.userData.part.material === 'frame'));
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

import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {compiledRobot} from './compiled-robot.mjs';

const $ = id => document.getElementById(id);
const json = async url => {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Cannot load ${url}: ${response.status}`);
  return response.json();
};
const quaternion = values => new THREE.Quaternion(values[1], values[2], values[3], values[0]);

try {
  const catalog = await json('../recovery/catalog.json');
  if (catalog.kind !== 'programmed-development' || catalog.learned_policy || catalog.recovery_validated || catalog.hardware_release) {
    throw Error('Unexpected recovery artifact classification');
  }
  const parts = await json('../recovery/' + catalog.geometry);
  THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#edf1ef');
  const canvas = $('model-canvas'), viewport = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(38, 1, .005, 100); camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true;
  controls.minDistance = .25; controls.maxDistance = 5;
  scene.add(new THREE.HemisphereLight('#ffffff', '#809477', 2.5));
  const light = new THREE.DirectionalLight('#fff7e9', 3); light.position.set(2, -3, 5); scene.add(light);
  light.castShadow = true; light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, {left:-2, right:2, top:2, bottom:-2, near:.1, far:10});
  light.shadow.bias = -.0001;
  const fill = new THREE.DirectionalLight('#dbeaff', 1); fill.position.set(-2, 1, 3); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({color: '#e5ebe3', roughness: 1})); floor.position.z = -.0003; scene.add(floor);
  floor.receiveShadow = true;
  const grid = new THREE.GridHelper(30, 600, '#aebba8', '#c3cec0'); grid.rotation.x = Math.PI / 2; grid.position.z = .0001; grid.material.transparent = true; grid.material.opacity = .32; scene.add(grid);
  const {root, groups} = compiledRobot(parts); scene.add(root);
  let record, time = 0, playing = false, previous = performance.now(), selection = 0;
  let target = new THREE.Vector3(0, 0, .12);
  const cache = new Map();
  function play(value) { playing = value; $('play').textContent = value ? 'Pause' : 'Play'; }
  function view(name = 'iso') {
    const direction = {iso: [1, -1.4, .8], side: [0, -1, .08], front: [1, 0, .1]}[name];
    controls.target.copy(target);
    camera.position.copy(target).addScaledVector(new THREE.Vector3(...direction).normalize(), Math.max(.85, .65 / camera.aspect));
    controls.update();
  }
  function show(value) {
    if (!record) return;
    const frames = record.frames;
    time = Math.max(0, Math.min(frames.at(-1).t, value));
    let lo = 0, hi = frames.length - 1;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (frames[mid].t <= time) lo = mid; else hi = mid - 1; }
    const a = frames[lo], b = frames[Math.min(lo + 1, frames.length - 1)];
    const fraction = b.t > a.t ? (time - a.t) / (b.t - a.t) : 0;
    for (const [name, group] of Object.entries(groups)) {
      group.position.set(...a.bodies[name].pos).lerp(new THREE.Vector3(...b.bodies[name].pos), fraction);
      group.quaternion.copy(quaternion(a.bodies[name].quat)).slerp(quaternion(b.bodies[name].quat), fraction);
    }
    const next = groups.chassis.position.clone(); next.z = .12;
    const shift = next.clone().sub(target); camera.position.add(shift); controls.target.add(shift); target.copy(next);
    $('timeline').value = Math.round(time * 1000) / 1000; $('time-output').textContent = time.toFixed(2) + ' s';
    $('tilt').textContent = a.tilt_deg.toFixed(1) + '°';
    $('hips').textContent = a.hip_rad.map(x => (x * 180 / Math.PI).toFixed(0)).join(' / ') + '°';
    $('springs').textContent = a.spring_mm.map(x => x.toFixed(1)).join(' / ') + ' mm';
    $('velocity').textContent = a.speed_m_s.toFixed(2) + ' m/s';
    $('angular').textContent = a.angular_speed_rad_s.toFixed(1) + ' rad/s';
    $('phase').textContent = a.stable ? 'Balanced on wheels' : time >= record.metrics.capture_time_s ? 'Balance feedback' : time === 0 ? 'Fallen start' : 'Programmed get-up';
  }
  async function selectFamily(family) {
    const ticket = ++selection;
    play(false); $('load-status').hidden = false; $('load-status').textContent = 'Loading recovery replay…';
    const entry = catalog.replays.find(row => row.family === family); if (!entry) throw Error('Unknown fall family');
    let next = cache.get(family);
    if (!next) { next = await json('../recovery/' + entry.file); cache.set(family, next); }
    if (ticket !== selection) return;
    if (next.source_sha256 !== entry.source_sha256 || next.half_step_source_sha256 !== entry.half_step_source_sha256) throw Error('Replay provenance mismatch');
    record = next; $('timeline').max = Math.ceil(record.frames.at(-1).t * 1000) / 1000;
    $('verification').textContent = `Stable finish at both timesteps: ${entry.stable_hold_s.toFixed(2)} s / ${entry.half_step_stable_hold_s.toFixed(2)} s held.`;
    if (catalog.sensitivity?.length) {
      const counts = catalog.sensitivity.map(probe => probe.summary[family]);
      const passed = counts.reduce((sum, row) => sum + row.stable_finishes, 0);
      const total = counts.reduce((sum, row) => sum + row.cases, 0);
      $('sensitivity').textContent = `This fall: ${passed}/${total} nearby-start tests succeeded across both timesteps. These include the exact start. Recovery from arbitrary falls remains unvalidated; no learned recovery policy is released.`;
    }
    $('current').textContent = record.metrics.peak_current_A.slice(0, 2).map(x => x.toFixed(1)).join(' / ') + ' A';
    $('evidence').href = '../recovery/' + entry.file;
    for (const id of ['family', 'play', 'restart', 'timeline', 'capture', 'finish']) $(id).disabled = false;
    $('family').value = family;
    show(0); view(); $('load-status').hidden = true;
    const url = new URL(location.href); url.searchParams.set('fall', family); history.replaceState(null, '', url);
  }
  $('mass').textContent = catalog.mass_kg.toFixed(2) + ' kg';
  for (const entry of catalog.replays) $('family').add(new Option(entry.label, entry.family));
  $('family').addEventListener('change', () => selectFamily($('family').value).catch(fail));
  $('play').addEventListener('click', () => { if (time >= record.frames.at(-1).t) show(0); play(!playing); });
  $('restart').addEventListener('click', () => { play(false); show(0); });
  $('timeline').addEventListener('input', () => { play(false); show(Number($('timeline').value)); });
  $('capture').addEventListener('click', () => { play(false); show(record.metrics.capture_time_s); });
  $('finish').addEventListener('click', () => { play(false); show(record.frames.at(-1).t); });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => view(button.dataset.view)));
  $('fit').addEventListener('click', () => view());
  const resize = () => { camera.aspect = viewport.clientWidth / viewport.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(viewport.clientWidth, viewport.clientHeight, false); };
  new ResizeObserver(resize).observe(viewport); resize();
  const requested = new URLSearchParams(location.search).get('fall');
  await selectFamily(catalog.replays.some(row => row.family === requested) ? requested : catalog.replays[0].family);
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - previous) / 1000, .1); previous = now;
    if (playing) { show(time + dt * Number($('speed').value)); if (time >= record.frames.at(-1).t) play(false); }
    controls.update(); renderer.render(scene, camera);
  });
} catch (error) { fail(error); }

function fail(error) {
  $('load-status').hidden = false; $('load-status').classList.add('error');
  $('load-status').textContent = error.message;
  console.error(error);
}

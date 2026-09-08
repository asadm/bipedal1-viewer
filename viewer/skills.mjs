import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {compiledRobot} from './compiled-robot.mjs';
import {cadRobot} from './cad-robot.mjs';
import {inspectionPose, inspectionRange} from './cad-pose.mjs';
import {interpolateBodies} from './replay-pose.mjs';
import {mainRecordings, initialRecordingId, validateRecording, programmedDetail, programmedPhase} from './skill-recordings.mjs';

const $ = id => document.getElementById(id);
const json = async (url, expectedHash) => {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Cannot load ${url} (${response.status})`);
  if (!expectedHash) return response.json();
  const bytes = await response.arrayBuffer();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
  if (digest !== expectedHash) throw Error(`Recording asset checksum mismatch: ${url}`);
  return JSON.parse(new TextDecoder().decode(bytes));
};

try {
  const [catalog, jumpCatalog, recoveryCatalog] = await Promise.all([
    json('../learned/catalog.json'), json('../programmed-jump/catalog.json'), json('../recovery/catalog.json'),
  ]);
  const {policies, demos, recordings} = mainRecordings(catalog, jumpCatalog, recoveryCatalog);
  $('policy-count').textContent = `${policies.length} learned skills · ${demos.length} programmed demos`;
  const canvas = $('model-canvas'), viewport = canvas.parentElement;
  THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#edf1ef');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const camera = new THREE.PerspectiveCamera(37, 1, .5, 15000); camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true;
  controls.minDistance = 150; controls.maxDistance = 3000;
  scene.add(new THREE.HemisphereLight('#ffffff', '#91a085', 2.5));
  const light = new THREE.DirectionalLight('#fff9ee', 3); light.position.set(220, -350, 700); scene.add(light);
  light.castShadow = true; light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, {left: -400, right: 400, top: 400, bottom: -400, near: 1, far: 1600});
  light.shadow.normalBias = .25; scene.add(light.target);
  const fill = new THREE.DirectionalLight('#dceaff', 1); fill.position.set(-250, 150, 350); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({color: '#e5ebe3', roughness: 1})); floor.position.z = -.3; scene.add(floor);
  floor.receiveShadow = true;
  const grid = new THREE.GridHelper(12000, 300, '#aebba8', '#c3cec0'); grid.rotation.x = Math.PI / 2; grid.position.z = .05; grid.material.transparent = true; grid.material.opacity = .28; scene.add(grid);
  const pushArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 150, '#e87924', 35, 20);
  for (const part of [pushArrow.line, pushArrow.cone]) {
    part.material.depthTest = false; part.material.depthWrite = false; part.renderOrder = 10;
  }
  pushArrow.visible = false; scene.add(pushArrow);
  // Detailed CAD and collision hulls share the same plant and body transforms.
  const geometry = await json('../programmed-jump/' + jumpCatalog.geometry, jumpCatalog.geometry_sha256);
  if (!Array.isArray(geometry)) throw Error('Unsupported simulation geometry');
  const {root, groups} = compiledRobot(geometry, 1000); scene.add(root);
  const manifest = await json('../current-cad/manifest.json');
  if (manifest.model_sha256 !== jumpCatalog.model_sha256 || manifest.plant_fingerprint !== jumpCatalog.plant_fingerprint) {
    throw Error('CAD and recordings describe different physical models');
  }
  const cad = cadRobot(await json('../current-cad/' + manifest.parts, manifest.parts_sha256), manifest.parameters);
  if (Object.keys(cad.groups).some(name => !manifest.parameters.rigid_bodies[name])) throw Error('CAD body frames do not match the simulation');
  scene.add(cad.root);
  let selection = 0;
  let record = null, selected = null, time = 0, playing = false, last = performance.now(), target = new THREE.Vector3(20, 0, 155);
  function display(mode) {
    if (!['enclosed', 'cutaway', 'physics'].includes(mode)) mode = 'enclosed';
    cad.display(mode); root.visible = mode === 'physics';
    document.querySelectorAll('[data-display]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.display === mode)));
    $('display-note').textContent = {enclosed: 'Detailed CAD exterior.', cutaway: 'Transparent covers reveal motors, gears, hidden links and springs.',
      physics: 'Actual ground-contact hulls. Internal self-contact is not simulated.'}[mode];
    const url = new URL(location.href); url.searchParams.set('view', mode); history.replaceState(null, '', url);
  }
  document.querySelectorAll('[data-display]').forEach(button => button.onclick = () => display(button.dataset.display));
  display(new URLSearchParams(location.search).get('view'));
  function apply(frame, bodies = frame.bodies) {
    cad.apply({...frame, bodies});
    const activeGroups = groups;
    for (const [name, transform] of Object.entries(bodies)) {
      const group = activeGroups[name]; if (!group) continue;
      group.position.set(...transform.pos.map(v => v * 1000));
      group.quaternion.set(transform.quat[1], transform.quat[2], transform.quat[3], transform.quat[0]);
    }
    const nextTarget = new THREE.Vector3(...bodies.chassis.pos.map(v => v * 1000));
    // Track driving horizontally; a fixed vertical frame makes jumping and
    // raising/lowering visible instead of flying the camera with the chassis.
    nextTarget.z = 155;
    const shift = nextTarget.clone().sub(target); camera.position.add(shift); controls.target.add(shift); target.copy(nextTarget);
    floor.position.x = nextTarget.x; floor.position.y = nextTarget.y;
    grid.position.x = Math.floor(nextTarget.x / 40) * 40; grid.position.y = Math.floor(nextTarget.y / 40) * 40;
    light.position.copy(nextTarget).add(new THREE.Vector3(220, -350, 700)); light.target.position.copy(nextTarget);
    if (record) {
      const push = record.report?.perturbation;
      pushArrow.visible = Boolean(push && frame.t >= push.time_s && frame.t < push.time_s + .4);
      if (pushArrow.visible) {
        const direction = new THREE.Vector3(...push.delta_velocity_m_s).normalize();
        pushArrow.setDirection(direction);
        pushArrow.position.set(...frame.com_m.map(v => v * 1000)).addScaledVector(direction, -220);
      }
      const programmed = selected.type === 'programmed';
      $('phase').textContent = programmed ? programmedPhase(frame, record, selected.skill)
        : selected.skill === 'drive'
          ? Math.abs(frame.command[1]) > 1e-6 ? 'Turn in place'
            : frame.command[0] > 1e-6 ? 'Forward' : frame.command[0] < -1e-6 ? 'Reverse' : 'Stop'
          : selected.skill === 'height'
            ? frame.command[2] < record.frames[0].command[2] - 1e-6 ? 'Lower'
              : frame.command[2] > record.frames[0].command[2] + 1e-6 ? 'Raise' : 'Ride height'
            : frame.phase;
      const height = frame.bodies.chassis.pos[2] * 1000;
      $('height').textContent = programmed ? `${height.toFixed(0)} mm`
        : `${height.toFixed(0)} / ${(frame.command[2] * 1000).toFixed(0)} mm`;
      if (programmed) $('velocity').textContent = `${frame.speed_m_s.toFixed(2)} m/s`;
      else {
        const [w, x, y, z] = frame.bodies.chassis.quat;
        const bodyVelocity = new THREE.Vector3(...frame.qvel.slice(0, 3)).applyQuaternion(new THREE.Quaternion(x, y, z, w).invert());
        $('velocity').textContent = `${bodyVelocity.x.toFixed(2)} / ${frame.command[0].toFixed(2)} m/s`;
      }
      $('contact').textContent = programmed
        ? frame.stable ? 'Stable on wheels' : selected.skill === 'jump'
          ? frame.t > record.metrics.takeoff_s && frame.t < record.metrics.landing_s ? 'Both wheels airborne' : 'Jump sequence'
          : 'Get-up sequence'
        : frame.body_contact ? 'Body contact' : frame.grounded.every(v => !v) ? 'Both wheels airborne' : 'Wheel contact';
      const clearance = programmed ? frame.wheel_clearance_mm : frame.wheel_clearance_m.map(v => v * 1000);
      $('clearance').textContent = clearance ? `${Math.max(0, Math.min(...clearance)).toFixed(1)} mm` : 'Not recorded';
      const [, x, y] = frame.bodies.chassis.quat;
      $('tilt').textContent = `${(Math.acos(Math.max(-1, Math.min(1, 1 - 2 * (x * x + y * y)))) * 180 / Math.PI).toFixed(1)}°`;
      const currents = programmed ? record.metrics.peak_current_A.slice(0, 2) : frame.current_A;
      $('current').textContent = currents.map(v => Math.abs(v).toFixed(1)).join(' / ') + ' A';
      const compression = programmed ? frame.spring_mm : frame.compression_m.map(v => v * 1000);
      $('compression').textContent = compression.map(v => v.toFixed(1)).join(' / ') + ' mm';
    }
  }
  function show(t) {
    if (!record) return;
    const frames = record.frames;
    time = Math.max(frames[0].t, Math.min(frames.at(-1).t, t));
    let lo = 0, hi = frames.length - 1;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (frames[mid].t <= time) lo = mid; else hi = mid - 1; }
    const frame = frames[lo], next = frames[Math.min(lo + 1, frames.length - 1)];
    const fraction = next.t > frame.t ? (time - frame.t) / (next.t - frame.t) : 0;
    apply(frame, interpolateBodies(frame.bodies, next.bodies, fraction));
    $('timeline').value = time; $('time-output').textContent = `${time.toFixed(2)} s`;
  }
  function play(value) { playing = value; $('play').textContent = value ? 'Pause' : 'Play'; }
  function view(name = 'iso') {
    const direction = {iso: [1, -1.45, .8], side: [0, -1, .05], front: [1, 0, .1]}[name];
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === name)));
    controls.target.copy(target); camera.position.copy(target).addScaledVector(new THREE.Vector3(...direction).normalize(), Math.max(790, 630 / camera.aspect)); controls.update();
  }
  async function selectRecording(id) {
    const ticket = ++selection;
    const entry = recordings.find(p => p.id === id); if (!entry) throw Error('Unknown recording');
    const programmed = entry.type === 'programmed';
    play(false); $('replay-controls').hidden = true; $('inspection-controls').hidden = true;
    $('load-status').hidden = false; $('load-status').textContent = `Loading ${programmed ? 'programmed demonstration' : 'validated learned recording'}…`;
    const next = await json(entry.directory + entry.replay, entry.replay_sha256);
    validateRecording(entry, next);
    if (next.frames.some(frame => [...Object.keys(groups), ...Object.keys(cad.groups)].some(name => !frame.bodies[name]))) {
      throw Error('Recording lacks display body transforms');
    }
    if (ticket !== selection) return;
    record = next; selected = entry; $('replay-controls').hidden = false;
    $('policy-select').value = entry.id;
    for (const id of ['controller-kind', 'viewport-kind']) {
      $(id).textContent = programmed ? 'Programmed · demonstration' : 'Learned · validated in simulation';
      $(id).classList.toggle('programmed', programmed); $(id).hidden = false;
    }
    $('height-label').textContent = programmed ? 'Body height' : 'Body / target height';
    $('velocity-label').textContent = programmed ? 'Body speed (3D)' : 'Speed / target';
    $('current-label').textContent = programmed ? 'Peak hip current in run, L / R' : 'Hip current, L / R';
    $('action-start').hidden = !programmed;
    $('action-start').textContent = entry.skill === 'jump' ? 'Play jump' : 'Play get-up';
    $('peak-jump').hidden = !programmed || entry.skill !== 'jump';
    $('replay-title').textContent = entry.label; $('replay-detail').textContent = programmed ? programmedDetail(entry, next) : `${entry.passed}/${entry.cases} campaign cases passed · recorded seed ${next.report.seed} · ${next.report.variant}`;
    $('timeline').min = record.frames[0].t; $('timeline').max = record.frames.at(-1).t;
    $('report-link').href = entry.directory + entry.evaluation; $('record-link').href = entry.directory + entry.replay;
    $('report-link').textContent = programmed ? 'Programmed diagnostic evidence ↗' : 'Evaluation campaign ↗';
    $('learned-downloads').hidden = programmed;
    $('download-separator').hidden = !entry.policy || !entry.checkpoint;
    $('policy-link').hidden = !entry.policy; $('checkpoint-link').hidden = !entry.checkpoint;
    if (entry.policy) $('policy-link').href = entry.directory + entry.policy;
    if (entry.checkpoint) $('checkpoint-link').href = entry.directory + entry.checkpoint;
    const controller = next.report?.controller || '';
    const method = controller.startsWith('Controller lookup') ? 'Demonstration lookup' :
      controller.startsWith('PPO with demonstration residual') ? 'PPO with learned corrections' :
      controller.startsWith('Controller composition') ? 'Combined learned' :
      controller.startsWith('PPO with frozen balance') ? 'PPO with fixed balance' :
      controller.startsWith('Behavior cloning') ? 'Imitation' :
      controller.startsWith('Posture transfer') ? 'Transferred PPO' : 'Learned PPO';
    $('caption').textContent = programmed
      ? `Programmed ${entry.skill === 'jump' ? 'jump and landing' : 'get-up from a selected fallen pose'} · recorded CPU MuJoCo · hardware unqualified`
      : `${method} policy ${entry.policy_sha256.slice(0, 8)} · recorded CPU MuJoCo · hardware unqualified`;
    const url = new URL(location.href); url.searchParams.delete('policy'); url.searchParams.delete('demo'); url.searchParams.delete('inspect');
    url.searchParams.set(programmed ? 'demo' : 'policy', entry.id); history.replaceState(null, '', url);
    show(record.frames[0].t); view(); $('load-status').hidden = true; last = performance.now(); play(true);
  }
  function fail(error) { play(false); $('replay-controls').hidden = true; $('load-status').hidden = false; $('load-status').textContent = error.message; }
  const {stroke, ride} = inspectionRange(manifest);
  for (const id of ['leg-height', 'left-height', 'right-height']) { $(id).max = stroke; $(id).value = ride; }
  function showPose() {
    const heights = [Number($('left-height').value), Number($('right-height').value)];
    $('leg-height').value = (heights[0] + heights[1]) / 2;
    for (const id of ['leg-height', 'left-height', 'right-height']) $(id + '-output').textContent = `${Number($(id).value).toFixed(1)} mm`;
    if (Math.abs(heights[0] - heights[1]) > .01) $('leg-height-output').textContent += ' avg';
    apply(inspectionPose(manifest, heights));
  }
  function inspect() {
    ++selection; play(false); record = selected = null; pushArrow.visible = false;
    $('replay-controls').hidden = true; $('inspection-controls').hidden = false; $('load-status').hidden = true;
    $('policy-select').value = 'inspect'; $('viewport-kind').hidden = false;
    $('viewport-kind').textContent = 'Inspection · prescribed pose'; $('viewport-kind').classList.remove('programmed');
    $('phase').textContent = 'Manual leg travel'; $('contact').textContent = '';
    $('caption').textContent = 'Kinematic inspection · body held level · not a physics simulation';
    const url = new URL(location.href); url.searchParams.delete('policy'); url.searchParams.delete('demo'); url.searchParams.set('inspect', '1'); history.replaceState(null, '', url);
    showPose(); view();
  }
  $('leg-height').oninput = () => { $('left-height').value = $('right-height').value = $('leg-height').value; showPose(); };
  for (const id of ['left-height', 'right-height']) $(id).oninput = showPose;
  document.querySelectorAll('[data-pose]').forEach(button => button.onclick = () => {
    for (const id of ['leg-height', 'left-height', 'right-height']) $(id).value = {low: 0, ride, high: stroke}[button.dataset.pose];
    showPose();
  });
  $('play').onclick = () => { if (time >= record.frames.at(-1).t) show(record.frames[0].t); play(!playing); };
  $('restart').onclick = () => { show(record.frames[0].t); play(true); };
  $('timeline').oninput = () => { play(false); show(Number($('timeline').value)); };
  $('action-start').onclick = () => { show(selected.skill === 'jump' ? .9 : record.frames[0].t); play(true); };
  $('peak-jump').onclick = () => {
    play(false);
    const peak = record.frames.reduce((best, frame) =>
      Math.min(...frame.wheel_clearance_mm) > Math.min(...best.wheel_clearance_mm) ? frame : best);
    show(peak.t);
  };
  $('finish').onclick = () => { play(false); show(record.frames.at(-1).t); };
  $('fit').onclick = () => view();
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => view(button.dataset.view));
  const resize = () => { const rect = viewport.getBoundingClientRect(); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); renderer.setSize(rect.width, rect.height, false); };
  new ResizeObserver(resize).observe(viewport); resize(); view();
  if (recordings.length) {
    $('policy-picker').hidden = false;
    for (const [label, entries] of [['Programmed · demonstrations', demos], ['Learned · validated in simulation', policies]]) {
      const group = document.createElement('optgroup'); group.label = label;
      for (const entry of entries) {
        const option = document.createElement('option'); option.value = entry.id;
        option.textContent = `${entry.type === 'programmed' ? 'Programmed' : 'Learned'} — ${entry.label}`; group.append(option);
      }
      $('policy-select').append(group);
    }
    const inspection = document.createElement('option'); inspection.value = 'inspect'; inspection.textContent = 'Inspect — Manual leg travel'; $('policy-select').append(inspection);
    const choose = id => id === 'inspect' ? inspect() : selectRecording(id).catch(error => { if ($('policy-select').value === id) fail(error); });
    $('policy-select').onchange = () => choose($('policy-select').value);
    const query = new URLSearchParams(location.search);
    const requested = query.get('demo') ?? query.get('policy');
    const initial = initialRecordingId(recordings, requested);
    $('policy-select').value = initial;
    if (query.get('inspect') === '1') inspect(); else await selectRecording(initial);
  }
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - last) / 1000, .1); last = now;
    if (playing && selected) { show(time + dt * Number($('speed').value)); if (time >= record.frames.at(-1).t) { if ($('loop').checked) show(record.frames[0].t); else play(false); } }
    controls.update(); renderer.render(scene, camera);
  });
} catch (error) {
  $('load-status').hidden = false; $('load-status').textContent = error.message;
  $('policy-status').textContent = 'The skills viewer could not load. Please retry.';
  console.error(error);
}

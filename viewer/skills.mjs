import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {pose, leg} from '../concept06/internal-kinematics.mjs';
import {compiledRobot} from './compiled-robot.mjs';
import {programmedEntries, validateRecording, programmedDetail, programmedPhase} from './skill-recordings.mjs';

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
  const [catalog, parts, manifest, jumpCatalog, recoveryCatalog] = await Promise.all([
    json('../learned/catalog.json'), json('../concept06/output/internal-full/parts.json'),
    json('../concept06/output/internal-full/manifest.json'),
    json('../programmed-jump/catalog.json'), json('../recovery/catalog.json'),
  ]);
  if (catalog.schema_version !== 1) throw Error('Unsupported policy catalog version');
  const policies = catalog.policies.map(entry => ({...entry, type: 'learned', directory: '../learned/'}));
  const demos = [...programmedEntries(jumpCatalog, 'jump'), ...programmedEntries(recoveryCatalog, 'recovery')];
  const recordings = [...policies, ...demos];
  $('policy-count').textContent = `${policies.length} learned policies · ${demos.length} programmed demos`;
  $('policy-status').textContent = 'Learned policies passed independent simulation checks. Programmed demos show selected starts. Hardware transfer is still untested.';
  for (const task of catalog.tasks) {
    const item = document.createElement('article');
    const heading = document.createElement('div'); heading.className = 'task-heading';
    const title = document.createElement('strong'); title.textContent = task.label;
    const stage = document.createElement('span'); stage.className = `task-stage ${task.stage === 'Validated' ? 'validated' : ''}`; stage.textContent = task.stage;
    const detail = document.createElement('p'); detail.textContent = task.detail;
    heading.append(title, stage); item.append(heading, detail);
    const demo = demos.find(entry => entry.skill === task.id);
    if (demo) {
      const button = document.createElement('button'); button.textContent = 'Watch programmed demo';
      button.dataset.recording = demo.id; item.append(button);
    }
    $('task-list').append(item);
  }
  const canvas = $('model-canvas'), viewport = canvas.parentElement;
  THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#edf1ef');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const camera = new THREE.PerspectiveCamera(37, 1, .5, 15000); camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true;
  controls.minDistance = 150; controls.maxDistance = 3000;
  scene.add(new THREE.HemisphereLight('#ffffff', '#91a085', 2.5));
  const light = new THREE.DirectionalLight('#fff9ee', 3); light.position.set(220, -350, 700); scene.add(light);
  const fill = new THREE.DirectionalLight('#dceaff', 1); fill.position.set(-250, 150, 350); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({color: '#e5ebe3', roughness: 1})); floor.position.z = -.3; scene.add(floor);
  const grid = new THREE.GridHelper(12000, 300, '#aebba8', '#c3cec0'); grid.rotation.x = Math.PI / 2; grid.position.z = .05; grid.material.transparent = true; grid.material.opacity = .28; scene.add(grid);
  const pushArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 150, '#e87924', 35, 20);
  for (const part of [pushArrow.line, pushArrow.cone]) {
    part.material.depthTest = false; part.material.depthWrite = false; part.renderOrder = 10;
  }
  pushArrow.visible = false; scene.add(pushArrow);
  const groups = {}, meshes = [], gears = [];
  const compiledModels = new Map();
  let activeCompiled = null, selection = 0;
  for (const part of parts) {
    const parent = groups[part.body] ??= new THREE.Group();
    if (!parent.parent) scene.add(parent);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices.flat(), 3));
    geometry.setIndex(part.triangles.flat()); geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({color: new THREE.Color(...part.color), roughness: part.material === 'tire' ? .93 : .48, metalness: ['motor', 'metal'].includes(part.material) ? .3 : 0});
    if (part.material === 'light') { material.emissive.set('#36b7c6'); material.emissiveIntensity = .5; }
    const mesh = new THREE.Mesh(geometry, material); mesh.userData.part = part; meshes.push(mesh);
    if (part.motion) {
      const pivot = new THREE.Group(); pivot.position.set(...part.motion.origin); parent.add(pivot);
      geometry.translate(...part.motion.origin.map(v => -v)); pivot.add(mesh); gears.push({pivot, ...part.motion});
    } else parent.add(mesh);
  }
  const springMeshes = [0, 1].map(() => {
    const points = Array.from({length: 161}, (_, i) => new THREE.Vector3(50 * i / 160, 4.8 * Math.cos(i / 160 * Math.PI * 16), 4.8 * Math.sin(i / 160 * Math.PI * 16)));
    // Start from the spring's 50 mm free length and compress it between the recorded seats.
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 160, 1.1, 8, false), new THREE.MeshStandardMaterial({color: '#c9a247', metalness: .4, roughness: .4}));
    scene.add(mesh); return mesh;
  });
  let record = null, selected = null, time = 0, playing = false, last = performance.now(), target = new THREE.Vector3(20, 0, 155);
  const parameters = manifest.parameters;
  const ride = leg(parameters.geometry, parameters.geometry.q_low_rad).E[1] - leg(parameters.geometry, parameters.nominal_q_rad).E[1];
  const staticFrame = pose(parameters, [ride, ride]);
  function apply(frame) {
    const activeGroups = activeCompiled?.groups ?? groups;
    for (const [name, transform] of Object.entries(frame.bodies)) {
      const group = activeGroups[name]; if (!group) continue;
      group.position.set(...transform.pos.map(v => v * 1000));
      group.quaternion.set(transform.quat[1], transform.quat[2], transform.quat[3], transform.quat[0]);
    }
    for (const gear of activeCompiled ? [] : gears) {
      if (gear.kind === 'wheel') {
        const relative = groups[gear.side + '_lower'].quaternion.clone().invert().multiply(groups[gear.side + '_wheel'].quaternion);
        gear.pivot.rotation.y = 2 * Math.atan2(relative.y, relative.w) * gear.ratio;
      } else {
        const q = frame.angles?.[gear.side === 'left' ? 0 : 1] ?? frame.qpos[gear.side === 'left' ? 7 : 11];
        gear.pivot.rotation.y = (q - parameters.nominal_q_rad) * gear.ratio;
      }
    }
    if (!activeCompiled) frame.spring_seats.forEach(([start, end], i) => {
      const a = new THREE.Vector3(...start.map(v => v * 1000));
      const delta = new THREE.Vector3(...end.map(v => v * 1000)).sub(a);
      springMeshes[i].position.copy(a); springMeshes[i].quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), delta.clone().normalize()); springMeshes[i].scale.x = delta.length() / 50;
    });
    if (record) {
      const push = record.report?.perturbation;
      pushArrow.visible = Boolean(push && frame.t >= push.time_s && frame.t < push.time_s + .4);
      if (pushArrow.visible) {
        const direction = new THREE.Vector3(...push.delta_velocity_m_s).normalize();
        pushArrow.setDirection(direction);
        pushArrow.position.set(...frame.com_m.map(v => v * 1000)).addScaledVector(direction, -220);
      }
      const nextTarget = new THREE.Vector3(...frame.bodies.chassis.pos.map(v => v * 1000));
      nextTarget.z = Math.max(100, nextTarget.z - 30);
      const shift = nextTarget.clone().sub(target); camera.position.add(shift); controls.target.add(shift); target.copy(nextTarget);
      floor.position.x = nextTarget.x; floor.position.y = nextTarget.y;
      grid.position.x = Math.floor(nextTarget.x / 40) * 40; grid.position.y = Math.floor(nextTarget.y / 40) * 40;
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
        const bodyVelocity = new THREE.Vector3(...frame.qvel.slice(0, 3)).applyQuaternion(activeGroups.chassis.quaternion.clone().invert());
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
    apply(frames[lo]); $('timeline').value = time; $('time-output').textContent = `${time.toFixed(2)} s`;
  }
  function play(value) { playing = value; $('play').textContent = value ? 'Pause' : 'Play'; }
  function view(name = 'iso') {
    const direction = {iso: [1, -1.45, .8], side: [0, -1, .05], front: [1, 0, .1]}[name];
    controls.target.copy(target); camera.position.copy(target).addScaledVector(new THREE.Vector3(...direction).normalize(), Math.max(790, 630 / camera.aspect)); controls.update();
  }
  async function selectRecording(id) {
    const ticket = ++selection;
    const entry = recordings.find(p => p.id === id); if (!entry) throw Error('Unknown recording');
    const programmed = entry.type === 'programmed';
    play(false); $('replay-controls').hidden = true;
    $('load-status').hidden = false; $('load-status').textContent = `Loading ${programmed ? 'programmed demonstration' : 'validated learned recording'}…`;
    const next = await json(entry.directory + entry.replay, entry.replay_sha256);
    validateRecording(entry, next);
    let compiled = null;
    if (entry.geometry) {
      if (!entry.geometry_sha256) throw Error('Missing display geometry checksum');
      const geometryKey = entry.directory + entry.geometry + ':' + entry.geometry_sha256;
      compiled = compiledModels.get(geometryKey);
      if (!compiled) {
        const geometry = await json(entry.directory + entry.geometry, entry.geometry_sha256);
        if (programmed ? !Array.isArray(geometry)
          : geometry.kind !== 'mujoco-hulls-v1' || geometry.model_sha256 !== next.report.model_sha256 || geometry.variant !== next.report.variant) {
          throw Error('Display geometry does not match this recording');
        }
        compiled = {...compiledRobot(programmed ? geometry : geometry.parts, 1000), mass: programmed ? entry.mass_kg : geometry.mass_kg};
        compiled.root.visible = false; scene.add(compiled.root); compiledModels.set(geometryKey, compiled);
      }
      if (next.frames.some(frame => Object.keys(compiled.groups).some(name => !frame.bodies[name]))) throw Error('Recording lacks display body transforms');
    } else if (entry.model_sha256 !== catalog.cad_model_sha256) {
      throw Error('No matching CAD assembly for this recording');
    }
    if (ticket !== selection) return;
    if (activeCompiled) activeCompiled.root.visible = false;
    activeCompiled = compiled;
    if (activeCompiled) activeCompiled.root.visible = true;
    Object.values(groups).forEach(group => { group.visible = !activeCompiled; });
    springMeshes.forEach(mesh => { mesh.visible = !activeCompiled; });
    document.querySelectorAll('[data-display]').forEach(button => { button.disabled = Boolean(activeCompiled); });
    $('assembly-note').textContent = activeCompiled
      ? `${activeCompiled.mass.toFixed(2)} kg wider four-motor candidate. Display uses its simulated contact hulls; internal parts and self-contact are not shown.`
      : 'The same 2.39 kg CAD assembly, four motors and two thigh springs used in the original training model.';
    $('inspection-hint').textContent = activeCompiled ? 'Exterior geometry' : 'Cutaway reveals the mechanism';
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
    const url = new URL(location.href); url.searchParams.delete('policy'); url.searchParams.delete('demo');
    url.searchParams.set(programmed ? 'demo' : 'policy', entry.id); history.replaceState(null, '', url);
    show(record.frames[0].t); view(); $('load-status').hidden = true;
  }
  function fail(error) { play(false); $('replay-controls').hidden = true; $('load-status').hidden = false; $('load-status').textContent = error.message; }
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
  document.querySelectorAll('[data-display]').forEach(button => button.onclick = () => {
    const cutaway = button.dataset.display === 'ghost';
    document.querySelectorAll('[data-display]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    for (const mesh of meshes) {
      const p = mesh.userData.part, ghost = cutaway && (p.skin || p.material === 'tire' || p.name.endsWith('_rim'));
      mesh.visible = !(cutaway && ['glass', 'light'].includes(p.material));
      mesh.material.transparent = ghost; mesh.material.opacity = ghost ? .09 : 1; mesh.material.depthWrite = !ghost;
      mesh.material.needsUpdate = true;
    }
  });
  const resize = () => { const rect = viewport.getBoundingClientRect(); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); renderer.setSize(rect.width, rect.height, false); };
  new ResizeObserver(resize).observe(viewport); resize(); apply(staticFrame); view(); $('load-status').hidden = true;
  if (recordings.length) {
    $('policy-picker').hidden = false;
    for (const [label, entries] of [['Learned · validated in simulation', policies], ['Programmed · demonstrations', demos]]) {
      const group = document.createElement('optgroup'); group.label = label;
      for (const entry of entries) {
        const option = document.createElement('option'); option.value = entry.id;
        option.textContent = `${entry.type === 'programmed' ? 'Programmed' : 'Learned'} — ${entry.label}`; group.append(option);
      }
      $('policy-select').append(group);
    }
    const choose = id => selectRecording(id).catch(error => { if ($('policy-select').value === id) fail(error); });
    $('policy-select').onchange = () => choose($('policy-select').value);
    document.querySelectorAll('[data-recording]').forEach(button => button.onclick = () => {
      $('policy-select').value = button.dataset.recording; choose(button.dataset.recording);
    });
    const query = new URLSearchParams(location.search);
    const requested = query.get('demo') ?? query.get('policy');
    const initial = recordings.find(p => p.id === requested)?.id ?? policies[0]?.id ?? demos[0].id;
    $('policy-select').value = initial; await selectRecording(initial);
  }
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - last) / 1000, .1); last = now;
    if (playing && selected) { show(time + dt * Number($('speed').value)); if (time >= record.frames.at(-1).t) play(false); }
    controls.update(); renderer.render(scene, camera);
  });
} catch (error) {
  $('load-status').hidden = false; $('load-status').textContent = error.message;
  $('policy-status').textContent = 'The skills viewer could not load. Please retry.';
  console.error(error);
}

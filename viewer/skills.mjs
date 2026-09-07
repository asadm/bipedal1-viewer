import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {pose, leg} from '../concept06/internal-kinematics.mjs';

const $ = id => document.getElementById(id);
const json = async url => {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Cannot load ${url} (${response.status})`);
  return response.json();
};

try {
  const [catalog, parts, manifest] = await Promise.all([
    json('../learned/catalog.json'), json('../concept06/output/internal-full/parts.json'),
    json('../concept06/output/internal-full/manifest.json'),
  ]);
  if (catalog.schema_version !== 1) throw Error('Unsupported policy catalog version');
  const policies = catalog.policies;
  $('policy-count').textContent = `${policies.length} validated ${policies.length === 1 ? 'policy' : 'policies'}`;
  $('policy-status').textContent = catalog.status;
  for (const task of catalog.tasks) {
    const item = document.createElement('article');
    const heading = document.createElement('div'); heading.className = 'task-heading';
    const title = document.createElement('strong'); title.textContent = task.label;
    const stage = document.createElement('span'); stage.className = `task-stage ${task.stage === 'Validated' ? 'validated' : ''}`; stage.textContent = task.stage;
    const detail = document.createElement('p'); detail.textContent = task.detail;
    heading.append(title, stage); item.append(heading, detail); $('task-list').append(item);
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
    for (const [name, transform] of Object.entries(frame.bodies)) {
      const group = groups[name]; if (!group) continue;
      group.position.set(...transform.pos.map(v => v * 1000));
      group.quaternion.set(transform.quat[1], transform.quat[2], transform.quat[3], transform.quat[0]);
    }
    for (const gear of gears) {
      if (gear.kind === 'wheel') {
        const relative = groups[gear.side + '_lower'].quaternion.clone().invert().multiply(groups[gear.side + '_wheel'].quaternion);
        gear.pivot.rotation.y = 2 * Math.atan2(relative.y, relative.w) * gear.ratio;
      } else {
        const q = frame.angles?.[gear.side === 'left' ? 0 : 1] ?? frame.qpos[gear.side === 'left' ? 7 : 11];
        gear.pivot.rotation.y = (q - parameters.nominal_q_rad) * gear.ratio;
      }
    }
    frame.spring_seats.forEach(([start, end], i) => {
      const a = new THREE.Vector3(...start.map(v => v * 1000));
      const delta = new THREE.Vector3(...end.map(v => v * 1000)).sub(a);
      springMeshes[i].position.copy(a); springMeshes[i].quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), delta.clone().normalize()); springMeshes[i].scale.x = delta.length() / 50;
    });
    if (record) {
      const push = record.report.perturbation;
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
      $('phase').textContent = selected?.skill === 'drive'
        ? Math.abs(frame.command[1]) > 1e-6 ? 'Turn in place'
          : frame.command[0] > 1e-6 ? 'Forward'
            : frame.command[0] < -1e-6 ? 'Reverse' : 'Stop'
        : frame.phase;
      $('height').textContent = `${(frame.qpos[2] * 1000).toFixed(0)} / ${(frame.command[2] * 1000).toFixed(0)} mm`;
      const bodyVelocity = new THREE.Vector3(...frame.qvel.slice(0, 3)).applyQuaternion(groups.chassis.quaternion.clone().invert());
      $('velocity').textContent = `${bodyVelocity.x.toFixed(2)} / ${frame.command[0].toFixed(2)} m/s`;
      $('contact').textContent = frame.body_contact ? 'Body contact' : frame.grounded.every(v => !v) ? 'Both wheels airborne' : 'Wheel contact';
      $('clearance').textContent = `${Math.max(0, Math.min(...frame.wheel_clearance_m) * 1000).toFixed(1)} mm`;
      const [, x, y] = frame.bodies.chassis.quat;
      $('tilt').textContent = `${(Math.acos(Math.max(-1, Math.min(1, 1 - 2 * (x * x + y * y)))) * 180 / Math.PI).toFixed(1)}°`;
      $('current').textContent = frame.current_A.map(v => Math.abs(v).toFixed(1)).join(' / ') + ' A';
      $('compression').textContent = frame.compression_m.map(v => (v * 1000).toFixed(1)).join(' / ') + ' mm';
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
  async function selectPolicy(id) {
    const entry = policies.find(p => p.id === id); if (!entry) throw Error('Unknown policy');
    play(false); $('load-status').hidden = false; $('load-status').textContent = 'Loading validated recording…';
    const next = await json('../learned/' + entry.replay);
    if (!next.report.simulation_skill_pass || next.report.policy_sha256 !== entry.policy_sha256 || !next.frames.length) throw Error('Recording does not match the evaluated policy');
    record = next; selected = entry; $('replay-controls').hidden = false;
    $('replay-title').textContent = entry.label; $('replay-detail').textContent = `${entry.passed}/${entry.cases} campaign cases passed · recorded seed ${next.report.seed} · ${next.report.variant}`;
    $('timeline').min = record.frames[0].t; $('timeline').max = record.frames.at(-1).t;
    $('report-link').href = '../learned/' + entry.evaluation; $('record-link').href = '../learned/' + entry.replay;
    $('policy-link').hidden = !entry.policy; $('checkpoint-link').hidden = !entry.checkpoint;
    if (entry.policy) $('policy-link').href = '../learned/' + entry.policy;
    if (entry.checkpoint) $('checkpoint-link').href = '../learned/' + entry.checkpoint;
    $('caption').textContent = `Learned PPO policy ${entry.policy_sha256.slice(0, 8)} · recorded CPU MuJoCo · hardware unqualified`;
    show(record.frames[0].t); view(); $('load-status').hidden = true;
  }
  function fail(error) { play(false); $('load-status').hidden = false; $('load-status').textContent = error.message; }
  $('play').onclick = () => { if (time >= record.frames.at(-1).t) show(record.frames[0].t); play(!playing); };
  $('restart').onclick = () => { show(record.frames[0].t); play(true); };
  $('timeline').oninput = () => { play(false); show(Number($('timeline').value)); };
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
  if (policies.length) {
    $('policy-picker').hidden = false;
    for (const entry of policies) { const option = document.createElement('option'); option.value = entry.id; option.textContent = entry.label; $('policy-select').append(option); }
    $('policy-select').onchange = () => selectPolicy($('policy-select').value).catch(fail);
    const requested = new URLSearchParams(location.search).get('policy');
    const initial = policies.find(p => p.id === requested)?.id ?? policies[0].id;
    $('policy-select').value = initial; await selectPolicy(initial);
  }
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - last) / 1000, .1); last = now;
    if (playing && selected) { show(time + dt * Number($('speed').value)); if (time >= record.frames.at(-1).t) play(false); }
    controls.update(); renderer.render(scene, camera);
  });
} catch (error) {
  $('load-status').hidden = false; $('load-status').textContent = error.message;
  $('policy-status').textContent = 'The learned-skills view could not load. Please retry.';
  console.error(error);
}

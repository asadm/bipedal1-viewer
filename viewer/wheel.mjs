import {sha256} from './sha256.mjs';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {cadRobot} from './cad-robot.mjs';
import {inspectionPose, inspectionRange} from './cad-pose.mjs';
import {compiledRobot} from './compiled-robot.mjs';
import {interpolateBodies} from './replay-pose.mjs';

const $ = id => document.getElementById(id);
const json = async (url, hash) => {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Cannot load ${url} (${response.status})`);
  const bytes = await response.arrayBuffer();
  if (hash) {
    const digest = await sha256(bytes);
    if (digest !== hash) throw Error(`Asset checksum mismatch: ${url}`);
  }
  return JSON.parse(new TextDecoder().decode(bytes));
};

try {
  const base = '../wheel-study/revised/';
  const [revision, fitReport, replayCatalog] = await Promise.all([
    json(base + 'manifest.json'), json(base + 'fit-report.json'), json(base + 'replays.json'),
  ]);
  const mesh = await json(base + 'wheel.json', revision.asset_sha256['wheel.json']);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.vertices.flat(), 3));
  geometry.setIndex(mesh.triangles.flat()); geometry.computeVertexNormals();
  const variants = new Map([[120, {...revision, geometry, estimated_mass_g: revision.estimated_tpu_mass_g, stl: 'revised/wheel.stl', step: 'revised/wheel.step'}]]);
  $('fit-note').textContent = fitReport.passed
    ? `Revised fit passed ${fitReport.wheel_pose_checks} sampled wheel poses; minimum clearance ${fitReport.minimum_wheel_clearance_mm.toFixed(1)} mm. Wider stance clears the folded thighs.`
    : 'Fit audit failed. This wheel is not ready to install.';
  for (const entry of replayCatalog.entries) {
    const option = document.createElement('option'); option.value = entry.id;
    option.textContent = `${entry.label}${entry.nominal_pair_passed ? '' : ' — needs retuning'}`;
    $('motion').append(option);
  }
  THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
  const canvas = $('model-canvas'), viewport = canvas.parentElement;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#edf1ef');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  const camera = new THREE.PerspectiveCamera(36, 1, .5, 10000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.minDistance = 70; controls.maxDistance = 1800;
  scene.add(new THREE.HemisphereLight('#ffffff', '#738579', 2));
  const light = new THREE.DirectionalLight('#fff8ed', 3.6);
  light.position.set(170, -350, 500); light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048); light.shadow.normalBias = .12; light.shadow.bias = -.0001;
  Object.assign(light.shadow.camera, {left: -350, right: 350, top: 350, bottom: -350, near: 1, far: 1600});
  scene.add(light, light.target);
  const fill = new THREE.DirectionalLight('#dce9ff', 1.5); fill.position.set(-240, 180, 300); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({color: '#e7ece8', roughness: 1}));
  floor.position.z = -.3; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(4000, 200, '#b8c6bc', '#ccd6cf');
  grid.rotation.x = Math.PI / 2; grid.material.transparent = true; grid.material.opacity = .3; scene.add(grid);
  const material = new THREE.MeshStandardMaterial({color: '#303938', roughness: .84, metalness: 0});
  const wheelRoot = new THREE.Group(); scene.add(wheelRoot);
  const wheelMesh = new THREE.Mesh(undefined, material); wheelMesh.castShadow = wheelMesh.receiveShadow = true; wheelRoot.add(wheelMesh);
  const plate = new THREE.Group(); scene.add(plate);
  const plateSurface = new THREE.Mesh(new THREE.BoxGeometry(180, 180, 2), new THREE.MeshStandardMaterial({color: '#849486', roughness: .8}));
  plateSurface.position.z = 1; plateSurface.receiveShadow = true; plateSurface.castShadow = true; plate.add(plateSurface);
  const plateEdges = new THREE.LineSegments(new THREE.EdgesGeometry(plateSurface.geometry), new THREE.LineBasicMaterial({color: '#536d58'}));
  plateEdges.position.z = 1; plate.add(plateEdges);

  let cad, manifest, physics, robotLoading, originalWheels = [], replacementWheels = [];
  let record = null, entry = null, time = 0, playing = true, last = performance.now(), displayMode = 'enclosed';
  const replayCache = new Map();
  const params = new URLSearchParams(location.search);
  let diameter = variants.has(Number(params.get('diameter'))) ? Number(params.get('diameter')) : 120;
  let mode = ['wheel', 'robot', 'plate'].includes(params.get('scene')) ? params.get('scene') : 'robot';
  let cameraMode = 'iso';
  const target = new THREE.Vector3();

  async function loadRobot() {
    if (cad) return;
    if (!robotLoading) robotLoading = (async () => {
      manifest = await json('../current-cad/manifest.json');
      if (manifest.parts_sha256 !== replayCatalog.cad_parts_sha256) throw Error('CAD has changed since wheel verification. Recheck this wheel before replaying.');
      const [parts, replacements, hulls] = await Promise.all([
        json('../current-cad/' + manifest.parts, manifest.parts_sha256),
        json(base + 'replacements.json', revision.asset_sha256['replacements.json']), json(base + 'geometry.json', replayCatalog.geometry_sha256),
      ]);
      cad = cadRobot([...parts, ...replacements.map(p => ({...p, name: p.name + '_prototype'}))], manifest.parameters);
      cad.root.visible = false;
      cad.root.traverse(object => {
        if (revision.remove_parts.includes(object.name)) originalWheels.push(object);
        if (object.name.endsWith('_prototype')) replacementWheels.push(object);
      });
      physics = compiledRobot(hulls, 1000); physics.root.visible = false;
      scene.add(cad.root, physics.root);
      const range = inspectionRange(manifest);
      $('leg-height').max = range.stroke; $('leg-height').value = range.ride;

    })();
    return robotLoading;
  }

  function fit() {
    const object = mode === 'robot' ? cad.root : mode === 'plate' ? plate : wheelRoot;
    const bounds = new THREE.Box3().setFromObject(object);
    if (mode === 'plate') bounds.union(new THREE.Box3().setFromObject(wheelRoot));
    bounds.getCenter(target);
    const radius = bounds.getSize(new THREE.Vector3()).length() / 2;
    const halfFov = Math.min(THREE.MathUtils.degToRad(camera.fov / 2), Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    const distance = radius / Math.sin(halfFov) * 1.08;
    let direction;
    if (mode === 'plate') direction = {iso: [1, -1.3, 1.7], face: [0, -.001, 1], edge: [0, -1, .001]}[cameraMode];
    else if (mode === 'robot') direction = {iso: [1.1, -1.8, .85], face: [1, 0, .001], edge: [0, -1, .001]}[cameraMode];
    else direction = {iso: [.55, -1, .32], face: [0, -1, .001], edge: [1, 0, .001]}[cameraMode];
    camera.position.copy(target).addScaledVector(new THREE.Vector3(...direction).normalize(), distance);
    controls.target.copy(target); controls.update();
  }

  function update(fitCamera = true) {
    const variant = variants.get(diameter), comparison = mode === 'robot' && !record && displayMode !== 'physics' && $('compare').checked;
    wheelRoot.visible = mode !== 'robot'; plate.visible = mode === 'plate';
    grid.visible = mode !== 'plate';
    wheelMesh.geometry = variant.geometry;
    wheelMesh.position.set(0, 0, 0); wheelMesh.rotation.set(0, 0, 0);
    if (mode === 'plate') wheelRoot.position.set(0, 0, 2.1);
    else {
      wheelRoot.position.set(0, 0, diameter / 2);
      wheelMesh.rotation.x = Math.PI / 2;
      wheelMesh.position.y = variant.width_mm / 2;
    }
    if (cad) {
      let frame;
      if (record) frame = replayFrame();
      else {
        const h = Number($('leg-height').value);
        frame = inspectionPose(manifest, [h, h]);
        const rise = comparison ? 0 : .01;
        for (const body of Object.values(frame.bodies)) body.pos[2] += rise;
        $('leg-output').textContent = h.toFixed(1) + ' mm';
      }
      applyRobot(frame);
      cad.display(displayMode);
      cad.root.visible = mode === 'robot' && displayMode !== 'physics';
      physics.root.visible = mode === 'robot' && displayMode === 'physics' && !comparison;
      originalWheels.forEach(mesh => { mesh.visible = comparison; });
      replacementWheels.forEach(mesh => { mesh.visible = !comparison; });
    }
    $('robot-controls').hidden = mode !== 'robot';
    $('playback').hidden = !record; $('manual').hidden = Boolean(record);
    $('compare-control').hidden = mode !== 'robot' || Boolean(record) || displayMode === 'physics';
    $('dimensions').textContent = `${diameter} × ${variant.width_mm} mm`;
    $('clearance').textContent = `+${diameter / 2 - 50} mm`;
    $('mass').textContent = `≈ ${variant.estimated_mass_g.toFixed(1)} g`;
    $('stl').href = '../wheel-study/' + variant.stl; $('step').href = '../wheel-study/' + variant.step;
    $('object-size').innerHTML = comparison ? '100 × 30 <small>mm</small>' : `${diameter} × ${variant.width_mm} <small>mm</small>`;
    $('object-kicker').textContent = comparison ? 'CURRENT WHEELS' : 'ONE-PIECE WHEEL';
    $('caption').textContent = {wheel: 'One connected TPU part', robot: comparison ? 'Current wheel proportions' : record ? 'Programmed ' + entry.label.toLowerCase() : 'Larger wheels · same leg pose', plate: '180 × 180 mm A1 Mini plate'}[mode];
    $('scene-note').textContent = {wheel: 'Actual CAD geometry · appearance preview', robot: record ? 'Native MuJoCo recording · rigid tire model' : 'Static inspection · revised fit passed', plate: 'One whole wheel per plate · printed flat'}[mode];
    document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === mode)));
    document.querySelectorAll('[data-camera]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.camera === cameraMode)));
    const url = new URL(location.href);
    url.searchParams.set('diameter', diameter); url.searchParams.set('scene', mode); url.searchParams.set('motion', entry?.id ?? 'manual');
    history.replaceState(null, '', url);
    if (fitCamera) fit();
  }

  function replayFrame() {
    const frames = record.frames;
    let low = 0, high = frames.length - 1;
    while (low < high) { const mid = Math.ceil((low + high) / 2); if (frames[mid].t <= time) low = mid; else high = mid - 1; }
    const a = frames[low], b = frames[Math.min(low + 1, frames.length - 1)];
    const f = b.t > a.t ? Math.max(0, Math.min(1, (time - a.t) / (b.t - a.t))) : 0;
    return {...a, bodies: interpolateBodies(a.bodies, b.bodies, f)};
  }

  function applyRobot(frame) {
    cad.apply(frame);
    for (const [name, tr] of Object.entries(frame.bodies)) {
      const group = physics.groups[name]; if (!group) continue;
      group.position.set(...tr.pos.map(v => v * 1000)); group.quaternion.set(tr.quat[1], tr.quat[2], tr.quat[3], tr.quat[0]);
    }
  }

  async function selectMotion(id) {
    entry = replayCatalog.entries.find(e => e.id === id) ?? null;
    if (entry) {
      if (!replayCache.has(id)) replayCache.set(id, await json(base + entry.file, entry.sha256));
      record = replayCache.get(id); time = 0; playing = true;
      if (record.model_sha256 !== replayCatalog.model_sha256 || record.plant_fingerprint !== entry.plant_fingerprint) throw Error('Recording does not match the displayed wheel plant.');
      $('timeline').max = record.frames.at(-1).t;
      $('motion-note').textContent = entry.nominal_pair_passed
        ? `Programmed · passed at both physics timesteps.${id === 'jump' ? ` Jump checks: ${replayCatalog.jump_passed}/${replayCatalog.jump_cases} including hardware variants.` : ''}`
        : 'Programmed attempt · transfer checks failed or are incomplete. Shown for diagnosis.';
      $('jump-metric').hidden = id !== 'jump'; $('peak').hidden = id !== 'jump';
      $('jump-height').textContent = (record.result.max_both_wheel_clearance_mm ?? 0).toFixed(1) + ' mm';
    } else {
      record = null; $('motion-note').textContent = 'Prescribed leg pose; not a motion simulation.'; $('jump-metric').hidden = true;
    }
    $('motion').value = entry?.id ?? 'manual'; $('compare').checked = false; $('play').textContent = 'Pause';
    update();
  }

  document.querySelectorAll('[data-scene]').forEach(button => button.onclick = async () => {
    mode = button.dataset.scene;
    if (mode === 'robot' && !cad) await loadRobot();
    cameraMode = 'iso'; update();
  });
  document.querySelectorAll('[data-display]').forEach(button => button.onclick = () => {
    displayMode = button.dataset.display;
    document.querySelectorAll('[data-display]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.display === displayMode)));
    update(false);
  });
  document.querySelectorAll('[data-camera]').forEach(button => button.onclick = () => { cameraMode = button.dataset.camera; update(); });
  $('fit').onclick = fit; $('compare').onchange = () => update(false);
  $('leg-height').oninput = () => update(false);
  $('motion').onchange = async () => { try { await selectMotion($('motion').value); } catch (error) { showError(error); } };
  $('play').onclick = () => { playing = !playing; $('play').textContent = playing ? 'Pause' : 'Play'; };
  $('restart').onclick = () => { time = 0; playing = true; $('play').textContent = 'Pause'; update(false); };
  $('peak').onclick = () => {
    if (!record) return;
    time = record.frames.reduce((a, b) => Math.min(...b.wheel_clearance_mm) > Math.min(...a.wheel_clearance_mm) ? b : a).t;
    playing = false; $('play').textContent = 'Play'; update(false);
  };
  $('timeline').oninput = () => { time = Number($('timeline').value); playing = false; $('play').textContent = 'Play'; update(false); };
  const resize = () => {
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
    camera.aspect = viewport.clientWidth / viewport.clientHeight; camera.updateProjectionMatrix();
    if (mode !== 'robot' || cad) fit();
  };
  await loadRobot();
  update(false); resize();
  await selectMotion(params.get('motion') ?? 'jump');
  new ResizeObserver(resize).observe(viewport);
  $('load-status').hidden = true;
  renderer.setAnimationLoop(now => {
    const elapsed = Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
    if (record && mode === 'robot') {
      if (playing) time = (time + elapsed * Number($('speed').value)) % record.frames.at(-1).t;
      applyRobot(replayFrame()); $('timeline').value = time; $('time').textContent = time.toFixed(2) + ' s';
      // Follow horizontal travel without hiding the vertical jump.
      const tr = replayFrame().bodies.chassis.pos;
      const shift = new THREE.Vector3(tr[0] * 1000 - controls.target.x, tr[1] * 1000 - controls.target.y, 0);
      controls.target.add(shift); camera.position.add(shift);
    }
    controls.update(); renderer.render(scene, camera);
  });
} catch (error) { showError(error); }

function showError(error) {
  console.error(error);
  $('load-status').textContent = `Could not load preview. ${error.message}`;
  $('load-status').classList.add('error'); $('load-status').hidden = false;
}

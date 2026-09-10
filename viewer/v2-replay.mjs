import {sha256 as hash} from './sha256.mjs';
import * as THREE from 'three';
import {terrainView} from './terrain-view.mjs';

const $ = id => document.getElementById(id);
const rotation = q => new THREE.Quaternion(q[1], q[2], q[3], q[0]);

// The CAD and collision views receive the same recorded rigid-body transforms.
// Interpolation is for display only; reports retain the measured simulation result.
export async function nativeReplay(scene, onChange, camera, controls, {detailed = false} = {}) {
  const response = await fetch('../clanky-v2/native/viewer-replay.json');
  if (!response.ok) throw Error('V2 recording is not available yet. Manual inspection is ready.');
  const data = await response.json();
  const checks = Object.entries(data.source_sha256).filter(([name]) =>
    ['assembly.json', 'assembly-parts.json', 'coaxial-spring/manifest.json', 'coaxial-spring/parts.json',
      'hip-gear-layout/layout-screen.json', 'hip-gear-layout/viewer-parts.json',
      'hip-output/manifest.json', 'hip-output/parts.json', 'viewer/v2.mjs', 'native/model.xml'].includes(name));
  await Promise.all(checks.map(async ([name, expected]) => {
    const url = name.startsWith('viewer/') ? '../' + name : '../clanky-v2/' + name;
    const r = await fetch(url);
    if (!r.ok || await hash(await r.arrayBuffer()) !== expected) throw Error('V2 recording needs rebuilding for the current design. Manual inspection is ready.');
  }));
  const terrainResponse = await fetch('../clanky-v2/native/terrain/viewer-replay.json');
  if (terrainResponse.ok) {
    const extra = await terrainResponse.json();
    for (const [name, expected] of Object.entries(extra.cad_source_sha256)) {
      if (data.source_sha256[name] !== expected) throw Error('Terrain recording uses a different V2 design.');
    }
    data.motions.push(...extra.motions);
  }
  const recoveryResponse = await fetch('../clanky-v2/native/recovery/viewer-replay.json');
  if (recoveryResponse.ok) {
    const extra = await recoveryResponse.json();
    for (const [name, expected] of Object.entries(extra.cad_source_sha256)) {
      if (data.source_sha256[name] !== expected) throw Error('Recovery recording uses a different V2 design.');
    }
    data.motions.push(...extra.motions);
  }
  for (const file of ['viewer-replay.json', 'recovery-viewer-replay.json', 'front-recovery-viewer-replay.json', 'inverted-recovery-viewer-replay.json', 'side-recovery-viewer-replay.json', 'command-driving-viewer-replay.json', 'terrain-driving-viewer-replay.json']) {
    const learnedResponse = await fetch('../clanky-v2/training/' + file);
    if (!learnedResponse.ok) continue;
    const extra = await learnedResponse.json();
    for (const [name, expected] of Object.entries(extra.cad_source_sha256)) {
      if (data.source_sha256[name] !== expected) throw Error('Learned recording uses a different V2 design.');
    }
    data.motions.push(...extra.motions);
  }
  const geometrySets = {recorded:data.geometries};
  for (const motion of data.motions) motion.cad_revision = 'recorded';
  if (detailed) {
    const response = await fetch('../clanky-v2/detail-native/viewer-replay.json');
    if (!response.ok) throw Error('Latest CAD recording is unavailable. Manual inspection is ready.');
    const detailedBytes = await response.arrayBuffer();
    const extra = JSON.parse(new TextDecoder().decode(detailedBytes));
    if (extra.cad_revision !== 'detail') throw Error('Unexpected latest CAD recording revision.');
    const required = ['detail/manifest.json', 'detail/parts.json', 'detail-native/baseline-trials.json',
      'detail-native/baseline-jump-125us/model.xml', 'detail-native/baseline-jump-125us/report.json',
      'detail-native/baseline-balance-125us/report.json'];
    await Promise.all(required.map(async name => {
      const r = await fetch('../clanky-v2/' + name);
      if (!extra.source_sha256[name] || !r.ok || await hash(await r.arrayBuffer()) !== extra.source_sha256[name])
        throw Error('Latest CAD recording needs rebuilding: ' + name);
    }));
    for (const motion of data.motions) {
      if (motion.id === 'jump' || motion.id === 'balance') {
        motion.report_url = `../clanky-v2/native/viewer-${motion.id}/report.json`;
        if (motion.id === 'jump') {
          const r = motion.report;
          motion.description = `${r.first_flight_both_wheel_clearance_mm.toFixed(0)} mm wheel clearance · ${r.COM_rise_from_detected_takeoff_mm.toFixed(0)} mm COM rise · preceding CAD and armature drivetrain.`;
        }
        motion.id += '-recorded';
        motion.label = motion.label.replace('V2 experiment', 'preceding CAD');
      }
    }
    if (!extra.motions.every(m=>m.cad_revision==='detail')) throw Error('Mixed CAD revisions in latest recording.');
    const experiments = [
      ['flip-viewer-replay.json', 'flip/baseline-tuck-0.5-wheel-1-125us/report.json', 'flip/independent-audit.json'],
      ['sideflip-viewer-replay.json', 'sideflip/selected-125us/report.json', 'sideflip/paired-check.json'],
    ];
    for (const [index, [file, report, evidence]] of experiments.entries()) {
      const flipResponse = await fetch('../clanky-v2/detail-native/' + file);
      if (!flipResponse.ok) continue;
      const flip = await flipResponse.json();
      if (flip.cad_revision !== 'detail' ||
          flip.model_sha256 !== extra.source_sha256['detail-native/baseline-jump-125us/model.xml'] ||
          flip.source_sha256['detail-native/viewer-replay.json'] !== await hash(detailedBytes))
        throw Error('Experimental recording uses a different CAD or reference recording.');
      const required = ['detail/manifest.json', 'detail/parts.json', 'detail-native/' + report, 'detail-native/' + evidence];
      await Promise.all(required.map(async name => {
        const r = await fetch('../clanky-v2/' + name);
        if (!flip.source_sha256[name] || !r.ok || await hash(await r.arrayBuffer()) !== flip.source_sha256[name])
          throw Error('Experimental recording needs rebuilding: ' + name);
      }));
      if (!flip.motions.every(m=>m.cad_revision==='detail' && m.stop_at_end &&
          (m.report.flip_skill_pass === false || m.report.sideflip_skill_pass === false)))
        throw Error('Unexpected experimental flip metadata.');
      extra.motions.splice(1 + index, 0, ...flip.motions);
    }
    const terrainResponse = await fetch('../clanky-v2/detail-native/terrain-viewer-replay.json');
    if (terrainResponse.ok) {
      const terrain = await terrainResponse.json();
      if (terrain.cad_revision !== 'detail' ||
          terrain.robot_reference_model_sha256 !== extra.source_sha256['detail-native/baseline-jump-125us/model.xml'] ||
          terrain.source_sha256['detail-native/viewer-replay.json'] !== await hash(detailedBytes))
        throw Error('Terrain recording uses a different CAD or reference recording.');
      const required = new Set(['detail/manifest.json', 'detail/parts.json']);
      for (const motion of terrain.motions) {
        if (motion.cad_revision !== 'detail' || !motion.report.passed || !motion.terrain?.length ||
            !motion.report.navigation_localization || !motion.validation_files?.length)
          throw Error('Terrain recording is missing its physical result or navigation scope.');
        for (const name of motion.validation_files) {
          if (!['detail-native/terrain-navigation/', 'detail-native/terrain-preview/'].some(prefix => name.startsWith(prefix)) || name.includes('..'))
            throw Error('Unexpected terrain evidence path.');
          required.add(name);
        }
      }
      await Promise.all([...required].map(async name => {
        const r = await fetch('../clanky-v2/' + name);
        if (!terrain.source_sha256[name] || !r.ok || await hash(await r.arrayBuffer()) !== terrain.source_sha256[name])
          throw Error('Terrain recording needs rebuilding: ' + name);
      }));
      extra.motions.push(...terrain.motions);
    }
    const turnResponse = await fetch('../clanky-v2/detail-native/turn-viewer-replay.json');
    if (turnResponse.ok) {
      const turn = await turnResponse.json();
      if (turn.cad_revision !== 'detail' ||
          turn.robot_reference_model_sha256 !== extra.source_sha256['detail-native/baseline-jump-125us/model.xml'] ||
          turn.source_sha256['detail-native/viewer-replay.json'] !== await hash(detailedBytes))
        throw Error('Turn recording uses a different CAD or reference recording.');
      const required = new Set(['detail/manifest.json', 'detail/parts.json']);
      for (const motion of turn.motions) {
        if (motion.cad_revision !== 'detail' || !motion.report.passed || !motion.report.native_valid ||
            !motion.stop_at_end || !motion.report.teacher_intervenes || motion.report.actor_sha256 !== null ||
            motion.report.controller !== 'yaw_bias_compensated_teacher' || !motion.validation_files?.length)
          throw Error('Programmed turn recording is missing its result or controller identity.');
        for (const name of motion.validation_files) {
          if (!name.startsWith('detail-native/commanded-turns/bias-compensation/') || name.includes('..'))
            throw Error('Unexpected turn evidence path.');
          required.add(name);
        }
      }
      await Promise.all([...required].map(async name => {
        const r = await fetch('../clanky-v2/' + name);
        if (!turn.source_sha256[name] || !r.ok || await hash(await r.arrayBuffer()) !== turn.source_sha256[name])
          throw Error('Turn recording needs rebuilding: ' + name);
      }));
      extra.motions.push(...turn.motions);
    }
    const recoveryResponse = await fetch('../clanky-v2/detail-native/recovery-viewer-replay.json');
    if (recoveryResponse.ok) {
      const recovery = await recoveryResponse.json();
      if (recovery.cad_revision !== 'detail' ||
          recovery.robot_reference_model_sha256 !== extra.source_sha256['detail-native/baseline-jump-125us/model.xml'] ||
          recovery.source_sha256['detail-native/viewer-replay.json'] !== await hash(detailedBytes))
        throw Error('Recovery recording uses a different CAD or reference recording.');
      const required = new Set(['detail/manifest.json', 'detail/parts.json']);
      for (const motion of recovery.motions) {
        if (motion.cad_revision !== 'detail' || !motion.report.passed || !motion.report.valid ||
            !motion.stop_at_end || !motion.validation_files?.length ||
            motion.report.supervisor?.restart_count > 1 || !motion.report.supervisor)
          throw Error('Recovery recording is missing its result or bounded retry metadata.');
        for (const name of motion.validation_files) {
          if (!name.startsWith('detail-native/recovery-transfer/') || name.includes('..'))
            throw Error('Unexpected recovery evidence path.');
          required.add(name);
        }
      }
      await Promise.all([...required].map(async name => {
        const r = await fetch('../clanky-v2/' + name);
        if (!recovery.source_sha256[name] || !r.ok || await hash(await r.arrayBuffer()) !== recovery.source_sha256[name])
          throw Error('Recovery recording needs rebuilding: ' + name);
      }));
      extra.motions.push(...recovery.motions);
    }
    data.motions.unshift(...extra.motions);
    geometrySets.detail = extra.geometries;
  }
  const physics = new THREE.Group(), groups = {}, shapeRoots = {};
  physics.visible = false;
  for (const [revision, geometries] of Object.entries(geometrySets)) {
    const root = shapeRoots[revision] = new THREE.Group();
    groups[revision] = {};
    physics.add(root);
    for (const part of geometries) {
    let geometry;
    if (part.kind === 'cylinder') {
      geometry = new THREE.CylinderGeometry(part.size[0]*1000, part.size[0]*1000, part.size[1]*2000, 64);
      geometry.rotateX(Math.PI/2);
    } else {
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices.flat().map(v=>v*1000), 3));
      geometry.setIndex(part.triangles.flat());
      geometry.computeVertexNormals();
    }
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color:part.kind === 'cylinder' ? '#354b43' : part.body==='chassis' ? '#c3d2c8' : '#4f9386',
      roughness:.7, side:THREE.DoubleSide,
    }));
    mesh.position.set(...part.pos.map(v=>v*1000)); mesh.quaternion.copy(rotation(part.quat));
    mesh.castShadow = mesh.receiveShadow = true;
    const group = groups[revision][part.body] ??= new THREE.Group();
    if (!group.parent) root.add(group);
    group.add(mesh);
    }
  }
  scene.add(physics);
  let selected = null, time = 0, playing = false, last = null, previousOrigin = null;
  const motions = new Map(data.motions.map(m=>[m.id,m]));
  // Driving and recovery can leave the fixed 3 m inspection floor. Extend
  // the displayed ground and follow their shadows without moving poses.
  const floor = scene.children.find(o=>o.isMesh && o.geometry?.type==='PlaneGeometry' && o.receiveShadow);
  const grid = scene.children.find(o=>o.type==='GridHelper');
  const keyLight = scene.children.find(o=>o.isDirectionalLight && o.castShadow);
  const lightOrigin = keyLight?.position.clone(), targetOrigin = keyLight?.target.position.clone();
  const travelGround = new THREE.Group(); travelGround.visible = false;
  const travellingMotions = data.motions.filter(m=>!m.terrain && m.frames.some(f=>
    Math.abs(f.bodies.chassis.pos[0])>1 || Math.abs(f.bodies.chassis.pos[1])>1));
  const travellingIds = new Set(travellingMotions.map(m=>m.id));
  if (travellingMotions.length && floor && grid) {
    let extent = 0;
    for (const motion of travellingMotions) for (const frame of motion.frames)
      extent = Math.max(extent, ...frame.bodies.chassis.pos.slice(0,2).map(v=>Math.abs(v)*1000));
    const span = Math.max(3000, Math.ceil((extent+1500)/1000)*2000);
    const travelFloor = floor.clone(); travelFloor.geometry = new THREE.PlaneGeometry(span,span);
    const travelGrid = new THREE.GridHelper(span,span/20,'#b8c6bc','#ccd6cf');
    travelGrid.rotation.x=Math.PI/2; travelGrid.material.transparent=true; travelGrid.material.opacity=.3;
    travelGround.add(travelFloor,travelGrid); scene.add(travelGround);
  }
  const terrainViews = new Map();
  const select = $('motion');
  for (const motion of data.motions) select.add(new Option(motion.label, motion.id));
  function updateControls() {
    document.querySelector('.sidebar-footer').textContent = selected
      ? `Current V2 CAD · ${selected.label}` : 'Current V2 CAD · manual inspection';
    $('playback').hidden = !selected;
    $('manual').hidden = !!selected;
    $('peak').hidden = !['jump', 'jump-recorded'].includes(selected?.id) && selected?.highlight_time_s == null;
    $('peak').textContent = selected?.highlight_label ?? 'Peak jump';
    $('play').textContent = playing ? 'Pause' : 'Play';
    const shownTime = selected ? Math.min(time, selected.frames.at(-1).t) : 0;
    $('replay-time').textContent = `${shownTime.toFixed(2)} / ${selected ? selected.frames.at(-1).t.toFixed(2) : '0.00'} s`;
    $('timeline').value = shownTime;
    const jump = motions.get('jump').report;
    document.querySelector('.fine-print').textContent = 'The wider body gives the D435i and its USB cable room. This layout exceeds the former 180 mm folded-width target. '
      + (jump.first_flight_both_wheel_clearance_mm >= 250 && jump.stable_finish ? 'The nominal jump meets the 250 mm target; hardware variations are still under investigation.' : 'The current programmed jump has not passed both the 250 mm target and landing checks.');
    if (!selected) return;
    const r = selected.report;
    $('replay-result').textContent = selected.description ?? (selected.id === 'jump'
      ? `${r.first_flight_both_wheel_clearance_mm.toFixed(0)} mm wheel clearance · ${r.COM_rise_from_detected_takeoff_mm.toFixed(0)} mm COM rise · ${r.stable_finish ? 'lands and settles in this trial' : 'lands upright but keeps rolling; settled-landing check fails'}.`
      : 'Five seconds of programmed standing balance from the nominal starting pose.');
    const validation = data.validation;
    const passed = validation?.cases.filter(c=>c.target_jump_pass).length;
    $('replay-limit').textContent = selected.limit_text ?? ((selected.id==='jump' && validation
      ? `${passed} of ${validation.cases.length} timestep/hardware cases meet the 250 mm target and landing checks. See the sensitivity report below. ` : '')
      + 'Programmed simulation, not learned. Physical hardware, fall recovery, strength and sim2real remain unqualified.');
    $('replay-report').href = selected.report_url ?? `../clanky-v2/native/viewer-${selected.id}/report.json`;
    const evidence = $('replay-evidence');
    if (evidence) {
      evidence.href = selected.evidence_url ?? (selected.terrain ? '../clanky-v2/native/terrain/coarse-summary.json' : '../clanky-v2/native/jump-validation.json');
      evidence.textContent = selected.evidence_label ?? (selected.terrain ? 'Terrain development screen ↗' : 'Jump sensitivity checks ↗');
    }
  }
  function choose(id, autoplay = true) {
    selected = motions.get(id) ?? null;
    const travelling = travellingIds.has(selected?.id) && travelGround.children.length>0;
    travelGround.visible = travelling;
    // A flat display floor would cover the depressed parts of a terrain course.
    if (floor) floor.visible = !travelling && !selected?.terrain;
    if (grid) grid.visible = !travelling && !selected?.terrain;
    if (keyLight) {
      keyLight.position.copy(lightOrigin); keyLight.target.position.copy(targetOrigin);
      keyLight.target.updateMatrixWorld();
    }
    if (selected?.terrain && !terrainViews.has(id)) {
      const view = terrainView(THREE, selected.terrain);
      scene.add(view.root); terrainViews.set(id, view);
    }
    for (const [key, view] of terrainViews) view.root.visible = key === selected?.id;
    select.value = selected?.id ?? 'manual';
    time = selected?.frames[0].t ?? 0;
    playing = !!selected && autoplay;
    last = null; previousOrigin = null;
    // Align the slider endpoint with its 0.01 s step despite integration drift.
    $('timeline').max = (selected?.frames.at(-1).t ?? 1).toFixed(2);
    updateControls(); onChange(true);
    const url = new URL(location.href);
    url.searchParams.set('motion', selected?.id ?? 'manual');
    history.replaceState(null, '', url);
  }
  select.onchange = () => choose(select.value);
  $('play').onclick = () => {
    if (selected?.stop_at_end && time >= selected.frames.at(-1).t) time=selected.frames[0].t;
    playing=!playing;last=null;updateControls();
  };
  $('restart').onclick = () => {time=selected.frames[0].t;playing=true;last=null;updateControls();onChange(false);};
  $('peak').onclick = () => {time=selected.highlight_time_s ?? selected.frames.reduce((a,b)=>a.clearance_mm>b.clearance_mm?a:b).t;playing=false;last=null;updateControls();onChange(false);};
  $('timeline').oninput = () => {time=$('timeline').valueAsNumber;playing=false;last=null;updateControls();onChange(false);};
  function frame() {
    if (!selected) return null;
    const frames = selected.frames;
    let hi = frames.findIndex(f=>f.t>=time);
    if (hi < 0) hi = frames.length-1;
    const a = frames[Math.max(0,hi-1)], b = frames[hi], u = a.t===b.t ? 0 : THREE.MathUtils.clamp((time-a.t)/(b.t-a.t),0,1);
    const mix = (a,b) => a.map((v,i)=>v+(b[i]-v)*u);
    const bodies = {};
    for (const [name, tr] of Object.entries(a.bodies)) {
      const q = rotation(tr.quat).slerp(rotation(b.bodies[name].quat), u);
      bodies[name] = {pos:mix(tr.pos,b.bodies[name].pos), quat:[q.w,q.x,q.y,q.z]};
    }
    const nearest = u<.5 ? a : b;
    const contactLabel = nearest.body_contact ? 'body touching ground' : nearest.grounded.every(Boolean) ? 'both wheels grounded' : nearest.grounded.some(Boolean) ? 'one wheel grounded' : 'airborne';
    const degrees = nearest.roll_rotation_deg ?? nearest.signed_pitch_rotation_deg;
    const angle = Number.isFinite(degrees) ? ` · ${degrees.toFixed(0)}° ${nearest.roll_rotation_deg == null ? 'rotation' : 'sideways'}` : '';
    $('replay-phase').textContent = time >= frames.at(-1).t && selected.end_message
      ? selected.end_message + angle : `${nearest.phase.replaceAll('_',' ')} · ${contactLabel}${angle}`;
    return {bodies, spring_segments_m:a.spring_segments_m.map((segment,i)=>segment.map((point,j)=>mix(point,b.spring_segments_m[i][j])))};
  }
  return {
    physics,
    get active() {return !!selected;},
    get label() {return selected?.label;},
    get cadRevision() {return selected?.cad_revision ?? (detailed ? 'detail' : 'recorded');},
    choose,
    frame,
    bounds() {
      if (!selected) return null;
      const bounds = new THREE.Box3();
      for (const f of selected.frames) {
        const [x,y] = f.bodies.chassis.pos;
        for (const tr of Object.values(f.bodies)) bounds.expandByPoint(new THREE.Vector3((tr.pos[0]-x)*1000,(tr.pos[1]-y)*1000,tr.pos[2]*1000));
      }
      const f = selected.frames.find(f=>f.t>=time) ?? selected.frames.at(-1);
      const [x,y] = f.bodies.chassis.pos;
      return bounds.expandByVector(new THREE.Vector3(105,135,75)).translate(new THREE.Vector3(x*1000,y*1000,0));
    },
    applyPhysics(frame, visible, zOffset=0) {
      physics.visible = visible; physics.position.z=zOffset;
      const revision = selected?.cad_revision ?? (detailed ? 'detail' : 'recorded');
      for (const [name, root] of Object.entries(shapeRoots)) root.visible = name === revision;
      if (selected) {
        const origin = new THREE.Vector3(frame.bodies.chassis.pos[0]*1000,frame.bodies.chassis.pos[1]*1000,0);
        if ((travellingIds.has(selected.id) || selected.terrain) && keyLight) {
          keyLight.position.copy(lightOrigin).add(origin);
          keyLight.target.position.copy(targetOrigin).add(origin); keyLight.target.updateMatrixWorld();
        }
        if (previousOrigin) {const delta=origin.clone().sub(previousOrigin);camera.position.add(delta);controls.target.add(delta);}
        previousOrigin=origin;
      } else previousOrigin=null;
      for (const [name,tr] of Object.entries(frame.bodies)) {
        const group = groups[revision][name]; if (!group) continue;
        group.position.set(...tr.pos.map(v=>v*1000)); group.quaternion.copy(rotation(tr.quat));
      }
    },
    tick(now) {
      const elapsed = last===null ? 0 : Math.min(.1,(now-last)/1000); last=now;
      if (!playing || !selected) return false;
      time += elapsed * Number($('speed').value);
      if (selected.stop_at_end && time >= selected.frames.at(-1).t) {
        time=selected.frames.at(-1).t; playing=false;
      } else if (time>selected.frames.at(-1).t+.8) time=selected.frames[0].t;
      updateControls(); return true;
    },
  };
}

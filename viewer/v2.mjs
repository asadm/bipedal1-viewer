import {sha256 as sha256} from './sha256.mjs';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {cadRobot} from './cad-robot.mjs';
import {leg} from '../concept06/internal-kinematics.mjs';
import {nativeReplay} from './v2-replay.mjs';
const $ = id => document.getElementById(id);
const query = new URLSearchParams(location.search);
// The short V2 URL always opens the most recent assembled CAD overlay.
// Earlier layouts stay addressable so their own evidence remains inspectable.
const study = ['body','spring','drive','output'].includes(query.get('study')) ? query.get('study') : 'output';
try {
  const response = await fetch('../clanky-v2/assembly.json'); if (!response.ok) throw Error('Assembly export is not ready');
  const assemblyBytes = await response.arrayBuffer();
  const layout = JSON.parse(new TextDecoder().decode(assemblyBytes));
  const bytes = await (await fetch('../clanky-v2/assembly-parts.json')).arrayBuffer();
  const hash = await sha256(bytes);
  if (hash !== layout.parts_sha256) throw Error('Layout CAD checksum mismatch');
  try {
    const [audit, properties, packaging] = await Promise.all(['assembly-fit.json','assembly-properties.json','body-package-fit.json'].map(async path=>(await fetch('../clanky-v2/'+path)).json()));
    const assemblyHash=await sha256(assemblyBytes);
    if (!audit.passed || audit.source_sha256['assembly.json'] !== assemblyHash || audit.source_sha256['assembly-parts.json'] !== hash) throw Error('Assembly fit check is pending');
    if (!properties.passed || properties.assembly_sha256 !== assemblyHash || properties.parts_sha256 !== hash) throw Error('CAD mesh check is pending');
    if (!packaging.passed || packaging.source_sha256['body_package.py'] !== layout.source_sha256['clanky-v2/body_package.py']) throw Error('Electronics space check is pending');
    $('fit-summary').textContent = `Development CAD. The enclosed assembly and electronics envelopes pass ${audit.cases.toLocaleString()} sampled leg poses. Hip drives, retention, flexible wiring, loads and motions still need work.`;
    $('fit-evidence').textContent = `${audit.independent_grid_cases} independent-leg combinations and a ${audit.symmetric_sweep_cases}-pose symmetric sweep pass for these CAD files, with conservative rotation envelopes. All ${properties.parts.length} meshes pass topology checks and ${packaging.checks.length} nominal electronics-space checks pass.`;
  } catch {
    $('fit-summary').textContent = 'Development CAD. The displayed assembly does not yet have a matching passing fit report. Hip drives, joint retention, loads and motions still need work.';
    $('fit-evidence').textContent = 'Current assembly fit evidence is pending.';
  }
  let parts = JSON.parse(new TextDecoder().decode(bytes));
  const originalParts = parts;
  let springStudy = null;
  let springSummary = null;
  let driveStudy = null;
  let outputStudy = null;
  if (['spring','drive','output'].includes(study)) {
    const [manifestResponse, partsResponse] = await Promise.all([
      fetch('../clanky-v2/coaxial-spring/manifest.json'), fetch('../clanky-v2/coaxial-spring/parts.json')
    ]);
    if (!manifestResponse.ok || !partsResponse.ok) throw Error('Spring study export is not ready');
    const manifestBytes = await manifestResponse.arrayBuffer();
    springStudy = JSON.parse(new TextDecoder().decode(manifestBytes));
    const studyBytes = await partsResponse.arrayBuffer(), studyHash = await sha256(studyBytes);
    if (studyHash !== springStudy.parts_sha256 || springStudy.source_sha256['assembly.json'] !== await sha256(assemblyBytes) || springStudy.source_sha256['assembly-parts.json'] !== hash) throw Error('Spring study does not match this assembly');
    const additions = JSON.parse(new TextDecoder().decode(studyBytes));
    const replaced = new Set(additions.map(p => p.replacement).filter(Boolean));
    parts = [...parts.filter(p => !replaced.has(p.name)), ...additions];
    document.querySelector('h1').textContent = 'Spring, aligned.';
    document.querySelector('.intro').textContent = 'A curved connecting rod and guided piston keep the spring load in one plane. This is an unadopted left-side study; the right leg remains the previous layout.';
    $('fit-summary').textContent = 'Study CAD. Interference checks are pending for these files. Spring retention, printed-guide wear and loads remain unqualified.';
    $('fit-evidence').textContent = 'No matching passing spring-study report yet.';
    try {
      const evidenceBytes = await Promise.all(['fit-diagnostic.json','exact-diagnostic.json'].map(async n => (await fetch('../clanky-v2/coaxial-spring/'+n)).arrayBuffer()));
      const [sweep, exact] = evidenceBytes.map(bytes => JSON.parse(new TextDecoder().decode(bytes)));
      const manifestHash = await sha256(manifestBytes);
      if (sweep.source_sha256['coaxial-spring/manifest.json'] === manifestHash && sweep.source_sha256['coaxial-spring/parts.json'] === studyHash && sweep.new_meshes.every(p => p.passed)) springSummary = sweep.assembly_summary;
      if (exact.passed && exact.source_sha256['coaxial-spring/fit-diagnostic.json'] === await sha256(evidenceBytes[0]) && exact.source_sha256['coaxial-spring/manifest.json'] === manifestHash && sweep.source_sha256['coaxial-spring/manifest.json'] === manifestHash && sweep.source_sha256['coaxial-spring/parts.json'] === studyHash && sweep.new_meshes.every(p => p.passed)) {
        $('fit-summary').textContent = 'Study CAD. The nominal sweep and exact overlap checks pass. Printed-guide wear, spring retention, fastener loads and the hip drive still need work.';
        $('fit-evidence').textContent = `${sweep.poses} symmetric poses checked, followed by ${exact.cases.length + exact.electronics_allocations.length} exact CAD checks with ${exact.contact_classification.length} reviewed nominal interfaces. This is left-side packaging evidence, not a motion result.`;
      }
    } catch { /* The study remains explicitly unverified if evidence is unavailable. */ }
    $('caption').textContent = 'Spring guide study · left side changed · prescribed pose';
    document.querySelector('h2').textContent = 'Inside the spring guide';
    document.querySelector('.anatomy').innerHTML = '<li><span>01</span><div><strong>Aligned connecting rod</strong><p>The curved steel rod passes around the knee bearing. Its centre plane matches the spring, removing the previous lateral offset.</p></div></li><li><span>02</span><div><strong>Guide built into the thigh</strong><p>An 18 mm printed piston runs directly in the thigh housing. Its clevis also limits twisting; clearance, friction and wear need qualification.</p></div></li><li><span>03</span><div><strong>Separate spring support</strong><p>A retained M5 bolt supports the spring inside its coils. The printed piston carries the side load. Free-spring retention and fastener loads remain open.</p></div></li>';
    $('fit-evidence').nextSibling.textContent = ' The right leg retains the previous spring layout. These checks do not qualify printed sliding surfaces, free-spring retention, fastener loads or a complete hip drive. All V2 dynamic skills remain unverified.';
    const download = document.querySelector('a[href="../clanky-v2/assembly.step"]');
    download.href = '../clanky-v2/coaxial-spring/study.step'; download.textContent = 'Left spring study STEP ↓';
    const fitLink = document.querySelector('a[href="../clanky-v2/assembly-fit.json"]');
    fitLink.href = '../clanky-v2/coaxial-spring/exact-diagnostic.json'; fitLink.textContent = 'Spring interference check ↗';
    const loadLink = document.querySelector('a[href="../clanky-v2/spring-cartridge.json"]');
    loadLink.href = '../clanky-v2/coaxial-spring/load-screen.json'; loadLink.textContent = 'Spring load screen ↗';
  }
  if (['drive','output'].includes(study)) {
    const [reportResponse, meshResponse] = await Promise.all([
      fetch('../clanky-v2/hip-gear-layout/layout-screen.json'), fetch('../clanky-v2/hip-gear-layout/viewer-parts.json')
    ]);
    if (!reportResponse.ok || !meshResponse.ok) throw Error('Hip drive export is not ready');
    driveStudy = await reportResponse.json();
    const driveBytes = await meshResponse.arrayBuffer();
    if (await sha256(driveBytes) !== driveStudy.viewer_parts_sha256) throw Error('Hip drive CAD checksum mismatch');
    const additions = JSON.parse(new TextDecoder().decode(driveBytes));
    const left = parts.filter(p=>p.body.startsWith('left') || p.name.startsWith('left_'))
      .filter(p=>!['left_spindle_body_plate','left_spindle_mount_M3_-17','left_spindle_mount_M3_17','left_spindle_cap_rear','left_spindle_M3_rear','left_spindle_spacer_0'].includes(p.name));
    const mirrored = left.map(p=>({...p,name:p.name.replace(/^left_/,'right_'),body:p.body.replace(/^left_/,'right_'),
      vertices:p.vertices.map(([x,y,z])=>[x,-y,z]),triangles:p.triangles.map(([a,b,c])=>[a,c,b]),
      ...(p.motion?{motion:{...p.motion,side:'right',origin:p.motion.origin.map((v,i)=>i===1?-v:v)}}:{})}));
    const fixed = originalParts.filter(p=>p.body==='chassis' && !['raspberry_pi_5_PCB_envelope','pi_cooler_envelope','battery_envelope','control_electronics_envelope'].includes(p.name));
    parts = [...fixed, ...left, ...mirrored, ...additions];
    layout.body_package.allocations = driveStudy.cases.find(c=>c.case==='central_battery_rear_control').allocations;
    document.querySelector('h1').textContent = 'Inside the hip drive.';
    document.querySelector('.intro').textContent = 'Two enclosed hip motors drive 16:1 reductions: 15→60 teeth, then 20→80. Reordering the same four gears clears space for the output joint. Move either leg to inspect the ideal gear motion.';
    $('fit-summary').textContent = 'Layout study. Stock gears are detailed CAD; amber parts are unfinished motor, hub and support reservations. The existing body shell needs clearance changes around this drive.';
    const packagingCase=driveStudy.cases.find(c=>c.case==='central_battery_rear_control');
    $('fit-evidence').textContent = `${packagingCase.checks.filter(c=>c.passed).length} of ${packagingCase.checks.length} nominal electronics checks pass for this layout. Gear tooth phase, backlash, mounting, retention and loads remain unfinished.`;
    $('fit-evidence').nextSibling.textContent = ' The existing body is shown as a reference envelope. The old inner spindle mounting plates are omitted because their replacements are unfinished. The mirrored right leg is a candidate. This is prescribed kinematics, not a physics replay.';
    document.querySelector('h2').textContent = 'Motor to thigh';
    document.querySelector('.anatomy').innerHTML = '<li><span>01</span><div><strong>Two 4:1 stages</strong><p>A steel 15T pinion drives an aluminum 60T gear. The same intermediate shaft turns a 20T pinion and 80T hip gear. Gears move at the ideal ratio; their tooth phase and backlash are not yet verified.</p></div></li><li><span>02</span><div><strong>Battery in the middle</strong><p>The camera bay stays roomy. The Pi allowance is now 78 × 104 × 32 mm and sits higher to clear the output gears. The central battery and rear controller bays still need selected electronics and mounts.</p></div></li><li><span>03</span><div><strong>Amber means unfinished</strong><p>Motor cylinders, compound hubs, shafts and bearing spaces are allocations. The latest Output joint view adds the left case and its bearing supports. Motor mounting and compound torque connections remain unfinished.</p></div></li>';
    $('packaging-key').innerHTML = '<p class="small-note"><span style="color:#299eb3">■ Camera + USB</span> · <span style="color:#429e64">■ Pi + cooling</span><br><span style="color:#d98526">■ Battery</span> · <span style="color:#8066ba">■ Rear controls</span></p><p class="small-note">Amber solids: unfinished drive reservations. Wiring routes need revision for this packaging.</p>';
    $('caption').textContent = 'Hip drive study · ideal 16:1 motion · housing unfinished';
    document.querySelector('[data-display="enclosed"]').textContent='Body envelope';
    $('drive-focus').hidden = false;
    const downloads=document.querySelector('details .downloads');
    downloads.innerHTML='<a href="../clanky-v2/hip-gear-layout/layout.step">Drive layout STEP ↓</a><a href="../clanky-v2/hip-gear-layout/layout-screen.json">Packaging checks ↗</a><a href="../clanky-v2/hip-gear-layout/motor-screen.json">Motor sizing ↗</a><a href="../clanky-v2/hip-gear-layout/motion-screen.json">Folding clearance ↗</a>';
    document.querySelector('.object-label span:last-child').textContent='Hip drive study · supports unfinished';
  }
  if (study === 'output') {
    const [manifestResponse, partsResponse] = await Promise.all([
      fetch('../clanky-v2/hip-output/manifest.json'), fetch('../clanky-v2/hip-output/parts.json')
    ]);
    if (!manifestResponse.ok || !partsResponse.ok) throw Error('Output joint export is not ready');
    const outputManifestBytes=await manifestResponse.arrayBuffer();
    outputStudy = JSON.parse(new TextDecoder().decode(outputManifestBytes));
    const outputBytes = await partsResponse.arrayBuffer();
    const springBytes = await (await fetch('../clanky-v2/coaxial-spring/manifest.json')).arrayBuffer();
    if (await sha256(outputBytes) !== outputStudy.parts_sha256 ||
        outputStudy.source_sha256['assembly.json'] !== await sha256(assemblyBytes) ||
        outputStudy.source_sha256['coaxial-spring/manifest.json'] !== await sha256(springBytes) ||
        outputStudy.source_sha256['hip_gear_layout.py'] !== driveStudy.input_sha256['hip_gear_layout.py']) throw Error('Output joint does not match this assembly and drive layout');
    const additions = JSON.parse(new TextDecoder().decode(outputBytes)).filter(p=>p.source_component==='hip_output');
    const removed = new Set([...outputStudy.removed_spring_parts, ...additions.map(p=>p.replacement),
      'body_lower', 'body_upper', 'left_drive_output_60T', 'left_drive_output_80T', 'left_drive_output_neck']);
    parts = [...parts.filter(p=>!removed.has(p.name)), ...additions];
    document.title = 'Clanky V2 / Latest design';
    document.querySelector('h1').textContent = 'The latest Clanky design.';
    document.querySelector('.intro').textContent = 'One body with a flush sensor region, room for a D435i, Pi and battery, and 120 mm wheels. The latest left hip adds a gear case and bearing supports inside the body prints. Use Cutaway to see them.';
    $('fit-summary').textContent = 'Unverified joint study. The output connection and local body cup are now modeled. Full gearbox clearance, assembly access and strength checks are pending.';
    $('fit-evidence').textContent = 'This is new CAD and does not inherit the earlier spring or gear-layout fit results. The right output joint retains its earlier reservations.';
    $('fit-evidence').nextSibling.textContent = ' Gear tooth phase, input and compound torque connections, body closure, tolerances, fastening and dynamic skills remain unfinished. Motion here is prescribed kinematics.';
    document.querySelector('h2').textContent = 'Inside the output joint';
    document.querySelector('.anatomy').innerHTML = '<li><span>01</span><div><strong>Flange in the thigh print</strong><p>The 80T gear uses four existing holes. Four M4 bolts, captive nuts and metal spacers join it directly to the thigh flange. Fastener loads and print strength still need checking.</p></div></li><li><span>02</span><div><strong>Bearing moved inward</strong><p>The inner 8 × 16 × 5 mm bearing moves 18 mm toward the gear. A longer fixed steel spindle supports the rotating thigh; a keyed plate mounts it inside the body.</p></div></li><li><span>03</span><div><strong>Case and supports in the body prints</strong><p>The left gear case and intermediate bearing pockets are integrated into the existing two body parts. One bearing sits in the recessed face of the 60T gear. Closure fasteners, assembly access and the remaining torque connections still need work.</p></div></li>';
    $('caption').textContent = 'Latest left output joint · fit and loads pending';
    $('drive-focus').textContent = 'Focus on output joint';
    document.querySelector('[data-display="enclosed"]').textContent = 'Exterior';
    document.querySelector('.object-label span:last-child').textContent = 'Left hip updated · CAD preview';
    document.querySelector('details .downloads').innerHTML = '<a href="../clanky-v2/hip-output/parts-local.step">Parts in local coordinates STEP ↓</a><a href="../clanky-v2/hip-output/contact-classification.json">Joint and case clearance checks ↗</a><a href="../clanky-v2/hip-output/manifest.json">Joint dimensions and open work ↗</a>';
    try {
      const evidence=await (await fetch('../clanky-v2/hip-output/contact-classification.json')).json();
      const auditBytes=await Promise.all(['fit-diagnostic.json','exact-diagnostic.json'].map(async n=>(await fetch('../clanky-v2/hip-output/'+n)).arrayBuffer()));
      const [sweep, exact]=auditBytes.map(b=>JSON.parse(new TextDecoder().decode(b)));
      const manifestHash=await sha256(outputManifestBytes);
      if (evidence.nominal_joint_and_case_clearance_pass &&
          evidence.source_sha256['hip-output/manifest.json']===manifestHash &&
          evidence.source_sha256['hip-output/fit-diagnostic.json']===await sha256(auditBytes[0]) &&
          evidence.source_sha256['hip-output/exact-diagnostic.json']===await sha256(auditBytes[1]) &&
          exact.source_sha256['hip-output/fit-diagnostic.json']===await sha256(auditBytes[0]) &&
          sweep.source_sha256['hip-output/manifest.json']===manifestHash &&
          sweep.source_sha256['hip-output/parts.json']===outputStudy.parts_sha256) {
        $('fit-summary').textContent='Left joint and case: nominal clearance checks pass. Gear engagement, motor and compound connections, closure, retention and strength remain unfinished.';
        $('fit-evidence').textContent=`${evidence.checked_mesh_poses} sampled poses and ${evidence.exact_material_cases} exact material checks cover the changed left joint and case. The overlapping gear-tooth envelopes are explicitly outside this clearance result; actual gear engagement is unvalidated.`;
        $('caption').textContent='Latest left joint + case · nominal clearance checked';
      }
    } catch { /* Keep the inspection study marked unverified when evidence is unavailable. */ }
  }
  for (const link of document.querySelectorAll('nav[aria-label="Design study"] a')) {
    if ((new URL(link.href).searchParams.get('study') ?? 'output') === study) {
      link.setAttribute('aria-current', 'page'); link.style.fontWeight='700';
    }
  }
  if (new Set(parts.map(p=>p.name)).size !== parts.length) throw Error('Duplicate CAD components in this study');
  const inFocus = p => outputStudy
    ? (p.source_component==='hip_output' && !p.name.startsWith('body_')) || ['left_hip_F688_outer','left_spindle_spacer_2','left_fixed_tie_anchor','left_spindle_cap_front','left_spindle_M3_front'].includes(p.name)
    : p.source_component==='hip_drive';
  const colors = {shell:[.80,.84,.81], glass:[.025,.045,.05], rubber:[.035,.05,.045], battery:[.19,.25,.30], tire:[.045,.06,.053], metal:[.42,.47,.44], motor:[.23,.29,.27], gear:[.60,.48,.22], copper:[.61,.31,.14], board:[.08,.30,.19],allocation:[.95,.52,.16]};
  const g = layout.geometry, geometry = {crank_mm:g.upper_mm, lower_mm:g.lower_mm, tie_mm:g.tie_mm, coupler_mm:g.lever_mm, body_pin_mm:g.ground_mm, lever_phase_rad:g.phase_rad};
  const sp = layout.spring;
  const parameters = {geometry, nominal_q_rad:layout.poses.ride.hip_rad, spring:{free_length_m:sp.free_spring_length_mm/1000}};
  const robot = cadRobot(parts.map(p=>({...p,color:p.name==='left_driven_thigh_frame'?[.28,.57,.56]:p.name.startsWith('left_output_gear_')?[.66,.71,.73]:p.source_component==='hip_drive'&&p.kind==='stock_gear'?(p.sku.startsWith('2302')?[.66,.71,.73]:[.22,.26,.28]):colors[p.material]})),parameters);
  const packageGroup = new THREE.Group(); robot.groups.chassis.add(packageGroup);
  for (const p of layout.body_package.allocations) {
    const geometry = new THREE.BoxGeometry(...p.dims);
    const color = new THREE.Color(...p.color);
    const volume = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.055,depthWrite:false}));
    volume.position.set(...p.centre); packageGroup.add(volume);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.85}));
    edges.position.copy(volume.position); packageGroup.add(edges);
  }
  // Planning overlay only: no fixed cable length, collision or fatigue claim.
  const harnessGroup = new THREE.Group(); robot.groups.chassis.add(harnessGroup);
  function updateHarness(solutions, angles) {
    for (const child of [...harnessGroup.children]) {child.geometry.dispose();child.material.dispose();harnessGroup.remove(child);}
    const rotate=(x,z,q)=>[x*Math.cos(q)+z*Math.sin(q),-x*Math.sin(q)+z*Math.cos(q)];
    ['left','right'].forEach((side,i)=>{
      const sign=i===0?1:-1, s=solutions[i], q=angles[i];
      const upper=(x,y,z)=>{const p=rotate(x,z,q);return new THREE.Vector3(p[0],sign*y,p[1]);};
      const lower=(x,y,z)=>{const p=rotate(x,z,s.phi);return new THREE.Vector3(s.C[0]+p[0],sign*y,s.C[1]+p[1]);};
      for (const feedback of [false,true]) {
        const offset=layout.wheel_module_outboard_shift_mm, zUpper=feedback?9:17, zShin=feedback?15.5:9.5;
        const points=[
          new THREE.Vector3(-12,sign*59,feedback?26:12),
          new THREE.Vector3(-12,sign*66,feedback?26:12),
          upper(-10,offset+37.5,zUpper), upper(-4,offset+37.5,zUpper),
          upper(60,offset+37.5,zUpper), upper(90,offset+37.5,zUpper),
          upper(g.upper_mm+2,offset+61,23),
          lower(14,offset+66.25,zShin), lower(g.lower_mm-34,offset+66.25,zShin),
          lower(g.lower_mm-25,offset+60,29),
          lower(g.lower_mm-(feedback?8:20),offset+(feedback?28.5:42.5),30),
        ];
        const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),100,feedback?.9:1.5,7,false),
          new THREE.MeshStandardMaterial({color:feedback?'#209cc0':'#d58a29',roughness:.6,transparent:true,opacity:.85}));
        harnessGroup.add(mesh);
      }
    });
  }
  THREE.Object3D.DEFAULT_UP.set(0,0,1);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#edf1ef'); scene.add(robot.root);
  const canvas = $('model-canvas'), viewport = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const camera = new THREE.PerspectiveCamera(36,1,.5,10000), controls = new OrbitControls(camera,canvas); controls.enableDamping=true; controls.minDistance=100; controls.maxDistance=2000;
  scene.add(new THREE.HemisphereLight('#ffffff','#738579',2));
  const key = new THREE.DirectionalLight('#fff8ed',3.6); key.position.set(200,-350,600); key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.normalBias=.15;
  Object.assign(key.shadow.camera,{left:-350,right:350,top:350,bottom:-350,near:1,far:1600}); scene.add(key);
  const fill=new THREE.DirectionalLight('#dce9ff',1.5); fill.position.set(-240,180,300);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshStandardMaterial({color:'#e7ece8',roughness:1}));floor.position.z=-.3;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(3000,150,'#b8c6bc','#ccd6cf');grid.rotation.x=Math.PI/2;grid.material.transparent=true;grid.material.opacity=.3;scene.add(grid);
  let replay = null;
  let display=['enclosed','cutaway','packaging',...(outputStudy?['physics']:[]),...(driveStudy?['drive']:[])].includes(query.get('view'))?query.get('view'):(outputStudy?'enclosed':driveStudy?'drive':springStudy?'cutaway':'enclosed'), cameraMode='iso';
  for (const id of ['both','left','right']) { $(id).min=layout.hip_range_rad[0];$(id).max=layout.hip_range_rad[1];$(id).value=layout.poses.ride.hip_rad; }
  const foldBounds = springStudy ? springSummary?.mesh_pose_bounds.fold.bounds_mm : layout.poses.fold.bounds_mm;
  $('fold-size').textContent=foldBounds ? foldBounds.map(n=>Math.round(n)).join(' × ')+' mm' : 'Study · envelope pending';$('prints').textContent=parts.filter(p=>p.printed).length;
  if (driveStudy) { $('fold-size').textContent='Pending final drive enclosure'; $('prints').textContent='Drive detail pending'; }
  $('wheel-track').textContent=`${layout.wheel_diameter_mm} / ${layout.track_mm} mm`;
  function cadBounds() {
    robot.root.updateMatrixWorld(true);
    const bounds=new THREE.Box3();
    robot.root.traverse(o=>{if(o.isMesh && o.userData.part && (display!=='drive'||inFocus(o.userData.part))) bounds.expandByObject(o);});
    return bounds;
  }
  function pose() {
    const angles=[$('left').valueAsNumber,$('right').valueAsNumber], solutions=angles.map(q=>leg(geometry,q));
    const rootZ=(60-Math.min(...solutions.map(s=>s.E[1])))/1000;
    const bodies={chassis:{pos:[0,0,rootZ],quat:[1,0,0,0]}};
    const tr=(x,z,q=0)=>({pos:[x/1000,0,rootZ+z/1000],quat:[Math.cos(q/2),0,Math.sin(q/2),0]});
    const springSegments = [];
    ['left','right'].forEach((side,i)=>{
      const sp = springStudy && (i===0 || driveStudy) ? springStudy.spring : layout.spring;
      const s=solutions[i], beta=s.beta, q=angles[i], k=s.phi-q;
      const crank=[g.upper_mm+sp.crank_radius_mm*Math.cos(k),-sp.crank_radius_mm*Math.sin(k)];
      const sx=crank[0]-Math.sqrt(sp.connecting_rod_mm**2-(crank[1]-sp.axis_z_mm)**2);
      const rotate=([x,z])=>[x*Math.cos(q)+z*Math.sin(q),-x*Math.sin(q)+z*Math.cos(q)];
      const slider=rotate([sx,sp.axis_z_mm]);
      bodies[side+'_spring_slider']=tr(...rotate([sx,0]),q);
      bodies[side+'_spring_link']=tr(...slider,q+Math.atan2(-(crank[1]-sp.axis_z_mm),crank[0]-sx));
      const length=Math.min(sp.free_spring_length_mm,sx-sp.seat_to_pin_mm-sp.fixed_seat_x_mm);
      springSegments.push([sp.fixed_seat_x_mm,sp.fixed_seat_x_mm+length].map(x=>{
        const [wx,wz]=rotate([x,sp.axis_z_mm]); return [wx/1000,(i===0?1:-1)*sp.axis_y_mm/1000,rootZ+wz/1000];
      }));
      bodies[side+'_upper']=tr(0,0,angles[i]); bodies[side+'_lower']=tr(...s.C,s.phi);
      bodies[side+'_tie']=tr(...g.ground_mm,beta); bodies[side+'_wheel']=tr(...s.E);
      $(side+'-value').textContent=(angles[i]*180/Math.PI).toFixed(0)+'°';
    });
    $('both-value').textContent=Math.abs(angles[0]-angles[1])<.002 ? (angles[0]*180/Math.PI).toFixed(0)+'°' : 'Mixed';
    $('both').value=(angles[0]+angles[1])/2;
    document.querySelectorAll('[data-pose]').forEach(button=>button.setAttribute('aria-pressed',String(angles.every(q=>Math.abs(q-layout.poses[button.dataset.pose].hip_rad)<.002))));
    $('view-note').textContent = outputStudy ? {
      enclosed:'Exterior of the modeled parts. The teal thigh marks the updated left hip; the right hip is an earlier layout.',
      cutaway:'Transparent shells reveal the revised left gear case, bearings and in-thigh spring. Amber parts are unfinished drive allocations.',
      packaging:'Reserved camera, Pi, battery and controller spaces. Mounts and wiring still need detailing.',
      physics:'The current V2 MuJoCo collision shapes. Tires are rigid cylinders; TPU deformation and internal self-contact are not modeled.',
      drive:'Close-up of the updated left output joint. Move the left leg or both legs to inspect its travel.'
    }[display] : '';
    robot.root.position.z=0;
    const frame = replay?.frame() ?? {bodies,spring_segments_m:springSegments};
    robot.apply(frame); robot.display(['packaging','drive'].includes(display)?'cutaway':display);
    packageGroup.visible=display==='packaging';
    harnessGroup.visible=display==='packaging'&&!driveStudy;
    $('packaging-key').hidden=display!=='packaging';
    if(display==='packaging'&&!driveStudy) updateHarness(solutions,angles);
    // Above-hip recovery poses can put the body below the wheel support plane.
    // Keep the whole inspection model above the floor without implying balance.
    if (!replay?.active) robot.root.position.z=Math.max(0,-cadBounds().min.z);
    replay?.applyPhysics(frame, display==='physics', robot.root.position.z);
    if (replay?.active) $('caption').textContent = `${replay.label} · recorded MuJoCo motion`;
    else if (replay) $('caption').textContent = 'Latest V2 design · manual pose inspection';
    // Make structural case walls translucent too, to expose the whole force path.
    robot.root.traverse(o=>{if(o.isMesh && o.userData.part?.material==='shell' && !o.userData.part.name.endsWith('_spring_slider') && !o.userData.part.name.endsWith('_coaxial_spring_piston')){o.material.transparent=display!=='enclosed';o.material.opacity=display!=='enclosed'?.08:1;o.material.depthWrite=display==='enclosed';o.castShadow=display==='enclosed';}});
    if (driveStudy) robot.root.traverse(o=>{
      if (!o.isMesh) return;
      const p=o.userData.part;
      if (!p) { o.visible=display!=='drive'; return; }
      if (display==='drive' && !inFocus(p)) o.visible=false;
      if (outputStudy && p.name==='left_driven_thigh_frame' && display==='drive') {o.material.opacity=.55;o.material.depthWrite=false;}
      if (p.material==='allocation') {o.material.transparent=true;o.material.opacity=.35;o.material.depthWrite=false;o.castShadow=false;}
      if (p.name.startsWith('body_lower')||p.name.startsWith('body_upper')) {
        const opaque=outputStudy && display==='enclosed';
        o.material.transparent=!opaque;o.material.opacity=opaque?1:display==='enclosed'?.22:.045;
        o.material.depthWrite=opaque;o.castShadow=opaque;
      }
    });
  }
  function fit() {
    const bounds=replay?.bounds() ?? cadBounds(), target=bounds.getCenter(new THREE.Vector3());
    const radius=bounds.getSize(new THREE.Vector3()).length()/2;
    const half=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
    const direction={iso:[1.1,springStudy?1.8:-1.8,.85],side:[0,springStudy?1:-1,.001],front:[1,0,.001]}[cameraMode];
    camera.position.copy(target).addScaledVector(new THREE.Vector3(...direction).normalize(),radius/Math.sin(half)*1.08);controls.target.copy(target);controls.update();
  }
  for(const side of ['left','right']) $(side).oninput=pose;
  $('both').oninput=()=>{$('left').value=$('right').value=$('both').value;pose();};
  document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>{for(const id of ['both','left','right'])$(id).value=layout.poses[b.dataset.pose].hip_rad;pose();fit();});
  document.querySelectorAll('[data-display]').forEach(b=>b.onclick=()=>{display=b.dataset.display;document.querySelectorAll('[data-display]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.display===display)));const url=new URL(location.href);url.searchParams.set('view',display);history.replaceState(null,'',url);pose();if(driveStudy)fit();});
  document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{cameraMode=b.dataset.camera;document.querySelectorAll('[data-camera]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.camera===cameraMode)));fit();});
  $('fit').onclick=fit;
  const resize=()=>{renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();fit();};
  document.querySelectorAll('[data-display]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.display===display)));
  pose();resize();new ResizeObserver(resize).observe(viewport);$('load-status').hidden=true;
  renderer.setAnimationLoop(now=>{if(replay?.tick(now))pose();controls.update();renderer.render(scene,camera);});
  if (outputStudy) {
    $('replay-status').textContent='Loading the current V2 simulation recordings…';
    try {
      replay = await nativeReplay(scene, refit=>{pose();if(refit)fit();}, camera, controls);
      $('physics-view').hidden=false;
      $('motion-controls').hidden=false;
      $('replay-status').textContent='';
      document.querySelector('.sidebar-footer').textContent='Current V2 CAD + programmed MuJoCo experiments';
      $('fit-evidence').nextSibling.textContent = ' Gear tooth phase, input and compound torque connections, body closure, tolerances, fastening and strength remain unfinished. Manual poses are prescribed; the motion dropdown contains separately recorded V2 experiments.';
      document.querySelector('.fine-print').textContent='The wider body gives the D435i and its USB cable room. This layout exceeds the former 180 mm folded-width target. The current programmed jump remains below the 250 mm target.';
      replay.choose(query.get('motion') ?? 'jump', !matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (error) {
      if (display==='physics') {display='enclosed';document.querySelectorAll('[data-display]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.display===display)));pose();}
      $('replay-status').textContent=error.message;
      console.warn(error);
    }
  }
} catch(error) { $('load-status').textContent=error.message;$('load-status').classList.add('error');console.error(error); }

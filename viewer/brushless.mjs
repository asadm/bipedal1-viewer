import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {pose as basePose,leg as baseLeg} from '../concept06/kinematics.mjs';
import {pose as internalPose,leg as internalLeg} from '../concept06/internal-kinematics.mjs';
import {pose as oldPose} from '../concept05-study/kinematics.mjs';
const $=id=>document.getElementById(id),canvas=$('model-canvas'),viewport=canvas.parentElement;
try{
 const query=new URLSearchParams(location.search),internalValidation=location.pathname.endsWith('/validation.html'),internalFull=internalValidation||location.pathname.endsWith('/internal.html'),wheelpods=internalFull||location.pathname.endsWith('/wheelpods.html'),kinematicOnly=wheelpods&&!internalValidation,driving=(!wheelpods||internalValidation)&&query.get('run')==='drive';
 const pose=internalFull?internalPose:basePose,leg=internalFull?internalLeg:baseLeg;
 const driveCases=internalValidation?['cruise','fast','target_20kmh','resistance']:['cruise','limit','overlimit','resistance'];
 const driveCase=driveCases.includes(query.get('case'))?query.get('case'):'cruise';
 const jumpCase=internalValidation&&['combined_adverse','short_launch_nominal','short_launch_delayed','state_delay_5ms_noise_0_2deg'].includes(query.get('case'))?query.get('case'):'jump';
 const recordingRoot=internalValidation?`../concept06/output/internal-validation/${driving?'driving/'+driveCase:jumpCase}`:driving?`../concept06/output/driving/${driveCase}`:'../concept06/output/jump';
 const replayStart=driving?0:.65;
 const streamlined=wheelpods||location.pathname.endsWith('/streamlined.html');
 const cadRoot='../concept06/output/'+(internalFull?'internal-full':wheelpods?'wheelpods':streamlined?'exterior':'cad');
 const urls=[recordingRoot+'/trajectory.json',cadRoot+'/parts.json',recordingRoot+'/geoms.json',cadRoot+'/manifest.json',internalValidation?'../concept06/output/internal-validation/'+(driving?'driving/':'')+'suite.json':driving?'../concept06/output/driving/sweep.json':'../concept06/output/jump/sensitivity.json',internalFull?'../concept06/output/wheelpods/parts.json':wheelpods?'../concept06/output/exterior/parts.json':streamlined?'../concept06/output/exterior-wide/parts.json':'../concept05-study/output/cad/parts.json',streamlined?'../concept06/output/jump/parameters.json':'../concept05-study/output/jump/parameters.json'];
 const [record,parts,geoms,manifest,sensitivity,oldParts,oldP]=await Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Cannot load ${url} (${r.status})`);return r.json();}));
 const p=structuredClone(internalFull&&!internalValidation?manifest.parameters:record.parameters),report=record.report,frames=record.frames,stroke=p.geometry.vertical_stroke_mm;
 if(streamlined)p.spring.seat_y_from_leg_m=internalFull?.0295:.0265;
 if(internalFull)for(const id of ['height','left-height','right-height'])$(id).max=stroke;
 const rideHeight=leg(p.geometry,p.geometry.q_low_rad).E[1]-leg(p.geometry,p.nominal_q_rad).E[1],chartStart=driving?0:.8,chartEnd=driving?frames.at(-1).t:2.2;
 if(driving){
  document.title='Beni / MuJoCo driving test';
  document.querySelector('h1').textContent='Drive. Balance. Brake.';
  document.querySelector('.intro').textContent=`Recorded MuJoCo test: ${report.target_speed_m_s.toFixed(2)} m/s command, ${report.voltage_V.toFixed(1)} V battery, ${report.resistance_N.toFixed(1)} N assumed resistance. The existing Waveshare wheel motors retain their torque and speed limits.`;
  document.querySelector('[aria-label="Demonstration"]').hidden=true;
  if($('driving-link'))$('driving-link').hidden=true;
  document.querySelector('.result span').textContent='m/s mean during cruise';
  $('speed').value='1';
  document.querySelector('.chart>span').textContent='Forward speed · green: actual · orange: command';
  $('clearance-chart').setAttribute('aria-label','Actual and commanded forward speed over time');
  $('clearance-area').setAttribute('fill','none');$('clearance-area').setAttribute('stroke','#b66324');$('clearance-area').setAttribute('stroke-dasharray','4 3');
  const labels={crouch:'Start',takeoff:'Cruise',apex:'Brake',land:'Stopped'};
  document.querySelectorAll('[data-stage]').forEach(b=>{b.hidden=b.dataset.stage==='settle';if(labels[b.dataset.stage])b.textContent=labels[b.dataset.stage];});
  const telemetry=document.createElement('dl');telemetry.className='measurements';telemetry.innerHTML='<div><dt>Forward speed</dt><dd id="drive-speed">—</dd></div><div><dt>Commanded speed</dt><dd id="drive-target">—</dd></div><div><dt>Wheel torque, L / R</dt><dd id="drive-torque">—</dd></div>';
  $('result-detail').after(telemetry);
  const cases=document.createElement('p');cases.className='small-note';cases.innerHTML='<a href="?run=drive&case=cruise">0.80 m/s</a> · <a href="?run=drive&case=limit">Near limit</a> · <a href="?run=drive&case=overlimit">Over limit</a> · <a href="?run=drive&case=resistance">Added resistance</a><br><a href="streamlined.html">Return to design / jump ↗</a>';
  document.querySelector('.intro').after(cases);
  document.querySelector('.sidebar details').innerHTML='<summary>Driving simulation limits</summary><p>Actual recorded dynamics with a moving-reference balance controller. It ramps at 0.30 m/s², commands six seconds at cruise, then brakes and holds position. The tests use one gain schedule and the existing voltage-dependent wheel torque limits.</p><p>Perfect state, assumed mass and losses, flat ground. Added resistance is an explicit test force, not a measured grass or gravel model. Revised exterior mass, inertia and collisions have not been incorporated; the shell follows the original simplified plant. Thermal limits, encoder noise, backlash and real-world balance are unverified.</p><p id="print-note"></p>';
 }
 THREE.Object3D.DEFAULT_UP.set(0,0,1);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#edf1ef');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const camera=new THREE.PerspectiveCamera(37,1,.5,6000);camera.up.set(0,0,1);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=180;controls.maxDistance=2200;
 scene.add(new THREE.HemisphereLight('#ffffff','#91a085',2.5));
 const sun=new THREE.DirectionalLight('#fff9ee',3);sun.position.set(220,-350,700);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-600,right:1000,top:600,bottom:-450,near:1,far:1600});sun.shadow.normalBias=.25;scene.add(sun,sun.target);
 const fill=new THREE.DirectionalLight('#dceaff',1);fill.position.set(-250,150,350);scene.add(fill);
 const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.52,...extra});
 const mesh=(parent,geometry,mat)=>{const m=new THREE.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const floor=mesh(scene,new THREE.PlaneGeometry(5000,5000),material('#e5ebe3',{roughness:1}));floor.position.z=-.3;floor.castShadow=false;
 const grid=new THREE.GridHelper(3000,150,'#aebba8','#c3cec0');grid.rotation.x=Math.PI/2;grid.position.z=.05;grid.material.transparent=true;grid.material.opacity=.28;scene.add(grid);
 // CAD exports duplicate vertices at face boundaries. Smooth shallow seams
 // while retaining actual creases, so a curved shell does not look faceted.
 function shellNormals(source){
  const g=source.toNonIndexed(),pos=g.getAttribute('position'),normals=[],at=new Map(),keys=[];
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<pos.count;i+=3){
   a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1);c.fromBufferAttribute(pos,i+2);
   const n=b.sub(a).cross(c.sub(a)).normalize().clone();
   for(let j=0;j<3;j++){const k=i+j,key=[pos.getX(k),pos.getY(k),pos.getZ(k)].map(v=>Math.round(v*1000)).join(',');keys[k]=key;normals[k]=n;if(!at.has(key))at.set(key,[]);at.get(key).push(n);}
  }
  const result=new Float32Array(pos.count*3),cos=Math.cos(Math.PI/5),sum=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){sum.set(0,0,0);for(const n of at.get(keys[i]))if(normals[i].dot(n)>cos)sum.add(n);sum.normalize().toArray(result,i*3);}
  g.setAttribute('normal',new THREE.BufferAttribute(result,3));source.dispose();return g;
 }
 function robot(data,params,ghost=false){
  const root=new THREE.Group();scene.add(root);const groups={},meshes=[],gears=[];
  for(const part of data){
   if(!groups[part.body]){groups[part.body]=new THREE.Group();root.add(groups[part.body]);}
   let geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.vertices.flat(),3));geometry.setIndex(part.triangles.flat());geometry.computeVertexNormals();
   if(part.material==='shell')geometry=shellNormals(geometry);
   const mat=material(ghost?'#9baa99':new THREE.Color(...part.color),{roughness:part.material==='glass'?.2:part.material==='tire'?.93:.48,metalness:['motor','metal'].includes(part.material)?.3:0});
   if(ghost){mat.transparent=!streamlined;mat.opacity=streamlined?1:.24;mat.depthWrite=streamlined;}
   if(part.material==='light'&&!ghost){mat.emissive.set('#36b7c6');mat.emissiveIntensity=.5;}
   let parent=groups[part.body];
   if(part.motion){const pivot=new THREE.Group();pivot.position.set(...part.motion.origin);parent.add(pivot);geometry.translate(...part.motion.origin.map(v=>-v));parent=pivot;gears.push({pivot,...part.motion});}
   const m=mesh(parent,geometry,mat);m.userData.part=part;m.name=part.name;if(ghost){m.visible=part.skin||part.material==='tire'||part.name.endsWith('_rim');m.castShadow=streamlined;}meshes.push(m);
  }
  return{root,groups,meshes,gears,params};
 }
 const current=robot(parts,p),previous=robot(oldParts,oldP,true);previous.root.visible=false;
 const physics=[];
 for(const g of geoms){
  if(g.body==='world')continue;let geo;const s=g.size.map(v=>v*1000);
  if(g.type===6)geo=new THREE.BoxGeometry(s[0]*2,s[1]*2,s[2]*2);
  else if(g.type===5){geo=new THREE.CylinderGeometry(s[0],s[0],s[1]*2,48);geo.rotateX(Math.PI/2);}
  else if(g.type===7&&g.vertices){geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(g.vertices.flat().map(v=>v*1000),3));geo.setIndex(g.triangles.flat());geo.computeVertexNormals();}
  else if(g.type===3){geo=new THREE.CapsuleGeometry(s[0],s[1]*2,6,20);geo.rotateX(Math.PI/2);}
  else continue;
  const m=mesh(current.groups[g.body],geo,material(new THREE.Color(...g.rgba.slice(0,3))));m.position.set(...g.pos.map(v=>v*1000));m.quaternion.set(g.quat[1],g.quat[2],g.quat[3],g.quat[0]);m.visible=false;physics.push(m);
 }
 const springs=[0,1].map(()=>{
  const group=new THREE.Group();current.root.add(group);const pts=[];
  for(let j=0;j<=160;j++){const t=j/160;pts.push(new THREE.Vector3(t*50,4.8*Math.cos(t*Math.PI*16),4.8*Math.sin(t*Math.PI*16)));}
  const coil=mesh(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,1.2,8,false),material('#c9a247',{metalness:.4}));
  const rod=mesh(group,new THREE.CylinderGeometry(1.6,1.6,1,16),material('#8e9d98',{metalness:.5}));rod.rotation.z=-Math.PI/2;
  const capA=mesh(group,new THREE.CylinderGeometry(6,6,2,24),material('#638477')),capB=mesh(group,new THREE.CylinderGeometry(6,6,2,24),material('#638477'));capA.rotation.z=capB.rotation.z=Math.PI/2;
  return{group,coil,rod,capA,capB};
 });
 const blocks=[0,1].map(()=>mesh(current.root,new THREE.BoxGeometry(110,40,1),material('#b2bfa3',{roughness:1})));
 const oldBlocks=[0,1].map(()=>mesh(previous.root,new THREE.BoxGeometry(110,40,1),material('#c5d0bf',{transparent:true,opacity:.4})));
 let mode='jump',display='cad',playing=false,cycling=false,time=.65,last=performance.now(),frame=null,trackedX=0,cycleTime=0,turning=false,wheelAngle=0;
 const comparison=()=>mode==='pose'&&$('compare').checked;
 function apply(robot,f){
  for(const[name,tr]of Object.entries(f.bodies)){const g=robot.groups[name];if(!g)continue;g.position.set(...tr.pos.map(v=>v*1000));g.quaternion.set(tr.quat[1],tr.quat[2],tr.quat[3],tr.quat[0]);}
  const angles=f.angles||[f.qpos[7],f.qpos[11]];
  for(const g of robot.gears){
   if(g.kind==='wheel'){
    const w=f.bodies[g.side+'_wheel'].quat,l=f.bodies[g.side+'_lower'].quat;
    const relative=2*Math.atan2(w[2],w[0])-2*Math.atan2(l[2],l[0])+wheelAngle;
    g.pivot.rotation.y=relative*g.ratio;
   }else g.pivot.rotation.y=(angles[g.side==='left'?0:1]-robot.params.nominal_q_rad)*g.ratio;
  }
  if(wheelpods&&robot===current)for(const side of ['left','right'])robot.groups[side+'_wheel'].rotateY(wheelAngle);
 }
 function applyBlocks(items,f,visible){
  for(let i=0;i<2;i++){const h=(f.blocks?.[i]||0)*1000,w=f.bodies[(i?'right':'left')+'_wheel'].pos;items[i].visible=visible&&h>.1;items[i].scale.z=Math.max(.1,h);items[i].position.set(w[0]*1000,w[1]*1000,h/2);}
 }
 function attitude(q){const[w,x,y,z]=q;return[Math.atan2(2*(x*z+w*y),1-2*(x*x+y*y)),Math.atan2(2*(y*z+w*x),1-2*(x*x+y*y))].map(v=>v*180/Math.PI);}
 function update(f){
  frame=f;apply(current,f);applyBlocks(blocks,f,mode==='pose');
  for(let i=0;i<2;i++){
   const [aa,bb]=f.spring_seats[i],a=new THREE.Vector3(...aa.map(v=>v*1000)),b=new THREE.Vector3(...bb.map(v=>v*1000)),v=b.clone().sub(a),length=v.length(),s=springs[i];
   if(streamlined&&!internalValidation&&mode==='jump'){const q=f.bodies.chassis.quat,shift=new THREE.Vector3(0,(i?-1:1)*-4.5,0).applyQuaternion(new THREE.Quaternion(q[1],q[2],q[3],q[0]));a.add(shift);b.add(shift);}
   s.group.position.copy(a);s.group.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),v.normalize());s.coil.scale.x=Math.min(50,length)/50;s.rod.position.x=length/2;s.rod.scale.y=length;s.capB.position.x=length;
   const side=i?'right':'left',compression=f.compression_m[i]*1000;$('spring-'+side).value=compression;$('spring-'+side+'-value').textContent=`${compression.toFixed(1)} mm`;
  }
  if(internalValidation&&$('guide-force'))$('guide-force').textContent=f.loads?['left','right'].map(side=>f.loads[side+'_guide_N'].toFixed(0)).join(' / ')+' N':'—';
  $('energy').textContent=`${(f.compression_m.reduce((s,c)=>s+.5*p.spring.rate_N_m*c*c,0)).toFixed(2)} J`;
  $('currents').textContent=mode==='pose'?'Not simulated':f.current_A.map(v=>Math.abs(v).toFixed(1)).join(' / ')+' A';
  $('attitude').textContent=mode==='pose'?'Held level':attitude(f.bodies.chassis.quat).map(v=>v.toFixed(1)+'°').join(' / ');
  $('clearance').textContent=mode==='pose'?'On supports':`${Math.max(0,Math.min(...f.wheel_clearance_m)*1000).toFixed(1)} mm`;
  $('contact').textContent=mode==='pose'?'Prescribed pose':f.body_contact?'Body contact':f.grounded.every(v=>!v)?'Both wheels airborne':'Wheel contact';
  if(driving){$('drive-speed').textContent=`${f.speed_m_s.toFixed(3)} m/s · ${(f.speed_m_s*3.6).toFixed(2)} km/h`;$('drive-target').textContent=`${f.target_speed_m_s.toFixed(2)} m/s`;$('drive-torque').textContent=f.ctrl.slice(0,2).map(v=>v.toFixed(3)).join(' / ')+' N·m';}
  const phases={balance:'Balance',crouch:'Crouch',load:'Spring loading',push:'Motor push',flight:'Flight',prepare_landing:'Prepare touchdown',landing:'Landing compliance',extension_brake:'Extension braking',recovery:'Recover ride height',pose:'Travel inspection'};$('phase').textContent=phases[f.phase]||f.phase;
  if(mode==='jump'){
   $('timeline').value=time;$('time-output').textContent=`${time.toFixed(3)} s`;const cursor=(time-chartStart)/(chartEnd-chartStart)*280;$('chart-cursor').setAttribute('x1',cursor);$('chart-cursor').setAttribute('x2',cursor);$('chart-cursor').style.visibility=time>=chartStart&&time<=chartEnd?'visible':'hidden';
   // Follow translation, preserving the user's orbit direction and zoom.
   const x=f.bodies.chassis.pos[0]*1000,dx=x-trackedX;camera.position.x+=dx;controls.target.x+=dx;trackedX=x;
   if(driving){floor.position.x=x;grid.position.x=Math.floor(x/200)*200;sun.position.x=x+220;sun.target.position.x=x;}
  }
 }
 function show(t){time=Math.max(frames[0].t,Math.min(frames.at(-1).t,t));const i=Math.max(0,Math.min(frames.length-1,Math.round((time-frames[0].t)/.005)));update(frames[i]);}
 function showPose(){
  const heights=['left','right'].map(side=>{const v=Number($(side+'-height').value);$(side+'-output').textContent=`${v.toFixed(1)} mm`;return v;});
  $('height-output').textContent=$('independent').checked?'Independent':`${heights[0].toFixed(1)} mm`;
  update(pose(p,heights));
  const compare=comparison();current.root.position.y=compare?-150:0;previous.root.position.y=150;previous.root.visible=compare;
  if(compare){const old=(wheelpods?pose:oldPose)(oldP,heights.map(h=>h/stroke*oldP.geometry.vertical_stroke_mm));apply(previous,old);applyBlocks(oldBlocks,old,true);}
  $('new-label').hidden=$('old-label').hidden=!compare;
 }
 function play(v){playing=v;$('play').textContent=v?'Pause':'Play';}
 function cycle(v){cycling=v;$('cycle').textContent=v?'Stop cycling':'Cycle travel';}
 function independent(v){$('independent').checked=v;$('independent-controls').hidden=!v;$('height').disabled=v;}
 function view(name='iso'){
  if(name==='knee'&&internalFull){
   const c=frame.bodies.right_lower.pos;
   controls.target.set(c[0]*1000-15,c[1]*1000+current.root.position.y-20,c[2]*1000+30);
   camera.position.copy(controls.target).add(new THREE.Vector3(115,-315,95));controls.update();return;
  }
  if(name==='wheel'&&wheelpods){
   const w=frame.bodies.right_wheel.pos;
   controls.target.set(w[0]*1000-8,w[1]*1000+current.root.position.y+18,w[2]*1000+5);
   camera.position.copy(controls.target).add(new THREE.Vector3(105,-255,95));controls.update();return;
  }
  const compare=comparison(),directions={iso:compare?[1,-.75,.7]:[1,-1.45,.8],side:[0,-1,.05],front:[1,0,.1],back:[-1,-.7,.4]};
  const x=mode==='jump'&&frame?frame.bodies.chassis.pos[0]*1000:0;trackedX=x;controls.target.set(x+20,0,streamlined&&mode==='pose'?95+Number($('left-height').value)/2:155);
  camera.position.copy(controls.target).addScaledVector(new THREE.Vector3(...directions[name]).normalize(),Math.max(compare?1120:790,(compare?850:630)/camera.aspect));controls.update();
 }
 function setMode(value){
  mode=kinematicOnly?'pose':value;play(false);cycle(false);document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('replay-controls').hidden=mode!=='jump';$('pose-controls').hidden=mode!=='pose';
  if(mode==='pose')showPose();else{current.root.position.y=0;previous.root.visible=false;$('new-label').hidden=$('old-label').hidden=true;show(replayStart);}
  $('caption').textContent=internalValidation&&mode==='jump'?'Current CAD / MuJoCo replay · hardware validation failed':driving?'MuJoCo driving recording · shell mass unverified':mode==='pose'?'Kinematic inspection · balance not simulated':(streamlined?'Original drive replay · new shell not re-simulated':'MuJoCo recording · hardware untested');view();
 }
 function setDisplay(value){
  display=kinematicOnly&&value==='physics'?'cad':value;document.querySelectorAll('[data-display]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.display===display)));
  for(const m of current.meshes){m.visible=display!=='physics';const part=m.userData.part,ghost=display==='ghost'&&(part.skin||(wheelpods&&(part.material==='tire'||part.name.endsWith('_rim'))));m.material.transparent=ghost;m.material.opacity=ghost?.09:1;m.material.depthWrite=!ghost;m.material.needsUpdate=true;m.castShadow=!ghost;if(display==='ghost'&&['glass','light'].includes(part.material))m.visible=false;}
  physics.forEach(m=>m.visible=display==='physics');
  $('part-note').textContent=display==='physics'?'Simplified MuJoCo collision geometry. Internal assembly collisions are not simulated.':display==='ghost'?'Two SunnySky X2216 V3 motors → 20:1 gears → hip cranks. Gold springs sit behind the outer thigh faces; the narrow inboard links guide the knees.': (streamlined?'Tapered structural arms shield the springs in recessed rear pockets. The dark guide links move behind the thighs. No extra covers or actuators; flexible seals and landing strength remain unqualified.':'Concept 06 · lighter brushless hip motors and enclosed wheel drives. Mounting, strength and sealing still need engineering.');
  if(wheelpods)$('part-note').textContent=display==='ghost'?'Round V2806 motor → metal shaft adapter → 20T pinion → 100T wheel gear. Two bearings support the wheel axle. Gear motion is kinematic; attachment and loads need engineering.':'The motor and 5:1 reduction share one rounded lower-leg pod. Main housing: 38.5 mm thick. The inboard knee guide is retained pending an internal-link redesign.';
  if(internalFull)$('part-note').textContent=display==='ghost'?'Green: concealed steel guide. Orange: angled knee cheeks. Grey: fixed hip carrier and 8 mm knee shaft. Gold: springs, shifted outward to clear the mechanism.':'Full robot with enclosed passive knee links and round 5:1 wheel drives. The tall body-anchor ears are removed. Assembly, sealing and load qualification remain open.';
  if(internalValidation&&display==='physics')$('part-note').textContent='Actual MuJoCo ground-contact geometry: convex exterior hulls and tire cylinders. Internal self-contact, compliance and material strength are not simulated.';
 }
 function preset(name){
  cycle(false);const values={low:[0,0],ride:[rideHeight,rideHeight],high:[stroke,stroke],split:[20,75]}[name];independent(name==='split');$('left-height').value=values[0];$('right-height').value=values[1];$('height').value=values[0];showPose();
 }
 const airborne=frames.filter(f=>f.t>=report.takeoff_s&&f.t<=report.landing_s),apex=airborne.reduce((best,f)=>Math.min(...f.wheel_clearance_m)>Math.min(...best.wheel_clearance_m)?f:best,airborne[0]||frames[0]);
 const crouched=frames.filter(f=>f.t>.8&&f.t<1.32).reduce((best,f)=>f.compression_m[0]>best.compression_m[0]?f:best,frames[0]);
 $('result-stat').textContent=driving?report.mean_cruise_speed_m_s?.toFixed(3)||'—':report.first_flight_wheel_clearance_mm.toFixed(0);$('result-detail').textContent=driving?`${report.nominal_model_pass?'Tracking and stopping checks pass.':'This command fails the driving checks.'} Peak ${report.peak_speed_m_s.toFixed(3)} m/s. ${report.stopped_early_reason?'Run stopped: '+report.stopped_early_reason+'.':''}`:`${(report.first_flight_time_s*1000).toFixed(0)} ms airborne · ${report.com_ballistic_rise_mm.toFixed(0)} mm COM rise. 250 mm remains the target.`;
 $('mass').textContent=`${p.mass_kg.toFixed(2)} kg (${streamlined?'reference model':'assumed'})`;$('timeline').max=frames.at(-1).t;
 const failures=sensitivity.reports.filter(r=>!r.nominal_model_pass).length;
 $('validation-note').textContent=`${report.nominal_model_pass?'Nominal jump, landing and recovery checks pass.':'This replay has failing checks; see the report.'} ${failures}/${sensitivity.reports.length} uncertainty/timestep cases fail. This is a simulation result, not a demonstrated hardware jump.`;
 if(streamlined){
  $('validation-note').textContent='The original drivetrain passes 14/14 nominal and individual-variation checks. This new exterior uses its recorded motion; revised mass, inertia and body contacts are not yet simulated.';
  const slim=manifest.covered_leg_design;
  $('exterior-metrics').textContent=`${manifest.printed_parts.length} printed pieces, same four motors. ${slim.thigh_profile_area_reduction_percent?`${slim.thigh_profile_area_reduction_percent.toFixed(0)}% smaller thigh side profile. `:''}One spring-post slit per inner lid; the guide links need no sweeping cover slots.`;
 }
 if(driving){
  $('validation-note').textContent=`${report.nominal_model_pass?'This case passes.':'This case fails.'} Failed checks: ${Object.entries(report.checks).filter(([,v])=>!v).map(([k])=>k.replaceAll('_',' ')).join(', ')||'none'}. The sweep includes deliberately unattainable commands. These are model results, not hardware speed ratings.`;
  const link=document.querySelector('a[href="../concept06/output/jump/report.json"]');if(link){link.href=recordingRoot+'/report.json';link.textContent='Recorded driving report ↗';}
 }
 if(wheelpods){
  $('exterior-metrics').textContent=`${manifest.printed_parts.length} printed pieces · 38.5 mm main pod vs 49 mm previous box · same four motors.`;
  $('validation-note').textContent=`${manifest.checks.filter(c=>c.passed).length}/${manifest.checks.length} sampled packaging checks pass. This page demonstrates geometry and gear motion. The new wheel drive has not been simulated or built.`;
  $('mass').textContent='To be recalculated';
  $('turn-gears').onclick=()=>{turning=!turning;$('turn-gears').textContent=turning?'Stop gears':'Turn gears';$('turn-gears').setAttribute('aria-pressed',String(turning));};
 }
 if(internalFull){
  $('mass').innerHTML='<a href="validation.html">CAD estimate + results ↗</a>';
  $('exterior-metrics').textContent=`${manifest.printed_parts.length} printed pieces · four motors · ${stroke.toFixed(1)} mm travel · concealed passive guides.`;
  $('validation-note').textContent=`${manifest.checks.filter(c=>c.passed).length}/${manifest.checks.length} sampled packaging checks pass. This is the integrated kinematic CAD. Jump dynamics, mounts, strength and sealing remain unqualified.`;
 }
 if(internalValidation){
  $('mass').textContent=`${p.mass_kg.toFixed(2)} kg (CAD estimate)`;
  if($('guide-peak'))$('guide-peak').textContent=report.peak_loads?Math.max(...['left','right'].map(side=>report.peak_loads[side+'_guide_N'])).toFixed(0)+' N':'—';
  $('exterior-metrics').textContent='Current geometry + mass/inertia + V2806 motors in MuJoCo. Hardware release: FAIL.';
  $('validation-note').textContent=driving?`${report.nominal_model_pass?'Driving checks pass':'Driving checks fail'} for this assumed flat-ground model. Strength, sealing and hardware speed remain unqualified.`:`${sensitivity.dynamics_pass_count}/${sensitivity.total_cases} dynamics cases pass excluding the body-level requirement. This replay ${report.dynamics_pass_excluding_body_level?'jumps, lands and recovers':'has dynamics failures'}. Full acceptance fails; the body settles at ${report.final_pitch_deg.toFixed(1)}°. See the report for structural and sealing failures.`;
  if(!driving)$('result-detail').textContent=`${(report.first_flight_time_s*1000).toFixed(0)} ms airborne · ${report.com_ballistic_rise_mm.toFixed(0)} mm COM rise · hardware untested`;
  if(!driving&&jumpCase.startsWith('short_launch_'))$('validation-note').textContent='Shorter launch: nominal and 5 ms delayed/noisy follow-up cases pass the dynamics checks excluding body level. Only these two cases were tested with this trajectory. The full uncertainty campaign has not been repeated; hardware acceptance still fails.';
  if(driving){
   document.querySelector('.intro').textContent=`Current internal-knee robot, V2806 wheel motors, ${p.mass_kg.toFixed(2)} kg estimated mass. Recorded ${report.target_speed_m_s.toFixed(2)} m/s command with ${report.resistance_N.toFixed(1)} N assumed resistance. No aerodynamic or thermal model.`;
   const links=document.querySelector('.intro').nextElementSibling;
   links.innerHTML='<a href="?run=drive&case=cruise">0.8 m/s</a> · <a href="?run=drive&case=fast">2 m/s</a> · <a href="?run=drive&case=target_20kmh">20 km/h model</a> · <a href="?run=drive&case=resistance">Resistance</a><br><a href="validation.html">Current jump + validation ↗</a>';
   document.querySelector('.sidebar details').innerHTML='<summary>Driving model limits</summary><p>CAD-derived estimated mass/inertia, closed internal linkages and outer hulls for ground contacts. Current- and voltage-limited V2806 model. Perfect state, flat ground, assumed losses and explicit resistance; no aerodynamic, motor-temperature or physical-hardware validation.</p><p>The structure and enclosure do not pass the hardware release review.</p><p id="print-note"></p>';
  }
 }
 const maxPrint=Math.max(...manifest.printed_parts.flatMap(r=>r.bounds_mm));$('print-note').textContent=`${manifest.printed_parts.length} printed pieces fit the 170 mm envelope (largest exported axis ${maxPrint.toFixed(1)} mm). Plate fit does not establish strength, support strategy or printability of every internal feature.`;
 const maxClear=driving?Math.max(report.target_speed_m_s,report.peak_speed_m_s,.1):Math.max(1,report.max_both_wheel_clearance_mm),points=frames.filter((f,i)=>i%2===0&&f.t>=chartStart&&f.t<=chartEnd).map(f=>[(f.t-chartStart)/(chartEnd-chartStart)*280,70-Math.max(0,driving?f.speed_m_s:Math.min(...f.wheel_clearance_m)*1000)/maxClear*62]);
 const path=points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+','+y.toFixed(2)).join(' ');$('clearance-line').setAttribute('d',path);$('clearance-area').setAttribute('d',path+' L280,72 L0,72 Z');
 if(driving)$('clearance-area').setAttribute('d',frames.filter((f,i)=>i%2===0).map((f,i)=>(i?'L':'M')+((f.t-chartStart)/(chartEnd-chartStart)*280).toFixed(2)+','+(70-f.target_speed_m_s/maxClear*62).toFixed(2)).join(' '));
 $('play').disabled=$('restart').disabled=$('timeline').disabled=false;
 $('play').onclick=()=>{if(time>=frames.at(-1).t-.01)show(replayStart);play(!playing);};$('restart').onclick=()=>{show(replayStart);play(true);};$('timeline').oninput=()=>{play(false);show(Number($('timeline').value));};
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{play(false);show((driving?{crouch:0,takeoff:report.stage_times_s.cruise,apex:report.stage_times_s.brake,land:frames.at(-1).t}:{crouch:crouched.t,takeoff:report.takeoff_s,apex:apex.t,land:report.landing_s,settle:frames.at(-1).t})[b.dataset.stage]);});
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));document.querySelectorAll('[data-display]').forEach(b=>b.onclick=()=>setDisplay(b.dataset.display));
 $('height').oninput=()=>{cycle(false);$('left-height').value=$('right-height').value=$('height').value;showPose();};
 $('independent').onchange=()=>{cycle(false);independent($('independent').checked);if(!$('independent').checked){$('right-height').value=$('left-height').value;$('height').value=$('left-height').value;}showPose();};
 for(const side of ['left','right'])$(side+'-height').oninput=()=>{cycle(false);showPose();};
 $('compare').onchange=()=>{showPose();view();};$('cycle').onclick=()=>{cycle(!cycling);if(cycling){independent(false);cycleTime=0;}};
 document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>preset(b.dataset.pose));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('fit').onclick=()=>view();
 window.addEventListener('keydown',e=>{if(e.target.matches('input,button,select')||mode!=='jump')return;if(e.code==='Space'){e.preventDefault();play(!playing);}else if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();play(false);show(time+(e.code==='ArrowRight'?.005:-.005));}});
 function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 $('height').value=$('left-height').value=$('right-height').value=internalFull?rideHeight:streamlined?35:rideHeight;
 new ResizeObserver(resize).observe(viewport);resize();setDisplay('cad');setMode(driving||internalValidation?'jump':query.get('mode')==='pose'||(streamlined&&query.get('mode')!=='jump')?'pose':'jump');$('load-status').hidden=true;
 if(query.get('display'))setDisplay(query.get('display'));if(query.get('view'))view(query.get('view'));if(mode==='pose'&&query.get('pose')){preset(query.get('pose'));view(query.get('view')||'iso');}
 if(wheelpods&&query.get('spin')==='1')$('turn-gears').click();
 if(internalFull&&query.get('auto')==='1')$('cycle').click();
 if(mode==='jump'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)play(true);
 function labels(){for(const[id,y,z]of [['new-label',-150,320],['old-label',150,250]]){const v=new THREE.Vector3(0,y,z).project(camera);$(id).style.left=(v.x*.5+.5)*viewport.clientWidth+'px';$(id).style.top=(-v.y*.5+.5)*viewport.clientHeight+'px';}}
 function animate(now){
  const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;
  if(playing&&mode==='jump'){const next=time+dt*Number($('speed').value);show(next);if(next>=frames.at(-1).t)play(false);}
  if(cycling&&mode==='pose'){cycleTime+=dt;const h=(1-Math.cos(cycleTime*Math.PI/3))/2*stroke;$('height').value=$('left-height').value=$('right-height').value=h;showPose();}
  if(turning&&mode==='pose'){wheelAngle+=dt*.7;showPose();}
  controls.update();if(comparison())labels();renderer.render(scene,camera);requestAnimationFrame(animate);
 }
 requestAnimationFrame(animate);
}catch(e){$('load-status').textContent=e.message;console.error(e);}

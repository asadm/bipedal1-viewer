import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {pose} from '../concept04/kinematics.mjs';
const $=id=>document.getElementById(id),canvas=$('model-canvas'),viewport=canvas.parentElement;
try{
 const urls=['../concept04/output/trajectory.json','../concept04/output/uneven/trajectory.json','../concept04/output/cad/parts.json','../concept04/output/geoms.json','../concept04/output/sensitivity.json','../concept04/output/higher/trajectory.json','../concept04/output/higher/sensitivity.json'];
 const loaded=await Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Missing asset: ${url}`);return r.json();}));
 const [baseline,uneven,parts,geoms,sensitivity,higher,higherSensitivity]=loaded,p=baseline.parameters;
 let jump=baseline;const records={jump,uneven};
 THREE.Object3D.DEFAULT_UP.set(0,0,1);const scene=new THREE.Scene();scene.background=new THREE.Color('#edf1ef');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const camera=new THREE.PerspectiveCamera(37,1,.5,5000);camera.up.set(0,0,1);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=180;controls.maxDistance=1800;
 scene.add(new THREE.HemisphereLight('#ffffff','#91a085',2.5));const sun=new THREE.DirectionalLight('#fff9ee',3);sun.position.set(200,-300,650);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-350,right:400,top:400,bottom:-300,near:1,far:1500});sun.shadow.normalBias=.25;scene.add(sun,sun.target);const fill=new THREE.DirectionalLight('#dceaff',1);fill.position.set(-250,120,300);scene.add(fill);
 const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.52,...extra});
 const mesh=(parent,geometry,mat)=>{const m=new THREE.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const floor=mesh(scene,new THREE.PlaneGeometry(3000,3000),material('#e5ebe3',{roughness:1}));floor.position.z=-.2;floor.castShadow=false;const grid=new THREE.GridHelper(1200,60,'#aebba8','#c3cec0');grid.rotation.x=Math.PI/2;grid.position.z=.05;grid.material.transparent=true;grid.material.opacity=.3;scene.add(grid);
 const bodyGroups={};for(const name of Object.keys(jump.frames[0].bodies)){const group=new THREE.Group();scene.add(group);bodyGroups[name]=group;}
 const cadMeshes=[],physicsMeshes=[],movingGears=[];
 for(const part of parts){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.vertices.flat(),3));geometry.setIndex(part.triangles.flat());geometry.computeVertexNormals();
  const mat=material(new THREE.Color(...part.color),{roughness:part.material==='glass'?.2:part.material==='tire'?.93:.48,metalness:['motor','metal'].includes(part.material)?.35:0});if(part.material==='light'){mat.emissive.set('#36b7c6');mat.emissiveIntensity=.5;}
  let parent=bodyGroups[part.body];
  if(part.motion){const pivot=new THREE.Group();pivot.position.set(...part.motion.origin);parent.add(pivot);geometry.translate(...part.motion.origin.map(v=>-v));parent=pivot;movingGears.push({pivot,...part.motion});}
  const m=mesh(parent,geometry,mat);m.userData.part=part;m.name=part.name;cadMeshes.push(m);
 }
 for(const g of geoms){
  if(g.body==='world')continue;let geo;const s=g.size.map(v=>v*1000);
  if(g.type===6)geo=new THREE.BoxGeometry(s[0]*2,s[1]*2,s[2]*2);
  else if(g.type===5){geo=new THREE.CylinderGeometry(s[0],s[0],s[1]*2,48);geo.rotateX(Math.PI/2);}
  else if(g.type===3){geo=new THREE.CapsuleGeometry(s[0],s[1]*2,6,20);geo.rotateX(Math.PI/2);}
  else continue;
  const m=mesh(bodyGroups[g.body],geo,material(new THREE.Color(...g.rgba.slice(0,3))));m.position.set(...g.pos.map(v=>v*1000));m.quaternion.set(g.quat[1],g.quat[2],g.quat[3],g.quat[0]);m.visible=false;physicsMeshes.push(m);
 }
 const springGroups=[];
 for(let i=0;i<2;i++){
  const group=new THREE.Group();scene.add(group);const radius=p.spring.outside_diameter_nominal_m*1000/2-1.1;
  const pts=[];for(let j=0;j<=160;j++){const t=j/160;pts.push(new THREE.Vector3(t*40,radius*Math.cos(t*Math.PI*16),radius*Math.sin(t*Math.PI*16)));}
  const coil=mesh(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,1.1,8,false),material('#cfa852',{metalness:.4}));
  const rod=mesh(group,new THREE.CylinderGeometry(1.8,1.8,1,20),material('#8e9d98',{metalness:.5}));rod.rotation.z=-Math.PI/2;
  const capA=mesh(group,new THREE.CylinderGeometry(6,6,2,32),material('#638477')),capB=mesh(group,new THREE.CylinderGeometry(6,6,2,32),material('#638477'));capA.rotation.z=capB.rotation.z=Math.PI/2;
  springGroups.push({group,coil,rod,capA,capB});
 }
 const blocks=[0,1].map(()=>mesh(scene,new THREE.BoxGeometry(110,40,1),material('#b2bfa3',{roughness:1})));
 let mode='jump',display='cad',playing=false,time=.65,last=performance.now(),frame=null;
 function angle(q){const[w,x,y,z]=q;return{pitch:Math.atan2(2*(x*z+w*y),1-2*(x*x+y*y))*180/Math.PI,roll:Math.atan2(2*(y*z+w*x),1-2*(x*x+y*y))*180/Math.PI};}
 function update(f){
  frame=f;for(const[name,tr]of Object.entries(f.bodies)){const g=bodyGroups[name];if(!g)continue;g.position.set(...tr.pos.map(v=>v*1000));g.quaternion.set(tr.quat[1],tr.quat[2],tr.quat[3],tr.quat[0]);}
  const hipAngles=f.angles||[f.qpos[7],f.qpos[11]];
  for(const g of movingGears)g.pivot.rotation.y=(hipAngles[g.side==='left'?0:1]-p.nominal_q_rad)*g.ratio;
  for(let i=0;i<2;i++){
   const [aa,bb]=f.spring_seats[i],a=new THREE.Vector3(...aa.map(v=>v*1000)),b=new THREE.Vector3(...bb.map(v=>v*1000)),v=b.clone().sub(a),length=v.length(),s=springGroups[i];
   s.group.position.copy(a);s.group.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),v.normalize());s.coil.scale.x=Math.min(50,length)/40;s.rod.position.x=length/2;s.rod.scale.y=length;s.capB.position.x=length;
   const side=i?'right':'left',compression=f.compression_m[i]*1000;$(`spring-${side}`).value=compression;$(`spring-${side}-value`).textContent=`${compression.toFixed(1)} mm`;
   const blockHeight=mode==='pose'?f.blocks[i]*1000:mode==='uneven'&&i===0?15:0;blocks[i].visible=blockHeight>.1;const wheel=f.bodies[side+'_wheel'].pos;
   if(mode==='uneven'){blocks[i].scale.set(800/110,2,Math.max(.1,blockHeight));blocks[i].position.set(0,85,blockHeight/2);}
   else{blocks[i].scale.set(1,1,Math.max(.1,blockHeight));blocks[i].position.set(wheel[0]*1000,wheel[1]*1000,blockHeight/2);}
  }
  const a=angle(f.bodies.chassis.quat);$('roll').textContent=`${a.roll.toFixed(2)}°`;$('pitch').textContent=`${a.pitch.toFixed(2)}°`;$('currents').textContent=mode==='pose'?'Pose only':f.current_A.map(v=>Math.abs(v).toFixed(1)).join(' / ')+' A';$('body-contact').textContent=mode==='pose'?'Not simulated':f.body_contact?'Contact':'Clear';
  const air=f.grounded.every(v=>!v);$('contact').textContent=mode==='pose'?'Prescribed pose':air?'Both wheels airborne':'Wheel contact';
  const phases={balance:'Balance',crouch:'Crouch',load:'Spring loading',push:'Motor push',flight:'Flight',recovery:'Landing + recovery',pose:'Independent leg preview'};$('phase').textContent=phases[f.phase]||f.phase;
  if(mode!=='pose'){$('timeline').value=time;$('time-output').textContent=`${time.toFixed(3)} s`;}
 }
 function show(t){const frames=records[mode].frames;time=Math.max(frames[0].t,Math.min(frames.at(-1).t,t));const i=Math.max(0,Math.min(frames.length-1,Math.round((time-frames[0].t)/.005)));update(frames[i]);}
 function showPose(){const heights=['left','right'].map(side=>{const value=Number($(side+'-height').value);$(side+'-output').textContent=`${value.toFixed(1)} mm`;return value;});update(pose(p,heights));}
 function play(value){playing=value;$('play').textContent=value?'Pause':'Play';}
 function setMode(value){mode=value;play(false);document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('replay-controls').hidden=mode==='pose';$('pose-controls').hidden=mode!=='pose';document.querySelectorAll('[data-stage]').forEach(b=>b.disabled=mode==='uneven');
  $('jump-profile-controls').hidden=mode!=='jump';
  if(mode==='jump'){jump=$('jump-profile').value==='higher'?higher:baseline;records.jump=jump;}
  if(mode==='pose')showPose();else{const r=records[mode].report;$('result-stat').innerHTML=mode==='jump'?`${r.first_flight_wheel_clearance_mm.toFixed(0)} <small>mm wheel clearance</small>`:`15 <small>mm difference under the wheels</small>`;$('result-detail').textContent=mode==='jump'?`${(r.first_flight_time_s*1000).toFixed(0)} ms first flight · ${r.com_ballistic_rise_mm.toFixed(0)} mm COM rise after takeoff`:'Known step height; independently commanded legs keep the body nearly level. This is a stationary balance test.';show(mode==='jump'?.65:0.5);play(!matchMedia('(prefers-reduced-motion: reduce)').matches);}
  const sr=mode==='jump'&&jump===higher?higherSensitivity:sensitivity;
  const failures=sr.reports.filter(r=>!r.nominal_model_pass).length;
  $('caption').textContent=mode==='pose'?'Kinematic inspection · does not prove stability':'MuJoCo trajectory · CAD assembly overlay';$('validation-note').textContent=mode==='pose'?'Each leg has one powered extension coordinate. The knee follows the linkage; there is no separate knee motor.':records[mode].report.nominal_model_pass?`Nominal simulation passes. ${failures}/${sr.reports.length} jump sensitivity cases fail. Hardware and assembly fit remain unqualified; see the results below.`:'This simulation has failing checks. Read the report before using it as a design result.';
 }
 function setDisplay(value){display=value;document.querySelectorAll('[data-display]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.display===display)));for(const m of cadMeshes){m.visible=display!=='physics';const ghost=display==='ghost'&&m.userData.part.skin;m.material.transparent=ghost;m.material.opacity=ghost?.10:1;m.material.depthWrite=!ghost;m.material.needsUpdate=true;m.castShadow=!ghost;if(display==='ghost'&&['glass','light'].includes(m.userData.part.material))m.visible=false;}physicsMeshes.forEach(m=>m.visible=display==='physics');$('part-note').textContent=display==='physics'?'Conservative body/hip ground-contact geometry. Internal part collisions are not simulated.':display==='ghost'?'Actual wheel-motor STEP; dimensioned RS-550 envelopes. Gears and spring guides are development geometry, not a released transmission.':'Component-sized development CAD. Motor/spring selection is concrete; assembly fit, fastening and strength remain unfinished.';}
 function view(name='iso'){const directions={iso:[1,-1.45,.8],side:[0,-1,.05],front:[1,0,.1],back:[-1,-.7,.4]};controls.target.set(25,0,115);camera.position.copy(controls.target).addScaledVector(new THREE.Vector3(...directions[name]).normalize(),Math.max(690,570/camera.aspect));controls.update();}
 $('spring-part').textContent=p.spring.part;$('cost').textContent=`$${p.motor_spring_subtotal_usd.toFixed(2)}`;
 $('jump-profile').options[0].textContent=`${baseline.report.first_flight_wheel_clearance_mm.toFixed(0)} mm · Reference`;
 $('jump-profile').options[1].textContent=`${higher.report.first_flight_wheel_clearance_mm.toFixed(0)} mm · Experimental`;
 $('jump-profile').value=new URLSearchParams(location.search).get('jump')==='higher'?'higher':'baseline';
 $('jump-profile').onchange=()=>setMode('jump');
 for(const id of ['play','restart','timeline'])$(id).disabled=false;
 $('play').onclick=()=>play(!playing);$('restart').onclick=()=>{show(mode==='jump'?.65:0);play(true);};$('timeline').oninput=()=>{play(false);show(Number($('timeline').value));};
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));document.querySelectorAll('[data-display]').forEach(b=>b.onclick=()=>setDisplay(b.dataset.display));
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const r=jump.report,apex=jump.frames.reduce((best,f)=>Math.min(...f.wheel_clearance_m)>Math.min(...best.wheel_clearance_m)?f:best,jump.frames[0]);play(false);show({crouch:1.28,takeoff:r.takeoff_s,apex:apex.t,land:r.landing_s,settle:4.7}[b.dataset.stage]);});
 for(const side of ['left','right'])$(side+'-height').oninput=showPose;
 document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>{const values={low:[0,0],ride:[25,25],high:[50.22685,50.22685],split:[10,40]}[b.dataset.pose];$('left-height').value=values[0];$('right-height').value=values[1];showPose();});
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('fit').onclick=()=>view();
 window.addEventListener('keydown',e=>{if(e.target.matches('input,button,select')||mode==='pose')return;if(e.code==='Space'){e.preventDefault();play(!playing);}else if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();play(false);show(time+(e.code==='ArrowRight'?.005:-.005));}});
 function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(viewport);resize();view();setDisplay('cad');setMode('jump');$('load-status').hidden=true;
 function animate(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(playing&&mode!=='pose'){let next=time+dt*Number($('speed').value);if(next>(mode==='jump'?3.1:4.8))next=mode==='jump'?.65:.25;show(next);}controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);}requestAnimationFrame(animate);
}catch(e){$('load-status').textContent=e.message;console.error(e);}

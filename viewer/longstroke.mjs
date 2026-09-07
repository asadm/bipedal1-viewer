import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {pose,leg} from '../concept05-study/kinematics.mjs';
import {pose as oldPose} from '../concept04/kinematics.mjs';
const $=id=>document.getElementById(id),canvas=$('model-canvas'),viewport=canvas.parentElement;
try{
 const urls=['../concept05-study/output/jump/trajectory.json','../concept05-study/output/cad/parts.json','../concept05-study/output/jump/geoms.json','../concept05-study/output/cad/manifest.json','../concept05-study/output/jump/sensitivity.json','../concept04/output/cad/parts.json','../concept04/output/parameters.json'];
 const [record,parts,geoms,manifest,sensitivity,oldParts,oldP]=await Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Cannot load ${url} (${r.status})`);return r.json();}));
 const p=record.parameters,report=record.report,frames=record.frames,stroke=p.geometry.vertical_stroke_mm;
 const rideHeight=leg(p.geometry,p.geometry.q_low_rad).E[1]-leg(p.geometry,p.nominal_q_rad).E[1],chartStart=.8,chartEnd=2.2;
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
 function robot(data,params,ghost=false){
  const root=new THREE.Group();scene.add(root);const groups={},meshes=[],gears=[];
  for(const part of data){
   if(!groups[part.body]){groups[part.body]=new THREE.Group();root.add(groups[part.body]);}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.vertices.flat(),3));geometry.setIndex(part.triangles.flat());geometry.computeVertexNormals();
   const mat=material(ghost?'#9baa99':new THREE.Color(...part.color),{roughness:part.material==='glass'?.2:part.material==='tire'?.93:.48,metalness:['motor','metal'].includes(part.material)?.3:0});
   if(ghost){mat.transparent=true;mat.opacity=.24;mat.depthWrite=false;}
   if(part.material==='light'&&!ghost){mat.emissive.set('#36b7c6');mat.emissiveIntensity=.5;}
   let parent=groups[part.body];
   if(part.motion){const pivot=new THREE.Group();pivot.position.set(...part.motion.origin);parent.add(pivot);geometry.translate(...part.motion.origin.map(v=>-v));parent=pivot;gears.push({pivot,...part.motion});}
   const m=mesh(parent,geometry,mat);m.userData.part=part;m.name=part.name;if(ghost){m.visible=part.skin||part.material==='tire'||part.name.endsWith('_rim');m.castShadow=false;}meshes.push(m);
  }
  return{root,groups,meshes,gears,params};
 }
 const current=robot(parts,p),previous=robot(oldParts,oldP,true);previous.root.visible=false;
 const physics=[];
 for(const g of geoms){
  if(g.body==='world')continue;let geo;const s=g.size.map(v=>v*1000);
  if(g.type===6)geo=new THREE.BoxGeometry(s[0]*2,s[1]*2,s[2]*2);
  else if(g.type===5){geo=new THREE.CylinderGeometry(s[0],s[0],s[1]*2,48);geo.rotateX(Math.PI/2);}
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
 let mode='jump',display='cad',playing=false,cycling=false,time=.65,last=performance.now(),frame=null,trackedX=0,cycleTime=0;
 const comparison=()=>mode==='pose'&&$('compare').checked;
 function apply(robot,f){
  for(const[name,tr]of Object.entries(f.bodies)){const g=robot.groups[name];if(!g)continue;g.position.set(...tr.pos.map(v=>v*1000));g.quaternion.set(tr.quat[1],tr.quat[2],tr.quat[3],tr.quat[0]);}
  const angles=f.angles||[f.qpos[7],f.qpos[11]];
  for(const g of robot.gears)g.pivot.rotation.y=(angles[g.side==='left'?0:1]-robot.params.nominal_q_rad)*g.ratio;
 }
 function applyBlocks(items,f,visible){
  for(let i=0;i<2;i++){const h=(f.blocks?.[i]||0)*1000,w=f.bodies[(i?'right':'left')+'_wheel'].pos;items[i].visible=visible&&h>.1;items[i].scale.z=Math.max(.1,h);items[i].position.set(w[0]*1000,w[1]*1000,h/2);}
 }
 function attitude(q){const[w,x,y,z]=q;return[Math.atan2(2*(x*z+w*y),1-2*(x*x+y*y)),Math.atan2(2*(y*z+w*x),1-2*(x*x+y*y))].map(v=>v*180/Math.PI);}
 function update(f){
  frame=f;apply(current,f);applyBlocks(blocks,f,mode==='pose');
  for(let i=0;i<2;i++){
   const [aa,bb]=f.spring_seats[i],a=new THREE.Vector3(...aa.map(v=>v*1000)),b=new THREE.Vector3(...bb.map(v=>v*1000)),v=b.clone().sub(a),length=v.length(),s=springs[i];
   s.group.position.copy(a);s.group.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),v.normalize());s.coil.scale.x=Math.min(50,length)/50;s.rod.position.x=length/2;s.rod.scale.y=length;s.capB.position.x=length;
   const side=i?'right':'left',compression=f.compression_m[i]*1000;$('spring-'+side).value=compression;$('spring-'+side+'-value').textContent=`${compression.toFixed(1)} mm`;
  }
  $('energy').textContent=`${(f.compression_m.reduce((s,c)=>s+.5*p.spring.rate_N_m*c*c,0)).toFixed(2)} J`;
  $('currents').textContent=mode==='pose'?'Not simulated':f.current_A.map(v=>Math.abs(v).toFixed(1)).join(' / ')+' A';
  $('attitude').textContent=mode==='pose'?'Held level':attitude(f.bodies.chassis.quat).map(v=>v.toFixed(1)+'°').join(' / ');
  $('clearance').textContent=mode==='pose'?'On supports':`${Math.max(0,Math.min(...f.wheel_clearance_m)*1000).toFixed(1)} mm`;
  $('contact').textContent=mode==='pose'?'Prescribed pose':f.body_contact?'Body contact':f.grounded.every(v=>!v)?'Both wheels airborne':'Wheel contact';
  const phases={balance:'Balance',crouch:'Crouch',load:'Spring loading',push:'Motor push',flight:'Flight',recovery:'Landing + recovery',pose:'Travel inspection'};$('phase').textContent=phases[f.phase]||f.phase;
  if(mode==='jump'){
   $('timeline').value=time;$('time-output').textContent=`${time.toFixed(3)} s`;const cursor=(time-chartStart)/(chartEnd-chartStart)*280;$('chart-cursor').setAttribute('x1',cursor);$('chart-cursor').setAttribute('x2',cursor);$('chart-cursor').style.visibility=time>=chartStart&&time<=chartEnd?'visible':'hidden';
   // Follow translation, preserving the user's orbit direction and zoom.
   const x=f.bodies.chassis.pos[0]*1000,dx=x-trackedX;camera.position.x+=dx;controls.target.x+=dx;trackedX=x;
  }
 }
 function show(t){time=Math.max(frames[0].t,Math.min(frames.at(-1).t,t));const i=Math.max(0,Math.min(frames.length-1,Math.round((time-frames[0].t)/.005)));update(frames[i]);}
 function showPose(){
  const heights=['left','right'].map(side=>{const v=Number($(side+'-height').value);$(side+'-output').textContent=`${v.toFixed(1)} mm`;return v;});
  $('height-output').textContent=$('independent').checked?'Independent':`${heights[0].toFixed(1)} mm`;
  update(pose(p,heights));
  const compare=comparison();current.root.position.y=compare?-150:0;previous.root.position.y=150;previous.root.visible=compare;
  if(compare){const old=oldPose(oldP,heights.map(h=>h/stroke*oldP.geometry.vertical_stroke_mm));apply(previous,old);applyBlocks(oldBlocks,old,true);}
  $('new-label').hidden=$('old-label').hidden=!compare;
 }
 function play(v){playing=v;$('play').textContent=v?'Pause':'Play';}
 function cycle(v){cycling=v;$('cycle').textContent=v?'Stop cycling':'Cycle travel';}
 function independent(v){$('independent').checked=v;$('independent-controls').hidden=!v;$('height').disabled=v;}
 function view(name='iso'){
  const compare=comparison(),directions={iso:compare?[1,-.75,.7]:[1,-1.45,.8],side:[0,-1,.05],front:[1,0,.1],back:[-1,-.7,.4]};
  const x=mode==='jump'&&frame?frame.bodies.chassis.pos[0]*1000:0;trackedX=x;controls.target.set(x+20,0,155);
  camera.position.copy(controls.target).addScaledVector(new THREE.Vector3(...directions[name]).normalize(),Math.max(compare?1120:790,(compare?850:630)/camera.aspect));controls.update();
 }
 function setMode(value){
  mode=value;play(false);cycle(false);document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('replay-controls').hidden=mode!=='jump';$('pose-controls').hidden=mode!=='pose';
  if(mode==='pose')showPose();else{current.root.position.y=0;previous.root.visible=false;$('new-label').hidden=$('old-label').hidden=true;show(.65);}
  $('caption').textContent=mode==='pose'?'Kinematic inspection · balance not simulated':'MuJoCo recording · hardware untested';view();
 }
 function setDisplay(value){
  display=value;document.querySelectorAll('[data-display]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.display===display)));
  for(const m of current.meshes){m.visible=display!=='physics';const ghost=display==='ghost'&&m.userData.part.skin;m.material.transparent=ghost;m.material.opacity=ghost?.09:1;m.material.depthWrite=!ghost;m.material.needsUpdate=true;m.castShadow=!ghost;if(display==='ghost'&&['glass','light'].includes(m.userData.part.material))m.visible=false;}
  physics.forEach(m=>m.visible=display==='physics');
  $('part-note').textContent=display==='physics'?'Simplified MuJoCo collision geometry. Internal assembly collisions are not simulated.':display==='ghost'?'Two RS-550 motors → 24:1 gears → hip cranks. Springs assist extension; the knees follow passive links.': 'Concept 05 · longer linkage and enclosed wheel motors. Mounting, strength and sealing still need engineering.';
 }
 function preset(name){
  cycle(false);const values={low:[0,0],ride:[rideHeight,rideHeight],high:[stroke,stroke],split:[20,75]}[name];independent(name==='split');$('left-height').value=values[0];$('right-height').value=values[1];$('height').value=values[0];showPose();
 }
 const airborne=frames.filter(f=>f.t>=report.takeoff_s&&f.t<=report.landing_s),apex=airborne.reduce((best,f)=>Math.min(...f.wheel_clearance_m)>Math.min(...best.wheel_clearance_m)?f:best,airborne[0]||frames[0]);
 const crouched=frames.filter(f=>f.t>.8&&f.t<1.32).reduce((best,f)=>f.compression_m[0]>best.compression_m[0]?f:best,frames[0]);
 $('result-stat').textContent=report.first_flight_wheel_clearance_mm.toFixed(0);$('result-detail').textContent=`${(report.first_flight_time_s*1000).toFixed(0)} ms airborne · ${report.com_ballistic_rise_mm.toFixed(0)} mm COM rise. 250 mm remains the target.`;
 $('mass').textContent=`${p.mass_kg.toFixed(1)} kg (assumed)`;$('timeline').max=frames.at(-1).t;
 const failures=sensitivity.reports.filter(r=>!r.nominal_model_pass).length;
 $('validation-note').textContent=`${report.nominal_model_pass?'Nominal jump, landing and recovery checks pass.':'This replay has failing checks; see the report.'} ${failures}/${sensitivity.reports.length} uncertainty/timestep cases fail. This is a simulation result, not a demonstrated hardware jump.`;
 const maxPrint=Math.max(...manifest.printed_parts.flatMap(r=>r.bounds_mm));$('print-note').textContent=`${manifest.printed_parts.length} printed pieces fit the 170 mm envelope (largest exported axis ${maxPrint.toFixed(1)} mm). Plate fit does not establish strength, support strategy or printability of every internal feature.`;
 const maxClear=Math.max(1,report.max_both_wheel_clearance_mm),points=frames.filter((f,i)=>i%2===0&&f.t>=chartStart&&f.t<=chartEnd).map(f=>[(f.t-chartStart)/(chartEnd-chartStart)*280,70-Math.max(0,Math.min(...f.wheel_clearance_m)*1000)/maxClear*62]);
 const path=points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+','+y.toFixed(2)).join(' ');$('clearance-line').setAttribute('d',path);$('clearance-area').setAttribute('d',path+' L280,72 L0,72 Z');
 $('play').disabled=$('restart').disabled=$('timeline').disabled=false;
 $('play').onclick=()=>{if(time>=frames.at(-1).t-.01)show(.65);play(!playing);};$('restart').onclick=()=>{show(.65);play(true);};$('timeline').oninput=()=>{play(false);show(Number($('timeline').value));};
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{play(false);show({crouch:crouched.t,takeoff:report.takeoff_s,apex:apex.t,land:report.landing_s,settle:frames.at(-1).t}[b.dataset.stage]);});
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));document.querySelectorAll('[data-display]').forEach(b=>b.onclick=()=>setDisplay(b.dataset.display));
 $('height').oninput=()=>{cycle(false);$('left-height').value=$('right-height').value=$('height').value;showPose();};
 $('independent').onchange=()=>{cycle(false);independent($('independent').checked);if(!$('independent').checked){$('right-height').value=$('left-height').value;$('height').value=$('left-height').value;}showPose();};
 for(const side of ['left','right'])$(side+'-height').oninput=()=>{cycle(false);showPose();};
 $('compare').onchange=()=>{showPose();view();};$('cycle').onclick=()=>{cycle(!cycling);if(cycling){independent(false);cycleTime=0;}};
 document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>preset(b.dataset.pose));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('fit').onclick=()=>view();
 window.addEventListener('keydown',e=>{if(e.target.matches('input,button,select')||mode!=='jump')return;if(e.code==='Space'){e.preventDefault();play(!playing);}else if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();play(false);show(time+(e.code==='ArrowRight'?.005:-.005));}});
 function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 $('height').value=$('left-height').value=$('right-height').value=rideHeight;
 new ResizeObserver(resize).observe(viewport);resize();setDisplay('cad');setMode(new URLSearchParams(location.search).get('mode')==='pose'?'pose':'jump');$('load-status').hidden=true;
 if(mode==='jump'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)play(true);
 function labels(){for(const[id,y,z]of [['new-label',-150,320],['old-label',150,250]]){const v=new THREE.Vector3(0,y,z).project(camera);$(id).style.left=(v.x*.5+.5)*viewport.clientWidth+'px';$(id).style.top=(-v.y*.5+.5)*viewport.clientHeight+'px';}}
 function animate(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(playing&&mode==='jump'){const next=time+dt*Number($('speed').value);show(next);if(next>=frames.at(-1).t)play(false);}
  if(cycling&&mode==='pose'){cycleTime+=dt;const h=(1-Math.cos(cycleTime*Math.PI/3))/2*stroke;$('height').value=$('left-height').value=$('right-height').value=h;showPose();}
  controls.update();if(comparison())labels();renderer.render(scene,camera);requestAnimationFrame(animate);
 }
 requestAnimationFrame(animate);
}catch(e){$('load-status').textContent=e.message;console.error(e);}

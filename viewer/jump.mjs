import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const $=id=>document.getElementById(id),canvas=$('model-canvas'),viewport=canvas.parentElement;
try {
const response=await fetch('../concept03/output/trajectory.json');if(!response.ok)throw Error('Trajectory missing. Run concept03/trial.py --save.');
const data=await response.json(),p=data.parameters,frames=data.frames,r=data.report;
const scene=new THREE.Scene();scene.background=new THREE.Color('#edf1ef');
THREE.Object3D.DEFAULT_UP.set(0,0,1);
const camera=new THREE.PerspectiveCamera(37,1,.5,5000);camera.up.set(0,0,1);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=180;controls.maxDistance=1800;controls.target.set(-60,0,95);
scene.add(new THREE.HemisphereLight('#ffffff','#8a9a83',2.5));const sun=new THREE.DirectionalLight('#fff9ed',3);sun.position.set(180,-250,550);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-400,right:250,top:350,bottom:-300,near:1,far:1500});sun.shadow.normalBias=.25;scene.add(sun);scene.add(sun.target);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.55,...extra});
const bodyMat=mat('#d8e1d7'),armMat=mat('#8fa99a'),tireMat=mat('#273331',{roughness:.95}),orange=mat('#e78634'),gold=mat('#c5a14e',{metalness:.35}),steel=mat('#899b99',{metalness:.7});
function mesh(parent,geo,material,pos=[0,0,0]){const obj=new THREE.Mesh(geo,material);obj.position.set(...pos);obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;}
function box(parent,size,pos,material){return mesh(parent,new THREE.BoxGeometry(...size),material,pos);}
function cylY(parent,radius,length,pos,material){return mesh(parent,new THREE.CylinderGeometry(radius,radius,length,64),material,pos);}
function bar(parent,a,b,radius,material){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const obj=mesh(parent,new THREE.CylinderGeometry(radius,radius,v.length(),24),material,av.clone().add(bv).multiplyScalar(.5).toArray());obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return obj;}
const ground=mesh(scene,new THREE.PlaneGeometry(3000,3000),mat('#e4eae4'),[0,0,-.15]);ground.castShadow=false;const grid=new THREE.GridHelper(1200,60,'#a8b8a6','#c4cec2');grid.rotation.x=Math.PI/2;grid.position.z=.1;grid.material.transparent=true;grid.material.opacity=.32;scene.add(grid);
const root=new THREE.Group();scene.add(root);const body=box(root,[150,104,94],[-14,0,49],bodyMat);const rear=cylY(root,60,96,[-90,0,0],mat('#60796c',{transparent:true,opacity:.36,depthWrite:false}));
const shaft=new THREE.Group();shaft.position.x=p.pivot_x_m*1000;root.add(shaft);cylY(shaft,18,100,[0,0,0],orange);box(shaft,[7,104,32],[0,0,0],orange);
const arms=[],wheels=[],contactDots=[],springGroups=[];
for(const [side,sign] of [['left',1],['right',-1]]){
 const arm=new THREE.Group();arm.position.set(p.pivot_x_m*1000,sign*52,0);root.add(arm);arms.push(arm);bar(arm,[0,0,0],[105,0,0],8,armMat);
 const wheel=new THREE.Group();wheel.position.set(105,sign*23,0);arm.add(wheel);wheels.push(wheel);cylY(wheel,50,30,[0,0,0],tireMat);cylY(wheel,27,30.6,[0,0,0],steel);cylY(wheel,9,32,[0,0,0],orange);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;box(wheel,[3,31.1,8],[43*Math.sin(a),0,43*Math.cos(a)],mat('#43554d')).rotation.y=a;}
 const dot=mesh(scene,new THREE.SphereGeometry(3,16,12),mat('#48a47b'));contactDots.push(dot);
 const cassette=new THREE.Group();cassette.position.y=sign*43;shaft.add(cassette);springGroups.push(cassette);
 box(cassette,[104,14,3],[0,0,48],armMat);box(cassette,[4,14,18],[-53,0,40],steel);box(cassette,[4,14,18],[53,0,40],steel);bar(cassette,[-53,0,41],[53,0,41],2.4,steel);
 const rack=box(cassette,[22,10,14],[0,0,38],orange);cassette.userData.rack=rack;
 const coils=[];
 for(let j=0;j<2;j++){
   const points=[];for(let k=0;k<=128;k++){const t=k/128,angle=t*Math.PI*14;points.push(new THREE.Vector3(t*40,4.7*Math.cos(angle),4.7*Math.sin(angle)));}
   const curve=new THREE.CatmullRomCurve3(points);const coil=mesh(cassette,new THREE.TubeGeometry(curve,160,1.1,7,false),gold);coils.push(coil);
 }
 cassette.userData.coils=coils;cassette.visible=false;
}
// The spring overlay explains the constant-radius coupling used by the plant.
// It is not a checked rack/gear CAD assembly or a simulation collision mesh.
let display='rig',playing=false,time=.75,last=performance.now(),currentIndex=0;
const stageTimes={push:1,takeoff:r.takeoff_s,apex:frames.reduce((best,f)=>Math.min(...f.wheel_clearance_m)>Math.min(...best.wheel_clearance_m)?f:best,frames[0]).t,land:r.landing_s,settle:4.7};
$('peak').innerHTML=`${r.first_flight_wheel_clearance_mm.toFixed(0)} <small>mm wheel clearance</small>`;
$('flight-note').textContent=`${(1000*r.first_flight_time_s).toFixed(0)} ms first flight · ${r.com_ballistic_rise_mm.toFixed(0)} mm COM rise after takeoff`;
$('springs').innerHTML=Array.from({length:4},(_,i)=>`<div class="spring-line"><span>${i<2?'L':'R'}${i%2+1}</span><meter id="spring-${i}" min="0" max="20" low=".5" high="19.5" optimum="10" value="10" aria-label="${i<2?'Left':'Right'} spring ${i%2+1} compression in millimeters"></meter><output id="spring-value-${i}">10 mm</output></div>`).join('');
function showFrame(t){
 time=Math.max(frames[0].t,Math.min(frames.at(-1).t,t));currentIndex=Math.min(frames.length-1,Math.max(0,Math.round((time-frames[0].t)/.005)));const f=frames[currentIndex],q=f.qpos;
 root.position.set(q[0]*1000,q[1]*1000,q[2]*1000);root.quaternion.set(q[4],q[5],q[6],q[3]);shaft.rotation.y=q[7];arms[0].rotation.y=q[8];arms[1].rotation.y=q[10];wheels[0].rotation.y=q[9];wheels[1].rotation.y=q[11];root.updateMatrixWorld(true);
 for(let i=0;i<2;i++){
   const v=wheels[i].getWorldPosition(new THREE.Vector3());contactDots[i].position.set(v.x,v.y,1);contactDots[i].visible=f.grounded[i];
   const x=p.spring.rack_pitch_radius_m*1000*(q[7]-q[i===0?8:10]),c=springGroups[i];c.userData.rack.position.x=-x;
   c.userData.coils[0].position.set(-51,0,41);c.userData.coils[0].scale.set((40-x)/40,1,1);c.userData.coils[1].position.set(11-x,0,41);c.userData.coils[1].scale.set((40+x)/40,1,1);
 }
 const clearance=Math.max(0,Math.min(...f.wheel_clearance_m)*1000),pitch=Math.atan2(2*(q[4]*q[6]+q[3]*q[5]),1-2*(q[4]**2+q[5]**2))*180/Math.PI;
 for(let i=0;i<4;i++){$(`spring-${i}`).value=f.compression_m[i]*1000;$(`spring-value-${i}`).textContent=`${(f.compression_m[i]*1000).toFixed(1)} mm`;}
 $('timeline').value=time;$('time-output').textContent=`${time.toFixed(3)} s`;$('current').textContent=`${Math.abs(f.current_A).toFixed(1)} A`;$('pitch').textContent=`${pitch.toFixed(1)}°`;$('clearance').textContent=`${clearance.toFixed(1)} mm`;
 const air=f.grounded.every(v=>!v);$('contact-tag').textContent=air?'Both wheels airborne':'Wheel contact';$('contact-tag').classList.toggle('contact-off',air);
 $('phase').textContent=f.t<1?'Balance':f.t<1+r.launch_pulse_s?'Motor push':f.t<r.takeoff_s?'Spring release':f.t<r.landing_s?'Flight':f.t<1.6?'Landing + rebound':'Balance recovery';
 $('contact-check').textContent=f.body_contact?'Body touches ground':'Body clear of ground';
 drawChart();
}
const chart=$('height-chart'),ctx=chart.getContext('2d');
function drawChart(){const w=chart.clientWidth,h=90,s=devicePixelRatio;chart.width=w*s;chart.height=h*s;ctx.scale(s,s);ctx.clearRect(0,0,w,h);ctx.strokeStyle='#d1dbd1';ctx.lineWidth=1;for(let v=0;v<=60;v+=20){const y=78-v;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.beginPath();frames.forEach((f,i)=>{const x=f.t/5*w,y=78-Math.max(0,Math.min(...f.wheel_clearance_m)*1000);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.strokeStyle='#477c65';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(time/5*w,4);ctx.lineTo(time/5*w,84);ctx.strokeStyle='#ce8639';ctx.lineWidth=1.5;ctx.stroke();}
function setPlaying(v){playing=v;$('play').textContent=v?'Pause':'Play jump';}
$('play').disabled=false;$('restart').disabled=false;$('timeline').disabled=false;
$('play').onclick=()=>setPlaying(!playing);$('restart').onclick=()=>{showFrame(.75);setPlaying(true);};$('timeline').oninput=()=>{setPlaying(false);showFrame(Number($('timeline').value));};
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{setPlaying(false);showFrame(stageTimes[b.dataset.stage]);});
document.querySelectorAll('[data-display]').forEach(b=>b.onclick=()=>{display=b.dataset.display;document.querySelectorAll('[data-display]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));body.material.transparent=display==='inside';body.material.opacity=display==='inside'?.12:1;body.material.depthWrite=display!=='inside';body.material.needsUpdate=true;rear.visible=display!=='inside';springGroups.forEach(g=>g.visible=display==='inside');$('part-label').textContent=display==='inside'?'SWF12-50: 12 mm OD × 50 mm free length; 5.5 N/mm. Coils/racks illustrate simulated spring travel; hardware fit is not yet checked.':'Collision geometry from the MuJoCo plant. 2.0 kg assumed mass · 100 mm wheels.';});
function view(name='iso'){const dirs={iso:[1,-1.4,.75],side:[0,-1,.15],front:[1,0,.15]};controls.target.set(-60,0,95);const dir=new THREE.Vector3(...dirs[name]).normalize();camera.position.copy(controls.target).addScaledVector(dir,Math.max(650,520/camera.aspect));controls.update();}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('fit').onclick=()=>view();
window.addEventListener('keydown',e=>{if(e.target.matches('input,select,button'))return;if(e.code==='Space'){e.preventDefault();setPlaying(!playing);}else if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();setPlaying(false);showFrame(time+(e.code==='ArrowRight'?.005:-.005));}});
new ResizeObserver(()=>{const {width,height}=viewport.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();drawChart();}).observe(viewport);
const rect=viewport.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();view();showFrame(.75);$('load-status').hidden=true;setPlaying(!matchMedia('(prefers-reduced-motion: reduce)').matches);
function animate(now){const dt=Math.min((now-last)/1000,.1);last=now;if(playing){let next=time+dt*Number($('speed').value);if(next>2.7)next=.75;showFrame(next);}controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);}requestAnimationFrame(animate);
}catch(e){$('load-status').textContent=e.message;console.error(e);}

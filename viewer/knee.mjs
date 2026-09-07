import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {leg as oldLeg} from '../concept06/kinematics.mjs';
const $=id=>document.getElementById(id);
try{
 const response=await fetch('../concept06/output/internal-knee/study.json');if(!response.ok)throw Error('Cannot load mechanism study');
 const data=await response.json(),g=data.geometry,frames=data.frames,a=g.crank_mm,l=g.lower_mm;
 THREE.Object3D.DEFAULT_UP.set(0,0,1);
 const canvas=$('model-canvas'),viewport=canvas.parentElement,scene=new THREE.Scene();scene.background=new THREE.Color('#edf1ef');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const camera=new THREE.PerspectiveCamera(37,1,.1,3000),controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=100;controls.maxDistance=1100;
 scene.add(new THREE.HemisphereLight('#ffffff','#72847a',2.5));const sun=new THREE.DirectionalLight('#fff8e8',3);sun.position.set(50,220,500);scene.add(sun);const fill=new THREE.DirectionalLight('#d9e7ff',1.5);fill.position.set(-200,-200,200);scene.add(fill);
 const mats={shell:new THREE.MeshStandardMaterial({color:'#d4ddd5',roughness:.55,side:THREE.DoubleSide}),lid:new THREE.MeshStandardMaterial({color:'#394b45',roughness:.65,side:THREE.DoubleSide}),metal:new THREE.MeshStandardMaterial({color:'#727e83',metalness:.6,roughness:.4}),guide:new THREE.MeshStandardMaterial({color:'#27876e',metalness:.4,roughness:.4}),lever:new THREE.MeshStandardMaterial({color:'#dc8b39',metalness:.4,roughness:.4}),spring:new THREE.MeshStandardMaterial({color:'#c4a542',metalness:.5,roughness:.35}),shin:new THREE.MeshStandardMaterial({color:'#526a60',roughness:.55}),tire:new THREE.MeshStandardMaterial({color:'#2a332f',roughness:.9}),old:new THREE.MeshStandardMaterial({color:'#b26564',transparent:true,opacity:.65,depthWrite:false})};
 const root=new THREE.Group();scene.add(root);const thigh=new THREE.Group(),lower=new THREE.Group(),guide=new THREE.Group(),spring=new THREE.Group(),oldGuide=new THREE.Group();root.add(thigh,lower,guide,spring,oldGuide);
 const skins=[];
 function mesh(parent,geometry,material){const m=new THREE.Mesh(geometry,material);parent.add(m);return m;}
 function cylinder(parent,x,z,lo,hi,r,mat){const geo=new THREE.CylinderGeometry(r,r,hi-lo,40);const m=mesh(parent,geo,mat);m.position.set(x,(lo+hi)/2,z);return m;}
 function polygon(points){const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));s.closePath();return s;}
 function extrude(parent,shape,lo,hi,mat){const geo=new THREE.ExtrudeGeometry(shape,{depth:hi-lo,bevelEnabled:false,curveSegments:32});geo.rotateX(Math.PI/2);geo.translate(0,hi,0);return mesh(parent,geo,mat);}
 function capsuleShape(A,B,r,holes=[]){const s=new THREE.Shape(),ang=Math.atan2(B[1]-A[1],B[0]-A[0]),nx=-Math.sin(ang),nz=Math.cos(ang);s.moveTo(A[0]+r*nx,A[1]+r*nz);s.lineTo(B[0]+r*nx,B[1]+r*nz);s.absarc(B[0],B[1],r,ang+Math.PI/2,ang-Math.PI/2,true);s.lineTo(A[0]-r*nx,A[1]-r*nz);s.absarc(A[0],A[1],r,ang-Math.PI/2,ang-3*Math.PI/2,true);s.closePath();for(const[x,z,rad]of holes){const h=new THREE.Path();h.absarc(x,z,rad,0,Math.PI*2,false);s.holes.push(h);}return s;}
 function capsule(parent,A,B,r,lo,hi,mat,holes=[]){return extrude(parent,capsuleShape(A,B,r,holes),lo,hi,mat);}
 const outside=polygon(data.profile_mm),inside=polygon(data.inner_profile_mm);outside.holes.push(inside);
 skins.push(extrude(thigh,outside,66,89,mats.shell.clone()));
 skins.push(extrude(thigh,polygon(data.profile_mm),89,91,mats.shell.clone()));
 // This panel deliberately shows only a closure envelope; no seal or swept
 // opening is claimed. Mechanism-only mode removes it entirely.
 skins.push(extrude(thigh,polygon(data.profile_mm),64,66,mats.lid.clone()));
 cylinder(thigh,0,0,58.8,75.5,10.5,mats.metal);cylinder(thigh,0,0,75.5,89,14,mats.shin);
 cylinder(root,0,0,31,92,4,mats.metal);
 cylinder(thigh,a,0,56.5,63,8,mats.shin);
 // The structural spine stays inboard of the guide. A transverse knee web
 // through the guide plane would obstruct the folding motion.
 capsule(thigh,[0,0],[a,0],7,59,63,mats.shin,[[0,0,4.1],[a,0,3.05]]);
 cylinder(thigh,a-43,0,81.5,91,5,mats.shin);
 const B=g.body_pin_mm,H=[B[0]-10,B[1]+5];
 for(const[lo,hi]of [[63.5,66.5],[71.5,74.5]])capsule(root,H,B,5,lo,hi,mats.metal,[[...B,3.05],[...H,2.1]]);
 cylinder(root,H[0],H[1],55,74.5,3.5,mats.metal);
 cylinder(root,B[0],B[1],63.5,76,3,mats.metal);
 capsule(guide,[0,0],[g.tie_mm,0],5,67,71,mats.guide,[[0,0,3.05],[g.tie_mm,0,3.05]]);
 capsule(lower,[0,0],[l,0],7,48,56,mats.shin,[[0,0,3.05],[l,0,4.1]]);
 const d=[g.coupler_mm*Math.cos(g.lever_phase_rad),-g.coupler_mm*Math.sin(g.lever_phase_rad)];
 for(const[lo,hi]of [[63.5,66.5],[71.5,74.5]])capsule(lower,d,[12,0],5,lo,hi,mats.lever,[[...d,3.05],[0,0,3.05],[12,0,2.1]]);
 cylinder(lower,12,0,55,74.5,3.5,mats.lever);cylinder(lower,d[0],d[1],63.5,76,3,mats.metal);cylinder(lower,0,0,48,76,3,mats.metal);
 cylinder(lower,25,0,52,81.5,5.5,mats.shin);
 const wheel=new THREE.Group();root.add(wheel);cylinder(wheel,0,0,60,90,50,mats.tire);cylinder(wheel,0,0,59,91,25,mats.metal);cylinder(wheel,0,0,56,94,6,mats.shin);
 const coilPoints=[];for(let i=0;i<=192;i++){const t=i/192;coilPoints.push(new THREE.Vector3(t*50,4.8*Math.cos(t*Math.PI*16),4.8*Math.sin(t*Math.PI*16)));}
 const coil=mesh(spring,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPoints),192,1.2,8,false),mats.spring);
 const rod=mesh(spring,new THREE.CylinderGeometry(1.6,1.6,1,24),mats.metal);rod.rotation.z=-Math.PI/2;
 const capA=mesh(spring,new THREE.CylinderGeometry(6,6,1.5,32),mats.shin),capB=capA.clone();spring.add(capB);capA.rotation.z=capB.rotation.z=Math.PI/2;
 capsule(oldGuide,[0,0],[data.baseline_geometry.tie_mm,0],6.5,62,68,mats.old,[[0,0,2.6],[data.baseline_geometry.tie_mm,0,2.6]]);
 oldGuide.visible=false;
 const oldPivot=cylinder(root,...[data.baseline_geometry.body_pin_mm[0],data.baseline_geometry.body_pin_mm[1],59,69,4,mats.old]);oldPivot.visible=false;
 const floor=mesh(scene,new THREE.PlaneGeometry(1000,1000),new THREE.MeshStandardMaterial({color:'#e5ebe3',roughness:1}));floor.position.z=-.5;
 const grid=new THREE.GridHelper(1000,50,'#b6c3b4','#d0d9cd');grid.rotation.x=Math.PI/2;grid.position.z=.01;scene.add(grid);
 let index=250,cycling=false,elapsed=0,last=performance.now(),display='cutaway';
 function setDisplay(value){display=value;document.querySelectorAll('[data-display]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.display===value)));for(const m of skins){m.visible=value!=='mechanism';m.material.transparent=value==='cutaway';m.material.opacity=value==='cutaway'?.12:1;m.material.depthWrite=value!=='cutaway';m.material.needsUpdate=true;}}
 function telemetry(){const f=frames[index];$('height-output').textContent=Number($('height').value).toFixed(1)+' mm';$('compression').textContent=f.spring_compression_mm.toFixed(2)+' mm';$('neck').textContent=f.guide_neck_gap_mm.toFixed(2)+' mm';$('wall').textContent=f.guide_wall_gap_mm.toFixed(2)+' mm';$('leverage').textContent=f.effective_lever_mm.toFixed(2)+' mm';$('path-error').textContent=f.wheel_path_change_mm.toFixed(2)+' mm';const F=f.guide_force_bound_N[$('load-case').value];$('force').textContent=Math.round(F)+' N';$('stress').textContent=(F/data.section_screen.net_section_area_mm2).toFixed(1)+' MPa';}
 function update(){
  const h=Number($('height').value),target=frames[0].points.E[1]-h;
  index=frames.reduce((best,f,i)=>Math.abs(f.points.E[1]-target)<Math.abs(frames[best].points.E[1]-target)?i:best,0);
  const f=frames[index],s=f.points;root.position.z=50-s.E[1];thigh.rotation.y=f.q_rad;lower.position.set(s.C[0],0,s.C[1]);lower.rotation.y=f.phi_rad;
  guide.position.set(s.B[0],0,s.B[1]);guide.rotation.y=Math.atan2(-(s.D[1]-s.B[1]),s.D[0]-s.B[0]);
  wheel.position.set(s.E[0],0,s.E[1]);
  const P=new THREE.Vector3(f.spring_P_mm[0],81.5,f.spring_P_mm[1]),Q=new THREE.Vector3(f.spring_Q_mm[0],81.5,f.spring_Q_mm[1]),v=Q.clone().sub(P),length=v.length();spring.position.copy(P);spring.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),v.normalize());coil.scale.x=Math.min(50,length)/50;rod.scale.y=length;rod.position.x=length/2;capB.position.x=length;
  const old=oldLeg(data.baseline_geometry,f.q_rad),ob=data.baseline_geometry.body_pin_mm;oldGuide.position.set(ob[0],0,ob[1]);oldGuide.rotation.y=old.beta;oldGuide.visible=oldPivot.visible=$('compare').checked;telemetry();
 }
 function cycle(value){cycling=value;$('cycle').textContent=value?'Stop cycling':'Cycle travel';}
 function view(name){const dirs={iso:[.55,1,.3],side:[0,1,0],inside:[0,-1,.05],edge:[1,.08,.1],fit:[.55,1,.3]};controls.target.set(-5,69,125);camera.position.copy(controls.target).addScaledVector(new THREE.Vector3(...dirs[name]).normalize(),Math.max(420,350/camera.aspect));controls.update();}
 $('height').max=g.vertical_stroke_mm;$('height').oninput=()=>{cycle(false);update();};$('cycle').onclick=()=>{cycle(!cycling);elapsed=0;};$('compare').onchange=update;$('load-case').onchange=telemetry;
 document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>{cycle(false);$('height').value=b.dataset.pose==='low'?0:g.vertical_stroke_mm;update();});document.querySelectorAll('[data-display]').forEach(b=>b.onclick=()=>setDisplay(b.dataset.display));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
 $('audit-note').textContent=`501 sampled poses: positive guide clearances; maximum spring compression ${data.nominal.max_spring_compression_mm.toFixed(2)} mm. All 200 sampled tolerance variants remain within these limits. This is not a complete collision or tolerance proof.`;
 function labels(){const f=frames[index],p=f.points,points={A:[0,91,0],B:[...p.B],D:[...p.D],guide:[(p.B[0]+p.D[0])/2,(p.B[1]+p.D[1])/2]};for(const[key,point]of Object.entries(points)){const pos=key==='A'?new THREE.Vector3(...point):new THREE.Vector3(point[0],73,point[1]);pos.z+=root.position.z;pos.project(camera);const element=$('label-'+key);element.hidden=!$('labels').checked||pos.z>1;element.style.left=(pos.x*.5+.5)*viewport.clientWidth+10+'px';element.style.top=(-pos.y*.5+.5)*viewport.clientHeight-12+'px';}}
 function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(viewport);resize();setDisplay('cutaway');update();view('iso');$('load-status').hidden=true;
 const query=new URLSearchParams(location.search);if(query.get('display'))setDisplay(query.get('display'));if(query.get('view'))view(query.get('view'));if(query.get('auto')==='1')cycle(true);
 function animate(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(cycling){elapsed+=dt;$('height').value=(1-Math.cos(elapsed*Math.PI/4))/2*g.vertical_stroke_mm;update();}controls.update();labels();renderer.render(scene,camera);requestAnimationFrame(animate);}requestAnimationFrame(animate);
}catch(e){$('load-status').textContent=e.message;console.error(e);}

// Archived rejected rack-leg renderer. No active viewer imports this file.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {pose} from '../concept06/kinematics.mjs';
const $=id=>document.getElementById(id),canvas=$('model-canvas'),viewport=canvas.parentElement;
try {
const get=async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Cannot load ${url}`);return r.json();};
const [oldParts,oldP,study]=await Promise.all([get('../concept06/output/exterior/parts.json'),get('../concept06/output/jump/parameters.json'),get('../simplification/output/study.json')]);
THREE.Object3D.DEFAULT_UP.set(0,0,1);
const scene=new THREE.Scene();scene.background=new THREE.Color('#edf1ef');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(37,1,.5,6000),controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=220;controls.maxDistance=1800;
scene.add(new THREE.HemisphereLight('#fff','#9ca991',2.2));const sun=new THREE.DirectionalLight('#fff9ef',2.8);sun.position.set(180,-300,700);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-550,right:700,top:650,bottom:-450,near:1,far:1800});sun.shadow.normalBias=.4;scene.add(sun);
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.55,...extra});
const shell=material('#b9c7bd'),dark=material('#30463e'),metal=material('#91a49e',{metalness:.45}),gold=material('#b49749',{metalness:.3}),orange=material('#b97935'),black=material('#1c2923',{roughness:.9});
const skins=[],internal=[];
function mesh(parent,geometry,mat,pos=[0,0,0],skin=false){const m=new THREE.Mesh(geometry,mat.clone());m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(skin)skins.push(m);return m;}
function box(parent,size,pos,mat=dark,skin=false){return mesh(parent,new THREE.BoxGeometry(...size),mat,pos,skin);}
function cylinder(parent,r,length,pos,mat=metal,axis='y'){const g=new THREE.CylinderGeometry(r,r,length,40);if(axis==='z')g.rotateX(Math.PI/2);return mesh(parent,g,mat,pos);}
function rounded(parent,size,pos,mat,skin=false){
 const [w,d,h]=size,r=Math.min(10,w/5,h/5),s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
 const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);g.rotateX(Math.PI/2);return mesh(parent,g,mat,pos,skin);
}
const floor=mesh(scene,new THREE.PlaneGeometry(4000,4000),material('#e5ebe3'),[0,0,-.3]);floor.rotation.set(0,0,0);floor.castShadow=false;
const grid=new THREE.GridHelper(3000,150,'#adbaa7','#c1ccbd');grid.rotation.x=Math.PI/2;grid.position.z=.1;grid.material.transparent=true;grid.material.opacity=.25;scene.add(grid);
const root=new THREE.Group();scene.add(root);const body=new THREE.Group();root.add(body);
// These overlapping primitives describe two body-half allocations. They are
// intentionally NOT exported as printable solids or treated as an assembly audit.
rounded(body,[144,108,65],[0,0,2.5],shell,true);
rounded(body,[144,65,40],[0,0,-70],dark,true);
const legs=[],drive=[];
for(const sign of [1,-1]){
 rounded(body,[69,27,155],[-7,sign*45,-42.5],shell,true);
 const rail=box(body,[9,6.5,150],[-24,sign*33.25,-40],metal);internal.push(rail);
 const mx=23-sign*24;
 internal.push(cylinder(body,13.85,34,[mx,sign*1.5,-70],metal));
 const gear=cylinder(body,19,8,[23,sign*24,-70],orange),small=cylinder(body,7,7,[mx,sign*24,-70],orange),pinion=cylinder(body,7,12,[23,sign*46,-70],orange);
 internal.push(gear,small,pinion,cylinder(body,3,45,[23,sign*36,-70],metal));drive.push({gear,small,pinion,sign});
 // Dots are schematic teeth: no involute/rack mesh or tooth-strength claim.
 for(let j=0;j<36;j++){const a=j*2*Math.PI/36,t=box(gear,[1.7,8,2],[18.5*Math.cos(a),0,18.5*Math.sin(a)],orange);t.rotation.y=-a;}
 const leg=new THREE.Group();root.add(leg);
 const carriage=box(leg,[20,10,39.9],[-24,sign*35,110],metal);internal.push(carriage);
 box(leg,[24,4,124],[-24,sign*42,78],dark,true);
 box(leg,[8,12,120],[14,sign*46,75],orange);
 for(let j=0;j<38;j++)box(leg,[2,12,1.6],[19,sign*46,16+j*Math.PI],orange);
 // Faces belong to the same hollow sliding-leg allocation. The front return
 // covers the rack's tooth edge in the enclosed sketch.
 rounded(leg,[66,3,138],[-6,sign*55,71],dark,true);
 rounded(leg,[66,2,138],[-6,sign*39,71],dark,true);
 box(leg,[2,19,138],[26,sign*47,71],dark,true);
 rounded(leg,[69,49,44.4],[-19.3,sign*34.5,0],dark,true);
 const lid=rounded(leg,[68.4,2.4,43.8],[-19.3,sign*8.5,0],dark,true);
 internal.push(cylinder(leg,18.5,58,[-19.3,sign*23,0],metal));
 const wheel=cylinder(leg,50,30,[0,sign*75,0],black);cylinder(leg,24,31,[0,sign*75,0],metal);
 for(let j=0;j<32;j++){const a=j*2*Math.PI/32,lug=box(wheel,[4,28,2],[49*Math.cos(a),0,49*Math.sin(a)],black);lug.rotation.y=-a;}
 const pts=[];for(let j=0;j<=200;j++){const t=j/200;pts.push(new THREE.Vector3(5*Math.cos(t*2*Math.PI*30),5*Math.sin(t*2*Math.PI*30),t*150));}
 const spring=mesh(root,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),240,.5,6,false),gold);internal.push(spring);
 const support=box(root,[100,36,1],[0,sign*75,0],material('#b2bfa3'));
 legs.push({leg,spring,support,sign,lid});
}
// The reference uses its real exported CAD and actual four-bar kinematics.
const previous=new THREE.Group();scene.add(previous);previous.visible=false;const groups={};
for(const part of oldParts){if(!groups[part.body]){groups[part.body]=new THREE.Group();previous.add(groups[part.body]);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.vertices.flat(),3));g.setIndex(part.triangles.flat());g.computeVertexNormals();mesh(groups[part.body],g,material(new THREE.Color(...part.color)));}
let cycling=false,clock=0,last=performance.now(),inside=false;
function update(){
 const heights=[$('left-height'),$('right-height')].map(n=>Number(n.value)),e=Math.max(...heights);body.position.z=150+e;
 $('height-output').textContent=$('independent').checked?'Independent':`${heights[0].toFixed(1)} mm`;
 for(let i=0;i<2;i++){
  const a=legs[i],extension=heights[i],rise=e-extension;a.leg.position.z=50+rise;
  a.support.visible=rise>.1;a.support.scale.z=Math.max(.1,rise);a.support.position.z=rise/2;
  a.spring.position.set(0,a.sign*47,133+rise);a.spring.scale.z=(50+extension)/150;
  const side=i?'right':'left';$(side+'-output').textContent=`${extension.toFixed(1)} mm`;
  drive[i].gear.rotation.y=drive[i].pinion.rotation.y=extension/6;drive[i].small.rotation.y=-3*extension/6;
 }
 $('spring-length').textContent=heights.map(v=>(50+v).toFixed(0)).join(' / ')+' mm';
 const compare=$('compare').checked;root.position.y=compare?-145:0;previous.position.y=145;previous.visible=compare;$('new-label').hidden=$('old-label').hidden=!compare;
 if(compare){const f=pose(oldP,heights.map(v=>v/100*oldP.geometry.vertical_stroke_mm));for(const[name,tr]of Object.entries(f.bodies)){const g=groups[name];if(g){g.position.set(...tr.pos.map(v=>v*1000));g.quaternion.set(tr.quat[1],tr.quat[2],tr.quat[3],tr.quat[0]);}}}
}
function display(value){inside=value==='inside';for(const m of skins){m.material.transparent=inside;m.material.opacity=inside?.08:1;m.material.depthWrite=!inside;m.castShadow=!inside;}internal.forEach(m=>m.visible=inside);document.querySelectorAll('[data-display]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.display===value)));$('part-note').textContent=inside?'Motor → 12:36 reduction → coaxial pinion → vertical rack. A long-stroke spring acts in parallel. Spring SKU, detailed clearances and performance remain unresolved.':'Two body halves and two sliding leg structures provide the enclosure. This is a packaging sketch; joints, fasteners, bearing seats and spring channels are not detailed.';}
function view(name='iso'){const compare=$('compare').checked,dirs={iso:[1,-1.45,.7],side:[0,-1,.05],front:[1,0,.1]};controls.target.set(0,0,150);camera.position.copy(controls.target).addScaledVector(new THREE.Vector3(...(dirs[name]||dirs.iso)).normalize(),Math.max(compare?1100:790,(compare?850:630)/camera.aspect));controls.update();}
function independent(value){$('independent').checked=value;$('independent-controls').hidden=!value;$('height').disabled=value;}
function cycle(value){cycling=value;$('cycle').textContent=value?'Stop cycling':'Cycle travel';}
function preset(name){const values={low:[0,0],ride:[65.7,65.7],high:[100,100],split:[20,75]}[name];if(!values)return;cycle(false);independent(name==='split');$('height').value=$('left-height').value=values[0];$('right-height').value=values[1];update();}
$('height').oninput=()=>{cycle(false);$('left-height').value=$('right-height').value=$('height').value;update();};
for(const side of ['left','right'])$(side+'-height').oninput=()=>{cycle(false);update();};
$('independent').onchange=()=>{cycle(false);independent($('independent').checked);if(!$('independent').checked){$('height').value=$('right-height').value=$('left-height').value;}update();};
$('compare').onchange=()=>{update();view();};$('cycle').onclick=()=>{cycle(!cycling);if(cycling){independent(false);clock=0;}};
document.querySelectorAll('[data-display]').forEach(b=>b.onclick=()=>display(b.dataset.display));document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>preset(b.dataset.pose));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('fit').onclick=()=>view();
function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(viewport);resize();const query=new URLSearchParams(location.search);$('compare').checked=query.get('compare')==='1';preset(query.get('pose')||'ride');display(query.get('display')==='inside'?'inside':'closed');view(query.get('view')||'iso');$('load-status').hidden=true;
function labels(){for(const [id,y] of [['new-label',-145],['old-label',145]]){const v=new THREE.Vector3(0,y,340).project(camera);$(id).style.left=(v.x*.5+.5)*viewport.clientWidth+'px';$(id).style.top=(-v.y*.5+.5)*viewport.clientHeight+'px';}}
function animate(now){const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;if(cycling){clock+=dt;const e=50-50*Math.cos(clock*Math.PI/3);$('height').value=$('left-height').value=$('right-height').value=e;update();}controls.update();if(previous.visible)labels();renderer.render(scene,camera);requestAnimationFrame(animate);}requestAnimationFrame(animate);
}catch(error){$('load-status').textContent=error.message;console.error(error);}

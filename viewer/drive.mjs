import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const $=id=>document.getElementById(id),canvas=$('model-canvas'),viewport=canvas.parentElement;
const rad=Math.PI/180;
try {
  THREE.Object3D.DEFAULT_UP.set(0,0,1);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#edf1ef');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const camera=new THREE.PerspectiveCamera(34,1,1,2000);camera.up.set(0,0,1);
  const controls=new OrbitControls(camera,canvas);controls.target.set(6,0,9);
  controls.enableDamping=!matchMedia('(prefers-reduced-motion: reduce)').matches;controls.dampingFactor=.09;
  controls.minDistance=130;controls.maxDistance=900;
  scene.add(new THREE.HemisphereLight('#ffffff','#a1ad9a',2.5));
  const key=new THREE.DirectionalLight('#fff7ed',3);key.position.set(100,-180,300);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-180,right:180,top:180,bottom:-180,near:5,far:650});
  key.shadow.normalBias=.2;scene.add(key);
  const fill=new THREE.DirectionalLight('#dcecff',1.1);fill.position.set(-160,130,90);scene.add(fill);
  const material=(color,roughness=.45,metalness=.08)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const mats={motor:material('#526967',.38,.45),input:material('#db8a3f'),shaft:material('#8d9f9b',.3,.6),
    output:material('#79a3a5'),spring:material('#c4a354',.3,.6),dark:material('#3c5352'),bearing:material('#c7d0c4')};
  function mesh(geo,mat,parent=scene){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cyl(radius,length,mat,parent=scene){return mesh(new THREE.CylinderGeometry(radius,radius,length,64),mat,parent);}
  function box(size,pos,mat,parent=scene){const m=mesh(new THREE.BoxGeometry(...size),mat,parent);m.position.set(...pos);return m;}
  const floor=mesh(new THREE.PlaneGeometry(1400,1400),material('#e8ece5',1));floor.position.z=-40;floor.receiveShadow=true;
  const grid=new THREE.GridHelper(450,30,'#b6c2b1','#cdd5c7');grid.rotation.x=Math.PI/2;grid.position.z=-39.8;grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);

  // Stylized teeth show meshing and ratio; these are not machinable gear profiles.
  function gear(radius,teeth,mat) {
    const g=new THREE.Group();scene.add(g);cyl(radius-2,5,mat,g);
    for(let i=0;i<teeth;i++){
      const a=i*2*Math.PI/teeth;
      const tooth=box([4.3,5,3.1],[radius*Math.cos(a),0,-radius*Math.sin(a)],mat,g);
      tooth.rotation.y=a;
    }
    const hub=cyl(5.5,8,mats.shaft,g);
    return g;
  }
  const outputGear=gear(30,30,mats.input);
  const pinion=gear(10,10,mats.shaft);pinion.position.z=40;
  const motor=cyl(14,35,mats.motor);motor.position.set(0,23,40);
  const encoder=cyl(9,5,mats.dark);encoder.position.set(0,44,40);
  const motorShaft=cyl(3,13,mats.shaft);motorShaft.position.set(0,3,40);
  // Housing is deliberately omitted for visibility; bearings shown as independent supports.
  const shaftGroup=new THREE.Group();scene.add(shaftGroup);cyl(4.5,112,mats.shaft,shaftGroup);
  box([2,110,1.6],[0,0,4.6],mats.input,shaftGroup);
  const labels=[];
  function label(text,anchor,kind=''){
    const el=document.createElement('div');el.className='part-label '+kind;el.textContent=text;viewport.append(el);
    labels.push({el,anchor:new THREE.Vector3(...anchor)});
  }
  label('Motor + position sensing',[0,28,66]);
  label('Reduction · example 3:1 stage',[-44,-4,13],'orange');
  label('Shared driven shaft',[0,-23,-17],'orange');
  const joints=[];
  for(const [side,sign] of [['Left',1],['Right',-1]]) {
    const input=new THREE.Group();input.position.y=sign*38;scene.add(input);
    cyl(12,3,mats.input,input);box([10,3,2],[7,0,0],mats.dark,input);
    const output=new THREE.Group();output.position.y=sign*58;scene.add(output);
    cyl(13,4,mats.output,output);cyl(6,5,mats.bearing,output);
    box([39,5,8],[27,0,0],mats.output,output);
    const eye=cyl(7,5,mats.output,output);eye.position.x=49;
    const axle=cyl(3.2,7,mats.shaft,output);axle.position.x=49;
    const spring=mesh(new THREE.BufferGeometry(),mats.spring);
    const startTail=mesh(new THREE.BufferGeometry(),mats.spring);
    const endTail=mesh(new THREE.BufferGeometry(),mats.spring);
    joints.push({side,sign,input,output,spring,startTail,endTail});
    label(side+' spring coupling',[0,sign*49,23],'gold');
    label(side+' arm output',[47,sign*61,-14]);
  }
  const phases={
    crouch:{q:-8,twist:3,text:'The motor folds both arms toward the body. The wheel motors maintain balance during the crouch. Springs retain their separate motion.'},
    load:{q:14,twist:22,text:'The driven hubs turn ahead of the arms while the ground resists the wheels. Both springs twist and store energy. There is no release latch in this proposal.'},
    extend:{q:32,twist:4,text:'The motor continues driving while the loaded springs unwind into the arms. The arms push against the ground to accelerate the body upward.'},
    retract:{q:-8,twist:-4,text:'After takeoff, the drive reverses and pulls both arms inward. The reversed spring twist illustrates why the coupling must transmit torque in both directions.'},
  };
  function tube(points,radius=.9){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(12,points.length),radius,8,false);}
  function replaceGeometry(obj,geo){obj.geometry.dispose();obj.geometry=geo;}
  function update(){
    const q=Number($('command').value)*rad,twist=Number($('twist').value)*rad,bump=Number($('bump').value)*rad;
    outputGear.rotation.y=q;pinion.rotation.y=-3*q+Math.PI/10;shaftGroup.rotation.y=q;
    for(const joint of joints){
      const delta=twist+(joint.side==='Left'?bump:0),out=q-delta,s=joint.sign;
      joint.input.rotation.y=q;joint.output.rotation.y=out;
      const points=[];
      for(let i=0;i<=150;i++){
        const t=i/150,a=q+6*Math.PI*t+(out-q)*t;
        points.push(new THREE.Vector3(10*Math.cos(a),s*(42+10*t),-10*Math.sin(a)));
      }
      replaceGeometry(joint.spring,tube(points));
      replaceGeometry(joint.startTail,tube([new THREE.Vector3(10*Math.cos(q),s*38,-10*Math.sin(q)),points[0]]));
      replaceGeometry(joint.endTail,tube([points.at(-1),new THREE.Vector3(10*Math.cos(out),s*58,-10*Math.sin(out))]));
      $(joint.side.toLowerCase()+'-twist').textContent=(delta/rad).toFixed(0)+'°';
    }
    for(const id of ['command','twist','bump'])$(id+'-value').textContent=$(id).value+'°';
  }
  function applyPhase(name){const phase=phases[name];$('command').value=phase.q;$('twist').value=phase.twist;$('bump').value=0;
    $('phase-description').textContent=phase.text;document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.phase===name)));update();}
  document.querySelectorAll('[data-phase]').forEach(b=>b.addEventListener('click',()=>applyPhase(b.dataset.phase)));
  for(const id of ['command','twist','bump'])$(id).addEventListener('input',()=>{
    document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed','false'));
    $('phase-description').textContent='Custom inspection pose. Change one arm’s deflection to see its spring twist change while the shared input and the other arm stay fixed.';update();
  });
  function fit(direction){const extent=Math.max(185,210/Math.max(.4,camera.aspect));const distance=extent/(2*Math.tan(34*rad/2))*1.13;
    const dir=direction||camera.position.clone().sub(controls.target).normalize();controls.target.set(6,0,9);camera.position.copy(controls.target).addScaledVector(dir,distance);camera.lookAt(controls.target);controls.update();}
  function view(name){const vectors={iso:[1,-1.55,.9],front:[0,-1,.15],side:[1,0,.12]};fit(new THREE.Vector3(...vectors[name]).normalize());document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));$('fit-view').addEventListener('click',()=>fit());
  let first=true;
  new ResizeObserver(()=>{camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);if(first){view('iso');first=false;}else fit();}).observe(viewport);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('load-status').hidden=false;$('load-status').textContent='Graphics interrupted. Reload to reconnect.';});
  applyPhase('load');$('load-status').hidden=true;
  function render(){requestAnimationFrame(render);controls.update();renderer.render(scene,camera);
    for(const label of labels){const v=label.anchor.clone().project(camera);label.el.style.left=((v.x+1)/2*viewport.clientWidth)+'px';label.el.style.top=((1-v.y)/2*viewport.clientHeight)+'px';label.el.hidden=v.z>1||v.z< -1;}}
  render();
}catch(error){$('load-status').hidden=false;$('load-status').className='error';$('load-status').textContent=error.message;console.error(error);}

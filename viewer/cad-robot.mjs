import * as THREE from 'three';
import {leg} from '../concept06/internal-kinematics.mjs';
import {springSeats} from './cad-pose.mjs';

// Join normals across CAD face boundaries without rounding sharp design edges.
function shellNormals(source) {
  const g = source.toNonIndexed(), pos = g.getAttribute('position'), normals = [], at = new Map(), keys = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    const n = b.sub(a).cross(c.sub(a)).normalize().clone();
    for (let j = 0; j < 3; j++) {
      const k = i + j, key = [pos.getX(k), pos.getY(k), pos.getZ(k)].map(v => Math.round(v * 1000)).join(',');
      keys[k] = key; normals[k] = n;
      if (!at.has(key)) at.set(key, []);
      at.get(key).push(n);
    }
  }
  const result = new Float32Array(pos.count * 3), cosine = Math.cos(Math.PI / 5), sum = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    sum.set(0, 0, 0);
    for (const n of at.get(keys[i])) if (normals[i].dot(n) > cosine) sum.add(n);
    sum.normalize().toArray(result, i * 3);
  }
  g.setAttribute('normal', new THREE.BufferAttribute(result, 3)); source.dispose(); return g;
}

export function cadRobot(parts, parameters) {
  const root = new THREE.Group(), groups = {}, meshes = [], gears = [];
  for (const part of parts) {
    const group = groups[part.body] ??= new THREE.Group();
    if (!group.parent) root.add(group);
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices.flat(), 3));
    geometry.setIndex(part.triangles.flat()); geometry.computeVertexNormals();
    if (part.material === 'shell') geometry = shellNormals(geometry);
    const material = new THREE.MeshStandardMaterial({color: new THREE.Color(...part.color),
      roughness: part.material === 'glass' ? .2 : part.material === 'tire' ? .93 : .48,
      metalness: ['motor', 'metal'].includes(part.material) ? .3 : 0});
    if (part.material === 'light') { material.emissive.set('#36b7c6'); material.emissiveIntensity = .5; }
    let parent = group;
    if (part.motion) {
      const pivot = new THREE.Group(); pivot.position.set(...part.motion.origin); group.add(pivot);
      geometry.translate(...part.motion.origin.map(v => -v)); parent = pivot;
      gears.push({pivot, ...part.motion});
    }
    const mesh = new THREE.Mesh(geometry, material); mesh.name = part.name; mesh.userData.part = part;
    mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); meshes.push(mesh);
  }
  const springs = [0, 1].map(() => {
    const points = [];
    for (let j = 0; j <= 160; j++) {
      const t = j / 160; points.push(new THREE.Vector3(t * 50, 4.8 * Math.cos(t * Math.PI * 16), 4.8 * Math.sin(t * Math.PI * 16)));
    }
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 160, 1.2, 8, false),
      new THREE.MeshStandardMaterial({color: '#c9a247', metalness: .4, roughness: .4}));
    mesh.castShadow = true; root.add(mesh); return mesh;
  });
  const nominal = leg(parameters.geometry, parameters.nominal_q_rad);
  const relative = (a, b) => {
    const q = a.clone().invert().multiply(b); return 2 * Math.atan2(q.y, q.w);
  };
  function apply(frame) {
    for (const [name, tr] of Object.entries(frame.bodies)) {
      const group = groups[name]; if (!group) continue;
      group.position.set(...tr.pos.map(v => v * 1000));
      group.quaternion.set(tr.quat[1], tr.quat[2], tr.quat[3], tr.quat[0]);
    }
    for (const gear of gears) {
      const angle = gear.kind === 'wheel'
        ? relative(groups[gear.side + '_lower'].quaternion, groups[gear.side + '_wheel'].quaternion) + nominal.phi
        : relative(groups.chassis.quaternion, groups[gear.side + '_upper'].quaternion) - parameters.nominal_q_rad;
      gear.pivot.rotation.y = angle * gear.ratio;
    }
    springSeats(parameters, frame.bodies).forEach(([a, b], i) => {
      const start = new THREE.Vector3(...a).multiplyScalar(1000), end = new THREE.Vector3(...b).multiplyScalar(1000);
      const direction = end.sub(start), length = direction.length(); direction.normalize();
      const fitting = (parameters.spring.free_pin_span_m - parameters.spring.free_length_m) * 500;
      springs[i].position.copy(start).addScaledVector(direction, fitting);
      springs[i].quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
      // A compression spring becomes unloaded beyond its free length; it
      // cannot grow to fill the gap between separated pin fittings.
      springs[i].scale.x = Math.min(parameters.spring.free_length_m * 1000, Math.max(.1, length - 2 * fitting)) / 50;
    });
  }
  function display(mode) {
    root.visible = mode !== 'physics';
    for (const mesh of meshes) {
      const p = mesh.userData.part, ghost = mode === 'cutaway' && (p.skin || p.material === 'tire' || p.name.endsWith('_rim'));
      mesh.visible = !(mode === 'cutaway' && ['glass', 'light'].includes(p.material));
      mesh.material.transparent = ghost; mesh.material.opacity = ghost ? .075 : 1;
      mesh.material.depthWrite = !ghost; mesh.material.needsUpdate = true; mesh.castShadow = !ghost;
    }
  }
  return {root, groups, apply, display};
}

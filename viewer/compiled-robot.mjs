import * as THREE from 'three';

// Compiled MuJoCo hulls in body-local metres, with recorded world body transforms.
export function compiledRobot(parts, scale = 1) {
  const root = new THREE.Group(), groups = {};
  for (const part of parts) {
    const group = groups[part.body] ??= new THREE.Group();
    if (!group.parent) root.add(group);
    let geometry;
    if (part.kind === 'mesh') {
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices.flat(), 3));
      geometry.setIndex(part.triangles.flat()); geometry.computeVertexNormals();
    } else if (part.kind === 'cylinder') {
      geometry = new THREE.CylinderGeometry(part.radius, part.radius, part.length, 48);
      geometry.rotateX(Math.PI / 2);
    } else throw Error('Unknown compiled geometry: ' + part.kind);
    geometry.scale(scale, scale, scale);
    const material = new THREE.MeshStandardMaterial({color: new THREE.Color(...part.color), roughness: .65, metalness: .08, flatShading: part.kind === 'mesh'});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.set(...part.pos.map(v => v * scale));
    mesh.quaternion.set(part.quat[1], part.quat[2], part.quat[3], part.quat[0]);
    group.add(mesh);
  }
  return {root, groups};
}

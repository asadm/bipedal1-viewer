// Replay ground is reconstructed from the compiled collision heightfield.
// Rows increase along world Y; MuJoCo splits every cell along 00 → 11.
export function heightfieldBuffers(field, scale = 1000) {
  const rows = field.heights_m?.length, cols = field.heights_m?.[0]?.length;
  if (field.kind !== 'heightfield' || rows < 2 || cols < 2 ||
      field.heights_m.some(row => row.length !== cols || row.some(v => !Number.isFinite(v))) ||
      !field.pos?.every(Number.isFinite) || field.pos.length !== 3 ||
      field.size?.length !== 2 || field.size.some(v => !Number.isFinite(v) || v <= 0)) {
    throw Error('Invalid recorded terrain geometry');
  }
  const positions = new Float32Array(rows * cols * 3);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = (y * cols + x) * 3;
    positions[i] = (field.pos[0] - field.size[0] + 2 * field.size[0] * x / (cols - 1)) * scale;
    positions[i + 1] = (field.pos[1] - field.size[1] + 2 * field.size[1] * y / (rows - 1)) * scale;
    positions[i + 2] = (field.pos[2] + field.heights_m[y][x]) * scale;
  }
  const indices = new Uint32Array((rows - 1) * (cols - 1) * 6);
  let i = 0;
  for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
    const a = y * cols + x, b = a + 1, c = a + cols, d = c + 1;
    indices.set([a, b, d, a, d, c], i); i += 6;
  }
  return {positions, indices};
}

export function terrainView(THREE, fields) {
  const root = new THREE.Group();
  for (const field of fields) {
    const {positions, indices} = heightfieldBuffers(field);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1)); geometry.computeVertexNormals();
    // Color the measured local relief so small fixed stones remain legible
    // under the soft studio lights. This changes appearance, never geometry.
    const rows = field.heights_m.length, cols = field.heights_m[0].length;
    const colors = new Float32Array(rows * cols * 3), low = new THREE.Color('#66765c'), high = new THREE.Color('#a9a18e');
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const z = field.heights_m[y][x];
      const neighborhood = [];
      for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) {
        neighborhood.push(field.heights_m[Math.max(0, Math.min(rows - 1, y + dy))][Math.max(0, Math.min(cols - 1, x + dx))]);
      }
      const relief = Math.max(0, z - Math.min(...neighborhood));
      const color = low.clone().lerp(high, Math.min(1, relief / .012));
      colors.set([color.r, color.g, color.b], (y * cols + x) * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 1});
    const mesh = new THREE.Mesh(geometry, material); mesh.receiveShadow = true;
    root.add(mesh);
  }
  return {root, dispose() {
    for (const mesh of root.children) { mesh.geometry.dispose(); mesh.material.dispose(); }
    root.removeFromParent();
  }};
}

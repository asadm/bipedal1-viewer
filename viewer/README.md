# Interactive CAD viewer

The active design keeps **Beni-style bending legs, rotating hip drives and springs inside the thighs**. The rejected rack-leg preview URL, `simplify.html`, now redirects to the enclosed bending-leg viewer. Further part reduction must retain this mechanism.

The latest **enclosed exterior** is at **http://192.168.86.226:8765/viewer/streamlined.html** (or localhost). It opens at 35 mm extension, with independent travel sliders, comparison against the previous wide thighs, and Cutaway. The tapered structural arms hide the springs in recessed pockets. Narrow dark guide links run inboard, behind the compact TPU spring-pocket lids. Jump replay uses the original drivetrain recording; this enclosure is not dynamically or aerodynamically validated. [Exterior notes and checks](../concept06/exterior.md).

The latest design is at **http://127.0.0.1:8765/viewer/brushless.html**: a recorded **177.6 mm MuJoCo jump**, 99.8 mm independent leg travel, SunnySky brushless hip motors with 20:1 reduction, enclosed wheel-motor housings and a drive cutaway. The full eight-second replay includes landing and recovery. Inspect travel and Cycle travel prescribe geometry; they do not simulate balance. [Concept-06 design, parts and limits](../concept06/README.md).

All 14 nominal/individual-variation simulation checks pass; 250 mm remains unmet, and hardware is untested. Directly open the sliders with `brushless.html?mode=pose`. The previous 69 mm brushed-drive replay remains at `longstroke.html`; the earlier concept-04 jump remains at `fourbar.html?jump=higher`.

Earlier pages remain available: `jump.html` (three-motor physics), `enclosed.html` (concept-02 exterior), `drive.html` (illustrative shared jump drive), and `index.html` (concept-01 height-only mechanism). The detailed controls below describe concept 01.

Run from the workspace root:

```sh
python3 design/viewer/serve.py
```

Open **http://127.0.0.1:8765/viewer/**. To use another port, append `--port 8766` to the command. This serves only `design/`, binding to `0.0.0.0` by default. Use this computer’s LAN IP from another device (currently `http://192.168.86.226:8765/viewer/brushless.html`), or `--host 127.0.0.1` for local-only access. Opening `index.html` directly as a file will not work because the viewer loads CAD assets over HTTP.

Drag to orbit, scroll/pinch to zoom, and right-drag to pan. Focus the canvas for keyboard controls: arrows orbit, plus/minus zoom, Home restores the 3D view. Front, Side, Top and Fit buttons provide quick camera views.

The height slider drives the common upper shock support through its actual 13.98 mm stroke. The original linkage equations solve the corresponding 0–35 mm body rise. The scene transforms the real CAD tessellation from `../output/mesh_normal.json`; it does not substitute a stylized robot. Rigid arms rotate about their pivots, wheels translate to their calculated axle positions, and shocks reorient between their mounts. The loaded spring length remains constant during this level-ground ride-height sweep. No balance or impact dynamics are simulated.

Solid / Ghost / Cutaway change chassis visibility. Cutaway removes the right chassis half. Wheels and battery/electronics can be hidden separately. Click a part to highlight it and read its CAD description; click empty space or Clear to deselect.

Three.js **0.180.0** and its matching OrbitControls are vendored locally under `vendor/` with the MIT license, so runtime operation requires no CDN or network access beyond localhost. Sources: [Three.js repository](https://github.com/mrdoob/three.js/tree/r180), [OrbitControls](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/controls/OrbitControls.js).

After changing the CAD, rebuild it with `.venv/bin/python design/cad/build.py` and reload the page. The viewer rejects a parameter/assembly-manifest mismatch. Run `node design/viewer/verify.mjs` to verify browser-side kinematics against the Python-generated reference fixtures.

Regenerate those fixtures with `python3 design/viewer/export_reference.py` after an intentional CAD parameter change. The verification also compares every transformed part against the separately exported low/raised CAD meshes; current maximum bound difference is below 0.01 mm (tessellation rounding). It checks that both tires remain on the ground throughout the full height sweep.

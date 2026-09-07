# Enclosed concept 02

[Open the new interactive design](http://127.0.0.1:8765/viewer/enclosed.html). Start the existing local server with `python3 design/viewer/serve.py` if needed. The earlier mechanism viewer remains at `/viewer/`.

This is an actual parametric solid-CAD **appearance and packaging concept** for the enclosed jumping direction. It replaces the open side plates with a rounded body, rear closure, TPU lower wrap, covered arms and an integrated fixed face. It does not yet establish a working jump transmission, balance controller, assembly sequence, strength or environmental rating.

The low pose is nominally **160 × 180 × 180 mm**, and the body rises 50 mm to approximately 230 mm overall. It retains Beni's reference width and compact height, with a shorter body. Tessellated/CAD bounding boxes may include about 0.2 mm tolerance. Every printed shape is checked for a single connected solid and a bounding box within 170 × 170 × 180 mm. Print orientation, support removal and fit still need slicer/prototype work; no functional STLs are released for this revision.

## Inspect

- Drag to orbit, scroll to zoom, right-drag to pan. Front, Side, Top and Fit reset the camera.
- The slider changes the **shared nominal arm angle**, moving the body through 50 mm while the tires stay at ground level. It is not the motor-shaft angle: reduction and spring deflection are unselected.
- Enclosed, Ghost and Cutaway show the outside or internal reservations. Cutaway removes the front shell, impact wrap, visor and right arm enclosure.
- **Locate jump drive** opens the cutaway and highlights the orange package low at the rear of the body.
- **Inside the jump drive** opens an [enlarged functional mechanism sketch](http://127.0.0.1:8765/viewer/drive.html). Crouch / Load / Extend / Retract show prescribed input/output angles. An independent left-arm slider shows that the two spring deflections need not match. A single 3:1 gear stage and helical torsion springs illustrate the force path; their dimensions, total reduction and fit are not selected. Separate damping and final bearing/retention details are not depicted.
- **One-wheel bump** places the left wheel on a 12 mm block while prescribing a level body. This demonstrates independent geometry; it does not demonstrate automatic roll leveling or a solved suspension response.
- Click any part for its role and design status. Wheels and part edges can be toggled.

The orange 34 × 74 × 68 mm volume reserves space for a rotary drive/reduction; it is **not the drawing of a selected motor**. The two gold annuli reserve independent elastic couplings. No spring internals, stiffness, preload, damping or torque capacity are established. The gray shaft indicates the proposed common drive axis. The wheel-motor, battery and controller envelopes also require final component selection and retention.

Nine printed-shape envelopes are currently modeled: two body shells, one TPU wrap, two arm/pods, two rims and two wheel-face inserts. Final rim/face integration may reduce that count; internal transmission parts and final small service details are not included. Integral rear screw-boss reservations are present, but nut/insert fits, load-spreading details, bearing supports and service access are not released.

## Files

- [Parameters](parameters.json) and [CadQuery source](build.py)
- [Normal assembly STEP](../output/concept02/beni_enclosed_normal.step), [low](../output/concept02/beni_enclosed_low.step), [extended](../output/concept02/beni_enclosed_raised.step)
- [Exterior render](../output/concept02/hero.png), [cutaway](../output/concept02/cutaway.png)
- [CAD/print-envelope manifest](../output/concept02/manifest.json)
- [Jump architecture and sizing](../jump-upgrade.md)

Rebuild from the workspace root:

```sh
.venv/bin/python design/concept02/build.py
node design/concept02/verify.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python design/concept02/render.py
```

Verification compares browser transforms with separately posed CAD exports and checks the slider/bump range. It does not perform a full solid interference audit. The existing MuJoCo model remains concept 01, with its slow screw drive; it has not been updated to model the provisional rotary jump mechanism.

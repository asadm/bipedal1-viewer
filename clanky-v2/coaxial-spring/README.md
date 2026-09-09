# Aligned spring and directly guided piston — unadopted left-side study

Local inspection: http://localhost:8765/viewer/v2.html?study=spring

The spring and connecting rod now share the Y=74.5 mm plane. A curved steel
rod passes around the knee bearing and drives an 18 mm printed piston in an
integral thigh guide. The piston's clevis also limits rotation in the guide's
side slot. This removes the former lateral spring offset and long, eccentrically
loaded steel guide stem. The M5 bolt now acts as a spring arbor; the printed
piston carries the transverse load. No motor or enclosure print is added.

This replaces eight components on the left with 37 modeled components, including
the retained supported-hip study. The right leg remains the main assembly's old
spring layout. `study.step` contains only the left study, not the complete robot.
The normal V2 viewer and its assembly exports remain unchanged.

| Combined assembly | Main assembly | Left study installed |
|---|---:|---:|
| Modeled solids, including fasteners and motor pieces | 175 | 204 |
| Connected prints | 16 | 16 |
| Printed CAD volume | 542.3 cm³ | 570.7 cm³ |
| Folded mesh bounds, X × Y × Z | about 199 × 252 × 166 mm | about 202 × 252 × 168 mm |

Neither solid count is a purchase count. Both layouts exceed the 180 mm folded
width target. All individual print bounds fit 180 mm, but no sliced plate count,
support plan, final print mass or structural qualification is claimed.

## Geometry and hardware

The knee's spring crank is 18 mm; the curved connecting rod has 30 mm pin centres,
a 4 mm centreline arch, 6 mm nominal stem width and 4 mm lateral thickness.
The original passive tie geometry and hip range −2.8…1.08 rad remain intact.
The piston runs with 0.25 mm nominal radial clearance and has a transverse key.
The knee cavity retains nominal 2.7 mm outer and 3 mm bearing-boss walls. These
are geometry dimensions, not allowable-load results.

The retained [MISUMI SWF12-50 spring](https://vn.misumi-ec.com/vona2/detail/110100185510/?HissuCode=SWF12-50)
is allocated as OD12/ID6.5, free length 50 mm and 5.5 N/mm. Maximum sampled
compression is 19.367 mm, below the existing 20 mm design limit.

Two [Igus GSM-0405-04 bushes](https://www.igus.co.uk/iglidur-ibh/sleeve-bearings/product-details/iglidur-g-m?artnr=GSM-0405-04)
per studied leg use nominal 4 × 5.5 × 4 mm dimensions. The modeled pivot screws
follow the [Accu SKH-M3-8-A2-R360 specification](https://www.accu.co.uk/knurled-socket-shoulder-screws/264005-SKH-M3-8-A2-R360):
Ø4 × 8 mm shoulder, Ø6 × 3 mm head and M3 × 4.5 mm thread. Stock and price are
not confirmed. Other shoulder screws may have different heads or thread lengths;
they are not automatic substitutes. `hardware-sources.json` records the basis.

The M5×60 full-thread bolt, captive M5 nut, captive slider-pivot M3 nut and
crank spacer are nominal hardware allocations. Alloy, press fits, tool access,
locking and the shoulder-screw axial stacks remain unfinished. Custom steel
link/lever production is not included in a priced BOM yet.

## Verification and limits

`fit-diagnostic.json` checks 405 symmetric hip positions against the full shown
assembly, with conservative wheel and spring envelopes. All 37 study meshes
are watertight, consistently wound and within 1% of their CAD volume. Its raw
`passed` flag remains false because it records nominal surface contacts.

`exact-diagnostic.json` follows those contacts with exact CAD intersections,
adds all study-part pairs at Ride and checks the chassis study against all four
electronics reservations. **All 896 checks pass**, with 21 explicitly described
nominal interfaces. Positive overlap is never excused by an interface label.
The export, diagnostic and source hashes bind these results to this revision.

Left and right moving parts occupy disjoint Y intervals, with 127 mm separation.
All modeled joints preserve Y. Thus independent hip angles cannot introduce a
cross-leg collision; fixed-body and within-leg clearance still rely on the finite
sweeps. This is not a continuous tolerance or loaded-clearance proof.

`guide-probe.json` checks 72 material/gap samples at two proposed contact bands
over loaded piston travel. All pass. At five positions across the entire travel,
the piston has zero nominal overlap and reaches an angular stop between 1° and
2° in either direction. These finite material and stop probes do not establish
contact area, pressure, stiffness, allowable torque or wear life.

`load-screen.json` includes guide friction feedback using a conservative 0.82
vertical normal projection, below the probed 0.8297. For assumed friction
coefficients 0…0.4, peak connecting-rod force is about 114…143 N and total guide
normal force about 53…67 N. Nominal pin bending is about 84…106 MPa before stress
concentration, impact and fatigue. These are conditional calculations; no
strength pass or guide material selection is declared.

Ideal spring-pair release over the chosen launch stroke is 2.041 J; modeled
guide friction would consume up to about 0.076 J at μ=0.4. This is spring energy,
not robot jump height. Actual friction, binding, hysteresis and landing loads
have not been identified.

The first four geometry iterations retain their failed diagnostics and builder
snapshots in `first-geometry/` through `fourth-geometry/`. The final cuts remove
the measured crank/link clipping and material that earlier unions refilled in
the bearing seat; no failed pair was silently excluded.

## Rebuild

Run sequentially; do not edit input files while a check is running:

```sh
.venv/bin/python design/clanky-v2/coaxial_spring.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with python-fcl --with rtree python design/clanky-v2/check_coaxial_spring.py
.venv/bin/python design/clanky-v2/check_coaxial_exact.py
.venv/bin/python design/clanky-v2/check_coaxial_guide.py
.venv/bin/python design/clanky-v2/coaxial_load_screen.py
```

## Before adoption

Complete free-spring retention, piston/arbor assembly and tool access, pin
preload/end float, guide material and fits, structural and fatigue checks, hip
drive integration and the right-side equivalent. The free spring can leave a
gap to the piston; the drawn fixed-end coil position does not demonstrate a
physical retainer. Do not use the old spring geometry for this study's plant.

The complete V2 mass, motor-limited dynamics and all required skills remain
unverified. The earlier R2 jump is separate evidence and does not transfer here.
